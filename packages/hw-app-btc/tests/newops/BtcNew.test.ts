/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable prettier/prettier */
import {
  openTransportReplayer,
  RecordStore
} from "@ledgerhq/hw-transport-mocker";
import { TransportReplayer } from "@ledgerhq/hw-transport-mocker/lib/openTransportReplayer";
import bs58check from "bs58check";
import ecc from "tiny-secp256k1";
import { getXpubComponents, pathArrayToString } from "../../src/bip32";
import Btc from "../../src/Btc";
import BtcNew from "../../src/BtcNew";
import { BufferWriter } from "../../src/buffertools";
import { CreateTransactionArg } from "../../src/createTransaction";
import { AppClient } from "../../src/newops/appClient";
import { AddressFormat } from "../../src/getWalletPublicKey";
import {
  DefaultDescriptorTemplate,
  WalletPolicy
} from "../../src/newops/policy";
import { PsbtV2 } from "../../src/newops/psbtv2";
import { Transaction } from "../../src/types";

test("getWalletPublicKey p2pkh", async () => {
  await testGetWalletPublicKey("m/44'/1'/0'", "pkh(@0)");
  await testGetWalletPublicKey("m/44'/0'/17'", "pkh(@0)");
  await testGetWalletPublicKey("m/46'/0'/17'", "pkh(@0)");
  await testGetWalletPublicKey("m/109'/0'/17'", "pkh(@0)");
});
test("getWalletPublicKey p2wpkh", async () => {
  await testGetWalletPublicKey("m/84'/1'/0'", "wpkh(@0)");
  await testGetWalletPublicKey("m/84'/0'/17'", "wpkh(@0)");
  await testGetWalletPublicKey("m/2'/0'/17'", "wpkh(@0)");
});
test("getWalletPublicKey wrapped p2wpkh", async () => {
  await testGetWalletPublicKey("m/49'/1'/0'", "sh(wpkh(@0))");
  await testGetWalletPublicKey("m/49'/0'/17'", "sh(wpkh(@0))");
  await testGetWalletPublicKey("m/9'/0'/17'", "sh(wpkh(@0))");
});
test("getWalletPublicKey p2tr", async () => {
  await testGetWalletPublicKey("m/86'/1'/0'", "tr(@0)");
  await testGetWalletPublicKey("m/86'/0'/17'", "tr(@0)");
  await testGetWalletPublicKey("m/17'", "tr(@0)");
});

test("getWalletXpub normal path", async () => {
  await testGetWalletXpub("m/11'/12'");
  await testGetWalletXpub("m/11");
  await testGetWalletXpub("m/44'/0'/0'");
});

test("Sign p2pkh", async () => {
  await runSignTransactionTest(p2pkh);
});
test("Sign p2wpkh wrapped", async () => {
  await runSignTransactionTest(wrappedP2wpkh);
  await runSignTransactionTest(wrappedP2wpkhTwoInputs);
});
test("Sign p2wpkh", async () => {
  await runSignTransactionTest(p2wpkh);
  await runSignTransactionTest(p2wpkhTwoInputs);
});
test("Sign p2tr", async () => {
  await runSignTransactionTest(p2tr);
});

async function runSignTransactionTest(testTx: CoreTx) {
  const [client, transport] = await createClient();
  const btcNew = new BtcNew(client);
  // btc is needed to perform some functions like splitTransaction.
  const btc = new Btc(transport);
  const accountType = getAccountType(testTx.vin[0], btc);
  const additionals: string[] = [];
  if (accountType == AccountType.p2wpkh) {
    additionals.push("bech32");
  }
  if (accountType == AccountType.p2tr) {
    additionals.push("bech32m");
  }
  const associatedKeysets: string[] = [];
  const accountXpub = "tpubDCwYjpDhUdPGP5rS3wgNg13mTrrjBuG8V9VpWbyptX6TRPbNoZVXsoVUSkCjmQ8jJycjuDKBb9eataSymXakTTaGifxR6kmVsfFehH1ZgJT";
  client.mockGetPubkeyResponse(`m/${accountType}/1'/0'`, accountXpub);
  const yieldSigs = new Map<number, Buffer>();
  const inputs = testTx.vin.map((input, index) => {
    const path = `m/${accountType}/1'/0'/${index % 2}/${index}`;
    associatedKeysets.push(path);
    const inputData = createInput(input, btc);
    const pubkey = getPubkey(index, accountType, testTx, inputData[0], inputData[1]);
    const mockXpub = creatDummyXpub(pubkey);
    client.mockGetPubkeyResponse(path, mockXpub);
    yieldSigs.set(index, getSignature(input, accountType));
    return inputData;
  });
  client.mockSignPsbt(yieldSigs);
  const outputWriter = new BufferWriter();
  outputWriter.writeVarInt(testTx.vout.length);
  testTx.vout.forEach((output) => {
    outputWriter.writeUInt64(BigInt(Number.parseFloat((output.value * 100000000).toFixed(8))));
    outputWriter.writeVarSlice(Buffer.from(output.scriptPubKey.hex, "hex"));
  });
  const outputScriptHex = outputWriter.buffer().toString("hex");
  
  const arg: CreateTransactionArg = {    
    inputs,
    additionals,
    associatedKeysets,
    changePath: `m/${accountType}/1'/0'/1/100`,
    outputScriptHex,
    lockTime: testTx.locktime,
    segwit: accountType != AccountType.p2pkh,    
  };
  client.mockGetPubkeyResponse(arg.changePath!, creatDummyXpub(Buffer.alloc(32, 0)));
  const tx = await btcNew.createPaymentTransactionNew(arg);
  expect(tx).toEqual(testTx.hex);
};

function addressFormatFromDescriptorTemplate(descTemp: DefaultDescriptorTemplate): AddressFormat {
  if (descTemp == "tr(@0)") return "bech32m";
  if (descTemp == "pkh(@0)") return "legacy";
  if (descTemp == "wpkh(@0)") return "bech32";
  if (descTemp == "sh(wpkh(@0))") return "p2sh";
  throw new Error();
}

enum AccountType {
  p2tr = "86'",
  p2wpkh = "84'",
  p2wpkhInP2sh = "49'",
  p2pkh = "44'"
}

function getPubkey(inputIndex: number, accountType: AccountType, testTx: CoreTx, spentTx: Transaction, spentOutputIndex: number): Buffer {
  const scriptSig = Buffer.from(testTx.vin[inputIndex].scriptSig.hex, "hex");
  if (accountType == AccountType.p2pkh) {    
    return scriptSig.slice(scriptSig.length-33);
  }
  if (accountType == AccountType.p2tr) {
    return spentTx.outputs![spentOutputIndex].script.slice(2, 34); // 32 bytes x-only pubkey
  }
  if (accountType == AccountType.p2wpkh || accountType == AccountType.p2wpkhInP2sh) {
    return Buffer.from(testTx.vin[inputIndex].txinwitness![1], "hex");
  }
  throw new Error();
}

function getSignature(testTxInput: CoreInput, accountType: AccountType): Buffer {
  const scriptSig = Buffer.from(testTxInput.scriptSig.hex, "hex");
  if (accountType == AccountType.p2pkh) {
    return scriptSig.slice(1, scriptSig.length-34);
  }
  if (accountType == AccountType.p2tr) {
    return Buffer.from(testTxInput.txinwitness![0], "hex");
  }
  if (accountType == AccountType.p2wpkh || accountType == AccountType.p2wpkhInP2sh) {
    return Buffer.from(testTxInput.txinwitness![0], "hex");
  }
  throw new Error();
}

function getAccountType(coreInput: CoreInput, btc: Btc): AccountType {
  const spentTx = spentTxs[coreInput.txid];
  if (!spentTx) {
    throw new Error("Spent tx " + coreInput.txid + " unavailable.");
  }
  const splitSpentTx = btc.splitTransaction(spentTx, !!coreInput.txinwitness);
  const spentOutput = splitSpentTx.outputs![coreInput.vout];
  const script = spentOutput.script;
  if (script.length == 34 && script[0] == 0x51) {
    return AccountType.p2tr;
  }
  if (script.length == 22 && script[0] == 0x00) {
    return AccountType.p2wpkh;
  }
  if (script.length == 23) {
    return AccountType.p2wpkhInP2sh;
  }
  return AccountType.p2pkh;
}

function creatDummyXpub(pubkey: Buffer): string {
  const xpubDecoded = bs58check.decode("tpubDHcN44A4UHqdHJZwBxgTbu8Cy87ZrZkN8tQnmJGhcijHqe4rztuvGcD4wo36XSviLmiqL5fUbDnekYaQ7LzAnaqauBb9RsyahsTTFHdeJGd");
  const pubkey33 = pubkey.length == 33 ? pubkey : Buffer.concat([Buffer.of(2), pubkey]);
  xpubDecoded.fill(pubkey33, xpubDecoded.length-33);
  return bs58check.encode(xpubDecoded);
}

function createInput(coreInput: CoreInput, btc: Btc): [Transaction, number, string, number] {
  const spentTx = spentTxs[coreInput.txid];
  if (!spentTx) {
    throw new Error("Spent tx " + coreInput.txid + " unavailable.");
  }
  const splitSpentTx = btc.splitTransaction(spentTx, !!coreInput.txinwitness);
  const scriptSig = coreInput.scriptSig;
  let redeemScript;
  if (scriptSig?.hex && scriptSig.hex.startsWith("160014")) {
    redeemScript = scriptSig.hex.substring(2);
  }
  return [splitSpentTx, coreInput.vout, redeemScript, coreInput.sequence];
}

async function createClient(): Promise<[MockClient, TransportReplayer]> {
  const transport = await openTransportReplayer(RecordStore.fromString(""));
  return [new MockClient(transport), transport];
}

async function testGetWalletXpub(path: string, version = 0x043587cf) {
  const [client] = await createClient();
  const expectedXpub = "tpubDCwYjpDhUdPGP5rS3wgNg13mTrrjBuG8V9VpWbyptX6TRPbNoZVXsoVUSkCjmQ8jJycjuDKBb9eataSymXakTTaGifxR6kmVsfFehH1ZgJT";
  client.mockGetPubkeyResponse(path, expectedXpub);
  const btc = new BtcNew(client);
  const result = await btc.getWalletXpub({path: path, xpubVersion: version});
  expect(result).toEqual(expectedXpub);
}
async function testGetWalletPublicKey(
  accountPath: string,
  expectedDescriptorTemplate: DefaultDescriptorTemplate
) {
  const [client] = await createClient();
  const path = accountPath + "/0/0";
  const accountXpub =
    "tpubDCwYjpDhUdPGP5rS3wgNg13mTrrjBuG8V9VpWbyptX6TRPbNoZVXsoVUSkCjmQ8jJycjuDKBb9eataSymXakTTaGifxR6kmVsfFehH1ZgJT";
  const keyXpub =
    "tpubDHcN44A4UHqdHJZwBxgTbu8Cy87ZrZkN8tQnmJGhcijHqe4rztuvGcD4wo36XSviLmiqL5fUbDnekYaQ7LzAnaqauBb9RsyahsTTFHdeJGd";
  client.mockGetPubkeyResponse(accountPath, accountXpub);
  client.mockGetPubkeyResponse(path, keyXpub);
  const key = `[${masterFingerprint.toString("hex")}${accountPath.substring(
    1
  )}]${accountXpub}/**`;
  client.mockGetWalletAddressResponse(
    new WalletPolicy(expectedDescriptorTemplate, key),
    0,
    0,
    "testaddress"
  );

  const btcNew = new BtcNew(client);
  const addressFormat = addressFormatFromDescriptorTemplate(expectedDescriptorTemplate);
  const result = await btcNew.getWalletPublicKey(path, {format: addressFormat});
  verifyGetWalletPublicKeyResult(result, keyXpub, "testaddress");

  const resultAccount = await btcNew.getWalletPublicKey(accountPath);
  verifyGetWalletPublicKeyResult(resultAccount, accountXpub);
}

function verifyGetWalletPublicKeyResult(
  result: { publicKey: string; bitcoinAddress: string; chainCode: string },
  expectedXpub: string,
  expectedAddress?: string
) {
  expect(result.bitcoinAddress).toEqual(expectedAddress ?? "");
  const expectedComponents = getXpubComponents(expectedXpub);
  const expectedPubKey = Buffer.from(
    ecc.pointCompress(expectedComponents.pubkey, false)
  );
  expect(expectedPubKey.length).toEqual(65);
  expect(result.chainCode).toEqual(
    expectedComponents.chaincode.toString("hex")
  );
  expect(result.publicKey).toEqual(expectedPubKey.toString("hex"));
}

const masterFingerprint = Buffer.of(1, 2, 3, 4);
class MockClient extends AppClient {
  getPubkeyResponses = new Map();
  getWalletAddressResponses = new Map();
  yieldSigs: Map<number, Buffer>[] = [];
  mockGetPubkeyResponse(pathElements: string, response: string) {
    this.getPubkeyResponses.set(pathElements, response);
  }
  mockGetWalletAddressResponse(
    walletPolicy: WalletPolicy,
    change: number,
    addressIndex: number,
    response: string
  ) {
    const key = this.getWalletAddressKey(walletPolicy, change, addressIndex);
    this.getWalletAddressResponses.set(key, response);
  }
  mockSignPsbt(yieldSigs: Map<number, Buffer>) {
    this.yieldSigs.push(yieldSigs);
  }
  async getPubkey(display: boolean, pathElements: number[]): Promise<string> {
    const path = pathArrayToString(pathElements);
    const response = this.getPubkeyResponses.get(path);
    if (!response) {
      throw new Error("No getPubkey response prepared for " + path);
    }
    return response;
  }

  async getWalletAddress(
    walletPolicy: WalletPolicy,
    walletHMAC: Buffer | null,
    change: number,
    addressIndex: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    display: boolean
  ): Promise<string> {
    const key = this.getWalletAddressKey(walletPolicy, change, addressIndex);
    const response = this.getWalletAddressResponses.get(key);
    if (!response) {
      throw new Error("No getWalletAddress response prepared for " + key);
    }
    return response;
  }
  async getMasterFingerprint(): Promise<Buffer> {
    return masterFingerprint;
  }
  async signPsbt(
    _psbt: PsbtV2,
    _walletPolicy: WalletPolicy,
    _walletHMAC: Buffer | null
  ): Promise<Map<number, Buffer>> {
    return this.yieldSigs.splice(0, 1)[0];
  }
  private getWalletAddressKey(
    walletPolicy: WalletPolicy,
    change: number,
    addressIndex: number
  ): string {
    return walletPolicy.serialize().toString("hex") + change + addressIndex;
  }
}

/*
To find example transactions:
for h in `./bitcoin-cli getblock 00000000025a711e6cd4bce9138dc852232a4494afbf36d8bb80499a786da2a4|jq '.tx[]'`; do ./bitcoin-cli getrawtransaction `echo $h | sed 's/"//g'` 1; done > 00000000025a711e6cd4bce9138dc852232a4494afbf36d8bb80499a786da2a4
*/
type CoreInput = {txid: string, vout: number, scriptSig: {hex: string, [x: string]: unknown}, txinwitness?: string[], sequence: number}
type CoreOutput = {value: number, scriptPubKey: {hex: string, [x: string]: unknown}, [x: string]: unknown}
type CoreTx = {txid: string, vin: CoreInput[], vout: CoreOutput[], hex: string, locktime: number, [x: string]: unknown}
const spentTxs = {
  "5c02391a5b8f55ebb0db0e4e75900ace70f7e8e992115b3931379ab32b69da40": "020000000001016dac615a27b99c5e82af284cc01b410e789047709de08026c861bb6675fbf81800000000171600140fc5a02184f752c41e7f5da947f48646a213e32dfeffffff02ab5b990000000000160014080b627107f555d511730262f3c7167168e0db46a086010000000000220020de4cbf3bfa733a93fc7db03ef7aef2d3aae4e6c04c0ed3a9ebfe6aae259bb7e8024730440220740e00a9cde06677429018b6cadadbdbe7edd2bcd20f8255be2d83560de1490b02206be17eb882b02b25db2367d3afe8b67e6fb62fee2cd8244285403f16efc1886c012103ad62cd5bce8dab660f74c6bdcd4fc2695acdaa3687d8d6901c1cfb35b1211f3b87032000",
  "80453b180c6616431d28d395a6a89cb331d7ecb21bf3ac1cbb68c90dba6e95ff": "02000000015e50f6bfe2d91dc2927ba425fd1617cc2b68d2d7d2b70a3c795c15a9c86f43f1010000006a47304402203c9bf4759c850c43d7c25936c4163a3e6b869cc8a4cce107475fb0447442814c02203630d862ad274ba227ddd8d7ca85580139398b53101d4c4eec9d54712bc4b0420121037ed58c914720772c59f7a1e7e76fba0ef95d7c5667119798586301519b9ad2cfffffffff020000000000000000366a34696f6e3a322e516d66316f75486a46474b48674652716262794a4463454c617369414c595a344d5769797542715877674376695494eded07000000001976a9147628046f6ec479c031d03a47b6a003c4dedb1cad88ac00000000",
  "0d41be343ced2023ff112b123a7bb5c8f345becddb8f1cc7070e1273a21d3710": "0200000000010112fad068799db7637882b643557fb48fd5a7d733276a0e8e96cb44c28e3633230100000000fdffffff01b23f010000000000225120aaeed4185487b0fa6939914cf851cfbe84f5ef098bdc79408e8201b98339a0d80400473044022037ac3cbec286964f3fda9fdd4a73e510d76e829b267aafab392ee23b72d888f602200cc2f93f9251efd6ff1d511384fd0f7d0eb62924444f3806c5ac5e82977e546f0147304402203d5f1ef5cf53bce95e10731375b625dbaf4f6a344cb858d203b422aa421e59e902206fab1e6ee80420a46b5bafbf5ceecd06fd0971080b4c3d0c69d24f953f30ce160169522102bec882e74ae50d719b95087050feb223d9af025d381700c02eb27e8efc5aa50d21038be5e2af3e885abb51d4bd2dbe7bde16d24e1bc3fbe74781ff09645786c7cc262103b135afbeb5dd40aab1fd5e0b19aa537713af8507f01cbfc123a21a750e0efd8753aeb1f61f00",
  "5742c24f1485958d0e36d0ae758b1e33c01ba99107eb54baa539cc7db233a330": "02000000000101b7ff921fcf988d2f394b23f7a9e4648a11e64040d9cbe140d68e9f0fa63b52bd00000000171600142d62a39a40a30228c77de441c1f0993fe1707ddaffffffff02c38f934c0200000017a9145a102ac5376429003168cad88c80331daa3a747187102700000000000017a914c18c7cc194e62a004de3427199417f42d32cd81b870247304402205b615920b281070e99804ef9c5fe57e0595cb0c7968dd5d803cc505f7d28413102202b51ebf4ba70d7f987a98d101e1d60a6b40fba5bcb6ba9261eca9ed3777761cd012103efc6b990c1626d08bd176aab0e545a4f55c627c7ddee878d12bbbc46a126177a00000000",
  "9075ef8fd97f92ff0db344322873f12c42b29661c3960801e05114ba8adcabd6": "0200000000010f92d11e34e34bbb29ddd104b898afd9a3d5898fda185788aa050dabe5de7e380c010000001716001438b60e46e50c1d9ecdf529f6861053ceb7ae704bfdffffff5a17b47e858b5e1bb93e0d537ce3ae81e961f67738d8b6eb6b9262e0eb37c6d3000000001716001400dfc989afe93cffcfdab699dd5444499e556219fdffffffabc944185705072eb219ec78224cc952a4518b5db3a48d640f474f078726d41e01000000171600149a72a581de0529c01c1be5f9da4c5a57266e8265fdffffffd18c7593bd84acf021960a32b51892bc900f68439b9db3585468d48353f3cd1b00000000171600146a072874debcfb08fd5d3e857464aaccc330b8bbfdffffff6690ca0cc641a3fbb62c91293cf11f3157a756427dcf8f9f98d36863a8b2631d000000001716001444089e785379c76f81236e908eacf20402f75f3bfdffffff507f7282a896d1a937c9cee20b16865178bce8d2ccd96d87275b926da677bf8d010000001716001400dfc989afe93cffcfdab699dd5444499e556219fdffffff8c32212f7669800b4c885102df7fa2c58f9da5081eedc12a95807e2753aad0a10000000017160014b939091b7a8fb7f4f4baf61617459fd6a59aac5afdffffff83e6be309de96822dcfa0485255a2232d268049874f4ce1f0316f3074ddfc82d0000000017160014b939091b7a8fb7f4f4baf61617459fd6a59aac5afdfffffff8fa8bbe65f17f240d4bdc7988f66d62d3feb9c5c30f65afdb7cbfe4dc1d897b000000001716001456c66c89e5b3f75b07d3dad4544a00c4c9cfd3a9fdffffffbc1e1066934b242cfaf510b2e36a79b94a0ba0816f897376c8e528377277aebd0000000017160014b939091b7a8fb7f4f4baf61617459fd6a59aac5afdffffff8d12f2196ad8d4492299367989c22c724e0a7d40ab436246847f5d7aab5451c10000000017160014c46b16332c7e7dc1a3700c0513b11de7ddb61eeefdfffffff16da2923302a6ec1406c568952189b0a2b7e45a58388b120965fac72ecd094c0000000017160014c040c70f9ddf7f1b07b0a51c42700919644760b1fdffffffdb11b85eed3aa6bdfd5215f96b5615a14b82f7dac6661f17ec56dcf55e993b2900000000171600142be8df852d88b2cd4027e11d6aa59ea60eabe41bfdffffffcb9e9d8a06acff88fc08f95c21a099b836ed0cd147bcb9e2b88925dc3b481c48000000001716001444089e785379c76f81236e908eacf20402f75f3bfdffffff9ba7464f96b053e164646bfd6b68aa4856d40fc904b77725f926ce658469866f0100000017160014c040c70f9ddf7f1b07b0a51c42700919644760b1fdffffff02e8c41b000000000017a914cbe0cfb39915c0bde11f8140250bdb5d93b2bbb08796f01c060000000017a914369871cf149aafed693a072dc7ece6e4d7ee04a08702473044022017f230ccfdd297a958f78e9ca30687f75272d21fd4dd8ab081f026345f153f9a02207e82078c617b9d1049a81b244ea77699dbba80eabd3103f838d26272687c7b37012103ca50097890e10ff8d838c35f9438b99195e472927b9557726cdfe6ecb1f5566202483045022100c1b180460ded0e5cd3b834eca02640aee098ff00b73f749eaaa6d9b84795edeb02205373f2a236734d2b96e0ed9dae6994e553308bb0e88a7c1dbf1d8ce58b83f95e012103ff28dd4d0ae2c738fc76fd056508f9e498bc7b0de6e78bcd18183214095dcbde0248304502210085e873602054bce661e8029524776e4b6d4f07b560ffa386582d856f3cf05e5802202e99b7f099fc49ff6659aaa2954c9e73add7b61e844b8fce5e9305f071bdd4600121036d65f9fff32f527ef6d95b4fb27b1c49e9e922c6386dcd9bd887c6569d2ee5f002483045022100c140d8350706d222cc501b2aeebfd9931d1312dffd88ed3dc8db03a3b62c9a10022037fbe9fa2d8dc17262e662f313b5377a18cf7e96c74530fa51641febd45a2f1f0121025b56f912f06420cf05dde62a1ff3be9d45cee1ba910682f10a7febad7960412e0247304402207dc275a40b6946095221386838a82048f728989049b3a190f6217a0ff29ed79602202613a0d525b42d179bb8ad12eb3abf9b81e9acbea108f85e8c474392eea87bf2012102075108f2dcd417fdddaa1ccaee42fa90cf7ef18dbae6f3a29d282cb645dfd4840247304402202a79e66ab8c071af688d5d0183e18147d4c9c01170a488635e7eee88a572d774022020dc6bf064031742cf6ca42576d7848444505eaf6ccac689b76658526ad2ddc6012103ff28dd4d0ae2c738fc76fd056508f9e498bc7b0de6e78bcd18183214095dcbde024830450221009ff973377e49753848789dac6b0dac5f51a92acfe0fce1be620b8a7a9c11f69b022056884b948b58ad1ace8a85ed676f76ef6c06dd6a6fe2d717b1cb3cfed8f3851a01210274558f6cc837a6d3fac1b490101d9b7065c6cf6e2b1c0dc25d87e989a97c3f26024730440220207327234dde5b2553572d6daa692bd35c1977007bb20ffbf64f05d3ce92db1f02200d9593dac1a06326229ad1bc92badf0ca3b1d5263936f690cd03762510fdf4f101210274558f6cc837a6d3fac1b490101d9b7065c6cf6e2b1c0dc25d87e989a97c3f2602483045022100b52206df3697cbea5eb8c6e3b8331a3d36c4f3de6a2351bd140051360f2e8aa302203b0bfdab4147192fa2e5d7cce1476115dd751f1854a990afeb060f82c6f3265a01210391047b484be7081c3612493893d54edec45681674289cc7c9df675880dc6416b0247304402203408cab76d3bba6653471ffc3add53232f7bc320d0c24e76f5dd64e24e2801c7022004f82de281b9e634d3b50992d23d8116ca669befbc0eab4cb1eca5fd0b6bb4e001210274558f6cc837a6d3fac1b490101d9b7065c6cf6e2b1c0dc25d87e989a97c3f26024730440220469785ad4507c6ac92a572cbd5a863e19c2cf7bb383b9a03a1933b3f3f00a3df02205f280fa329adf7cfcc2b0b301f1a075d58c47ccdd7717fc7b6d82362b0adc32901210306d8b71d3612580f9a546e654a0150eb2556530250c6a36f50a2a519830f650302473044022075328b4cb0e9c9c39b344303195dd79f3b13906c2f1103a81fb77f5a6db2e235022046cdb5676617b1465abcca7a281ac3915e7de9ff2748eed0adb2b5b6e43041b0012103b34c36986c83afbbc234cf7e88f2717ea2a9c084c600e9ba2f11114940a7f9e80247304402205b4e682586ad51db67c9649552dd9e886b2e9493277a8696e530a2aa380ef0fe022074565b4b33c2153b9654b472ba9836ca824d2b31f1cc177a760745be5bd050b20121023be577036dac8d3e1d661d56589b7076712f2a44fd7d2c149fffcb999e64b58802483045022100f5e61765e412a1772d05fc1cea4b809aa60a2875ab727c7c8650f000948296720220386fbe042068e602cfed5f8d8f84d85b40912b5fbdd8af16b9682dd1b52788e6012102075108f2dcd417fdddaa1ccaee42fa90cf7ef18dbae6f3a29d282cb645dfd48402473044022059b33be7a9abea756630c74670900a32b7ee54c0e51d21e9628c23fddb3d0afe02204fe22442232f61db276cefea9665b7e164c84d5dbd6d53cc66fcc9a30e60c8b4012103b34c36986c83afbbc234cf7e88f2717ea2a9c084c600e9ba2f11114940a7f9e800000000",
  "5512d5788d4c26117f093de91223ef384c3fb22799810a92e3304bb6f0819224": "0200000000010145965c4228caf68517d945edd6011b9ed3acacc25e671d5ff17de63c3f0429bb0000000000feffffff02a4800cb3080000001600149102187fea0ada893fd32a7a823374ea81f428e8102700000000000017a91428b5e7e041bb35cc78793ff6741953a13090ab3d87024730440220303ff0212c80305b78651adf5f4d2de152f093b64afa4b0528f45d1864c2715302207ca67132b1cde92914d8a59664d8cd468358ed90ef7c6110d096d91e1cde02fc01210225682ef649fb604da92c7131baf6c5858b3f06d21e3b8f2d602bb488dbebf05e37052000",
  "d36d3ba59981dab0dad0e02dafa9fa97ad51f4e5a47ffad3ad8544bdb251b70f": "020000000001055aa7ebaae0ed0a026bf72011467deb0d21607714d1787d671a2457db72014267000000001716001463e4abed42b06909dc626f9f14e364d377e3e358fdffffff4fa37ac8b379296682cb4d529f6ea264e7e35c3f595c8c596692c91c0c85ddfd01000000171600147ac8f21860d4a529025b494597174eb1a441a57cfdffffff0c69fc1d2c9a3ae75004eaad986cad6b84a64db33913cb94103037f879da171c00000000171600146f6c84387636a119bdaf92cad81396c2ce7a4d58fdfffffff4640d1312f962506978643ccafb843f0230eb9583d9e9e505035b01bf0dc9720000000017160014fad372f775bbc24ab9a6ea3613a8ef81871f78b1fdffffff8c4ca258a1f248d19b0def11b5e046a3fe623c0d06e65c035f858ffcb267d05a0000000017160014f58147b16bf214794f87b534c00a680fe74135e5fdffffff0230341b000000000017a91443e08be49ad8303db84342b24e7ba49f6b0f487487fa1aa3010000000017a914c5c22cf7cccf3021156ddaded63559437c36fe2c8702483045022100d855db0fadb0d705356bf3d8ee333f3e563bff04cda0f56ff5c7b5c15e2c624602200b5db6961d6e8ceef87da9403305bd099ac3ddad0c9d99e2649dfebbc7242ee201210313092d082133d2219380f9f3829db3a0b177e33bb5e5a5b09d84db0969d2ca2a02483045022100b24f394ac5f7ec7270a03a8c20bb423a6bec4122d261c17bd6b1286e0a9706d402204d3158f865b93a54c0432f5d4ed2ce96ed04aa3ed8561eb60b0cdfedd02747de0121032e12e4ab6dcbca1e3aceaf0ce8621fb21571c067015e181f4b9ddfffc176182c0247304402200296b7f4c81291755b32d4c46b8765bdc4716afba20ba57fb51405a60826c1d002205fd1dbd492472e5754f43e19f224a8ec1c309024b012dbb84197817c844e25f8012102fb6077e1a918e96d2ac9301eeee5cd47929a340bf0639ff2ef0a4a55c743bbd3024830450221009089c07ee3e7232c30e1705c74d4f4e23fca2cb130765d7edc8de37f187e4f8202204f513450265596bd00c1271735f9bbdcc380564773881a4d2dd77d3f506855c7012103f001a06f9bbdbe1a479111232193479d4d1939039a25a678d82bd7b718501a7e024730440220073fb0fde51f53689429044c69758a4ca1963ac857114a4764679fe6197934a10220461aedccc59727a2efd0f8ca63b2f27187c2ca766274e499fb4ac500828c23b5012103147ad367eba82a193f79ed2ad8595ee2adcce26fdda1c2640707abfb9589abe900000000",
  "28ad5054e029252d72da37f13fce66212d7f7763845b4a8c4aaf78e897b2bf9f": "0200000000010129b8fe8705de9e342ab80e5ae4237f05dc467586c8d85fbeb29f750d670a849a0200000017160014c1ac0d63d0258ea1b6fe90ef72d0c35d8d773dd3feffffff030000000000000000166a146f6d6e6900000000800005dd00000017d784000097d31c000000000017a91428b5e7e041bb35cc78793ff6741953a13090ab3d871c0200000000000017a914693e66873dedeaed521e3d2dc646fccfdfa4f3978702473044022063e0349bbb6f6b5346bc12cc94289b3dfe3eedee21c03b9f52cef488ec5fe9e5022027f44fb819331ea3c97be06e85d46a797f91315626895c70fb9d2616a927cb1f012102fb255ed920db5c2f507289202eb60a160e5a067ee7e30199a4ed81b74c22e4412e052000",
};

// Taken from bitcoin-core testnet
const p2tr: CoreTx = {
  "txid": "c77a7c5338ed59b934193209f16ea74ec6d846ef61e9fb9705d99e9896d79e25",
  "hash": "d5b0513aeb462fb52cf977a8d367021fa3e66002194a8b8dd2fe97e6e52b81e4",
  "version": 2,
  "size": 150,
  "vsize": 99,
  "weight": 396,
  "locktime": 2097065,
  "vin": [
    {
      "txid": "0d41be343ced2023ff112b123a7bb5c8f345becddb8f1cc7070e1273a21d3710",
      "vout": 0,
      "scriptSig": {
        "asm": "",
        "hex": ""
      },
      "txinwitness": [
        "8d370b53421e0ae033f736a73af72b35562b584143adca592fd918a0bb252ca904b379393446c8dddba08974a2122802844afcc03ef24bcb2312b81a5c5d65ac"
      ],
      "sequence": 4294967293
    }
  ],
  "vout": [
    {
      "value": 0.00081742,
      "n": 0,
      "scriptPubKey": {
        "asm": "0 f5d7911e8d7c560dfc3cf6e3079a4c7c0dce70e9",
        "hex": "0014f5d7911e8d7c560dfc3cf6e3079a4c7c0dce70e9",
        "reqSigs": 1,
        "type": "witness_v0_keyhash",
        "addresses": [
          "tb1q7htez85d03tqmlpu7m3s0xjv0sxuuu8fg40ght"
        ]
      }
    }
  ],
  "hex": "0200000000010110371da273120e07c71c8fdbcdbe45f3c8b57b3a122b11ff2320ed3c34be410d0000000000fdffffff014e3f010000000000160014f5d7911e8d7c560dfc3cf6e3079a4c7c0dce70e901408d370b53421e0ae033f736a73af72b35562b584143adca592fd918a0bb252ca904b379393446c8dddba08974a2122802844afcc03ef24bcb2312b81a5c5d65aca9ff1f00",
  "blockhash": "0000000000000024a3605855f3b669e9e165ab242e53761ecbaae4b6167829d3",
  "confirmations": 1017,
  "time": 1633037023,
  "blocktime": 1633037023
};

const p2wpkh = {
    "txid": "062c623b6a9486aaa11b60e5c37bddcd6214aa642172d81f485faf3b2fc2996e",
    "hash": "6fabbc622e0d8c9b099fce3a2ac92334a1902302f9f572525b563e3ad97aeab0",
    "version": 2,
    "size": 226,
    "vsize": 145,
    "weight": 577,
    "locktime": 2098057,
    "vin": [
      {
        "txid": "5c02391a5b8f55ebb0db0e4e75900ace70f7e8e992115b3931379ab32b69da40",
        "vout": 0,
        "scriptSig": {
          "asm": "",
          "hex": ""
        },
        "txinwitness": [
          "30440220667c54bc57770a563ef74e68331ee6a27d3a1b073d22e867fda346273d768da50220506609d58f78ab6dfe78d1635cf1974a234347f080da86ed1ee9b0ec345b7c1901",
          "02a236cce923cfb073fd4bfdaf0a8c5ae2f2144052a98549810cd3fe39dcf1e1d7"
        ],
        "sequence": 4294967294
      }
    ],
    "vout": [
      {
        "value": 0.09950330,
        "n": 0,
        "scriptPubKey": {
          "asm": "OP_HASH160 afe05670e110d5203e0544137d2ede18338ced8b OP_EQUAL",
          "hex": "a914afe05670e110d5203e0544137d2ede18338ced8b87",
          "reqSigs": 1,
          "type": "scripthash",
          "addresses": [
            "2N9HAz7E4itqt78dDkN2ZNkAYaKp1pmvnxH"
          ]
        }
      },
      {
        "value": 0.00100000,
        "n": 1,
        "scriptPubKey": {
          "asm": "OP_DUP OP_HASH160 c025f47a88d88b09aa9b4cb7f92010b1d513e300 OP_EQUALVERIFY OP_CHECKSIG",
          "hex": "76a914c025f47a88d88b09aa9b4cb7f92010b1d513e30088ac",
          "reqSigs": 1,
          "type": "pubkeyhash",
          "addresses": [
            "my2wW3Yic3huFYiHWSXy1sMX9DgeQRHmg9"
          ]
        }
      }
    ],
    "hex": "0200000000010140da692bb39a3731395b1192e9e8f770ce0a90754e0edbb0eb558f5b1a39025c0000000000feffffff027ad497000000000017a914afe05670e110d5203e0544137d2ede18338ced8b87a0860100000000001976a914c025f47a88d88b09aa9b4cb7f92010b1d513e30088ac024730440220667c54bc57770a563ef74e68331ee6a27d3a1b073d22e867fda346273d768da50220506609d58f78ab6dfe78d1635cf1974a234347f080da86ed1ee9b0ec345b7c19012102a236cce923cfb073fd4bfdaf0a8c5ae2f2144052a98549810cd3fe39dcf1e1d789032000",
  "blockhash": "0000000000000012201f4dd0b06cdbc3b8a037a5c2c0486c4523688555613a53",
  "confirmations": 16,
  "time": 1633594907,
  "blocktime": 1633594907
};

const wrappedP2wpkh: CoreTx = {
  "txid": "3f3b8e65eb666dc9950ddf1b4b9a7438e9baae710a6a7c06d2582bd2d750ed54",
  "hash": "a3035b0af8eb2176e4e4f459233c7e669e4a8becbf32cee7d1639ba52b671c5b",
  "version": 2,
  "size": 248,
  "vsize": 166,
  "weight": 662,
  "locktime": 0,
  "vin": [
    {
      "txid": "5742c24f1485958d0e36d0ae758b1e33c01ba99107eb54baa539cc7db233a330",
      "vout": 0,
      "scriptSig": {
        "asm": "00142d62a39a40a30228c77de441c1f0993fe1707dda",
        "hex": "1600142d62a39a40a30228c77de441c1f0993fe1707dda"
      },
      "txinwitness": [
        "3045022100d4a981592a3e314ee20c662b7a34339d26855c0ecff1588154f0f41856a17a990220444364570c93d5a7a82de8d863dc51868e69ff357901926eedd43c305e51818701",
        "03efc6b990c1626d08bd176aab0e545a4f55c627c7ddee878d12bbbc46a126177a"
      ],
      "sequence": 4294967295
    }
  ],
  "vout": [
    {
      "value": 98.74662473,
      "n": 0,
      "scriptPubKey": {
        "asm": "OP_HASH160 5a102ac5376429003168cad88c80331daa3a7471 OP_EQUAL",
        "hex": "a9145a102ac5376429003168cad88c80331daa3a747187",
        "reqSigs": 1,
        "type": "scripthash",
        "addresses": [
          "2N1TSArdd2pt9RoqE3LXY55ixpRE9e5aot8"
        ]
      }
    },
    {
      "value": 0.00010000,
      "n": 1,
      "scriptPubKey": {
        "asm": "OP_HASH160 e5776c571979173607c28d5c1882465014b777dc OP_EQUAL",
        "hex": "a914e5776c571979173607c28d5c1882465014b777dc87",
        "reqSigs": 1,
        "type": "scripthash",
        "addresses": [
          "2NEAXntA12Zoa7NdsNyC9ncw7HLKH66jKNH"
        ]
      }
    }
  ],
  "hex": "0200000000010130a333b27dcc39a5ba54eb0791a91bc0331e8b75aed0360e8d9585144fc2425700000000171600142d62a39a40a30228c77de441c1f0993fe1707ddaffffffff024964934c0200000017a9145a102ac5376429003168cad88c80331daa3a747187102700000000000017a914e5776c571979173607c28d5c1882465014b777dc8702483045022100d4a981592a3e314ee20c662b7a34339d26855c0ecff1588154f0f41856a17a990220444364570c93d5a7a82de8d863dc51868e69ff357901926eedd43c305e518187012103efc6b990c1626d08bd176aab0e545a4f55c627c7ddee878d12bbbc46a126177a00000000",
  "blockhash": "00000000c117e8cb6cb65ef6afc22dda3ab906dc6a42669a154fea124ecec3ca",
  "confirmations": 3,
  "time": 1633609698,
  "blocktime": 1633609698
};

const p2pkh: CoreTx = {
  "txid": "03717ce615625148a3a3aad38a68fa2aa68e54633259cb98a7a16c16c33a71c3",
  "hash": "03717ce615625148a3a3aad38a68fa2aa68e54633259cb98a7a16c16c33a71c3",
  "version": 2,
  "size": 254,
  "vsize": 254,
  "weight": 1016,
  "locktime": 0,
  "vin": [
    {
      "txid": "80453b180c6616431d28d395a6a89cb331d7ecb21bf3ac1cbb68c90dba6e95ff",
      "vout": 1,
      "scriptSig": {
        "asm": "304402205c809d58dadb3dbe1b9cf129549036b00f7dfa876f7f6c1686d8df77b69cef2c02206512480ee394c3298c8b66340c0ccddddc3c245b4e870a31bf52c9eec9ad69b6[ALL] 037ed58c914720772c59f7a1e7e76fba0ef95d7c5667119798586301519b9ad2cf",
        "hex": "47304402205c809d58dadb3dbe1b9cf129549036b00f7dfa876f7f6c1686d8df77b69cef2c02206512480ee394c3298c8b66340c0ccddddc3c245b4e870a31bf52c9eec9ad69b60121037ed58c914720772c59f7a1e7e76fba0ef95d7c5667119798586301519b9ad2cf"
      },
      "sequence": 4294967295
    }
  ],
  "vout": [
    {
      "value": 0.00000000,
      "n": 0,
      "scriptPubKey": {
        "asm": "OP_RETURN 696f6e3a322e516d59386b56553674567364344a65764d64656d5a744143635152647675776b546158344d455a4e336778677072",
        "hex": "6a34696f6e3a322e516d59386b56553674567364344a65764d64656d5a744143635152647675776b546158344d455a4e336778677072",
        "type": "nulldata"
      }
    },
    {
      "value": 1.33032112,
      "n": 1,
      "scriptPubKey": {
        "asm": "OP_DUP OP_HASH160 7628046f6ec479c031d03a47b6a003c4dedb1cad OP_EQUALVERIFY OP_CHECKSIG",
        "hex": "76a9147628046f6ec479c031d03a47b6a003c4dedb1cad88ac",
        "reqSigs": 1,
        "type": "pubkeyhash",
        "addresses": [
          "mrHhy9DgpBbDLoJsACv4QXXY7f2B5Fq5o1"
        ]
      }
    }
  ],
  "hex": "0200000001ff956eba0dc968bb1cacf31bb2ecd731b39ca8a695d3281d4316660c183b4580010000006a47304402205c809d58dadb3dbe1b9cf129549036b00f7dfa876f7f6c1686d8df77b69cef2c02206512480ee394c3298c8b66340c0ccddddc3c245b4e870a31bf52c9eec9ad69b60121037ed58c914720772c59f7a1e7e76fba0ef95d7c5667119798586301519b9ad2cfffffffff020000000000000000366a34696f6e3a322e516d59386b56553674567364344a65764d64656d5a744143635152647675776b546158344d455a4e336778677072b0e8ed07000000001976a9147628046f6ec479c031d03a47b6a003c4dedb1cad88ac00000000",
  "blockhash": "0000000000000040f9117341ca31f40e4f440fc6f6552a3b3f15e96ed9edeb3e",
  "confirmations": 1,
  "time": 1633611385,
  "blocktime": 1633611385
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const p2wpkhTwoInputs = {
  "txid": "1913b7b5ffdcb5f32b9aca1f5eec2a189e7c66650f82b560eae211265fc995b7",
  "hash": "c3439dcd3489373c586c7aed48c32f2b5d9c71aad24acd765a61684d98690a3f",
  "version": 2,
  "size": 388,
  "vsize": 226,
  "weight": 904,
  "locktime": 0,
  "vin": [
    {
      "txid": "5512d5788d4c26117f093de91223ef384c3fb22799810a92e3304bb6f0819224",
      "vout": 1,
      "scriptSig": {
        "asm": "0014c1ac0d63d0258ea1b6fe90ef72d0c35d8d773dd3",
        "hex": "160014c1ac0d63d0258ea1b6fe90ef72d0c35d8d773dd3"
      },
      "txinwitness": [
        "30440220543617c5f4504dc29d34d2d06d0d7733dac4ec418b77c67feefb29f3f82ba3d80220690b784c52c3375f4ba9e64cc5c0aeb6a1b9fc6aadda0062905c06ce3bbba57501",
        "02fb255ed920db5c2f507289202eb60a160e5a067ee7e30199a4ed81b74c22e441"
      ],
      "sequence": 4294967295
    },
    {
      "txid": "28ad5054e029252d72da37f13fce66212d7f7763845b4a8c4aaf78e897b2bf9f",
      "vout": 1,
      "scriptSig": {
        "asm": "0014c1ac0d63d0258ea1b6fe90ef72d0c35d8d773dd3",
        "hex": "160014c1ac0d63d0258ea1b6fe90ef72d0c35d8d773dd3"
      },
      "txinwitness": [
        "3044022049e7f3015a33ccdb015fe3891667564fd37111272df57e58447645c7bad8fed0022074d1e93ba946453896d0f0bc500df3a1e0d5bb5ad10cd9906736d5fbaebadd5801",
        "02fb255ed920db5c2f507289202eb60a160e5a067ee7e30199a4ed81b74c22e441"
      ],
      "sequence": 4294967295
    }
  ],
  "vout": [
    {
      "value": 0.01800000,
      "n": 0,
      "scriptPubKey": {
        "asm": "OP_DUP OP_HASH160 f73384bcc3951ab6a75541ff79a9a51f82056ed8 OP_EQUALVERIFY OP_CHECKSIG",
        "hex": "76a914f73384bcc3951ab6a75541ff79a9a51f82056ed888ac",
        "address": "n442v1DrXQNim9gjjctKjyGVoe717hNdtG",
        "type": "pubkeyhash"
      }
    }
  ],
  "hex": "02000000000102249281f0b64b30e3920a819927b23f4c38ef2312e93d097f11264c8d78d512550100000017160014c1ac0d63d0258ea1b6fe90ef72d0c35d8d773dd3ffffffff9fbfb297e878af4a8c4a5b8463777f2d2166ce3ff137da722d2529e05450ad280100000017160014c1ac0d63d0258ea1b6fe90ef72d0c35d8d773dd3ffffffff0140771b00000000001976a914f73384bcc3951ab6a75541ff79a9a51f82056ed888ac024730440220543617c5f4504dc29d34d2d06d0d7733dac4ec418b77c67feefb29f3f82ba3d80220690b784c52c3375f4ba9e64cc5c0aeb6a1b9fc6aadda0062905c06ce3bbba575012102fb255ed920db5c2f507289202eb60a160e5a067ee7e30199a4ed81b74c22e44102473044022049e7f3015a33ccdb015fe3891667564fd37111272df57e58447645c7bad8fed0022074d1e93ba946453896d0f0bc500df3a1e0d5bb5ad10cd9906736d5fbaebadd58012102fb255ed920db5c2f507289202eb60a160e5a067ee7e30199a4ed81b74c22e44100000000",
  "blockhash": "00000000025a711e6cd4bce9138dc852232a4494afbf36d8bb80499a786da2a4",
  "confirmations": 1,
  "time": 1633944124,
  "blocktime": 1633944124
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const wrappedP2wpkhTwoInputs = {
  "txid": "c03119b538c78f56c8ce2e6cc5fc6998d447eeef42e34c12692764a3f1a3da7c",
  "hash": "6b3812304554a6964e43a6971ac533046f4be101e39609f72179856916e20268",
  "version": 2,
  "size": 420,
  "vsize": 257,
  "weight": 1026,
  "locktime": 0,
  "vin": [
    {
      "txid": "9075ef8fd97f92ff0db344322873f12c42b29661c3960801e05114ba8adcabd6",
      "vout": 0,
      "scriptSig": {
        "asm": "0014e4a7ff7c7e16cb6f15914938e2b92e2801220250",
        "hex": "160014e4a7ff7c7e16cb6f15914938e2b92e2801220250"
      },
      "txinwitness": [
        "30450221008a777087167aaeda51cf3532da368a7541630cd7274068ae4353aa1e9e32d7850220628ad0f414ae4cfb7a6dcd590b0e21e003b2ff638c5fc9aaad9b411783b03e3301",
        "02de057221383ed65635568e38d4305d9120a4e68e205734a5f95a8feea3dd5f53"
      ],
      "sequence": 4294967293
    },
    {
      "txid": "d36d3ba59981dab0dad0e02dafa9fa97ad51f4e5a47ffad3ad8544bdb251b70f",
      "vout": 0,
      "scriptSig": {
        "asm": "001442721355859d8f2a461a5badfb19e59a61935692",
        "hex": "16001442721355859d8f2a461a5badfb19e59a61935692"
      },
      "txinwitness": [
        "3045022100e49eac220605239d702261c5929e4544e2d3ea70f3372527cee7f6cb31dabd24022015b67591a07e15a7a35ac5cc775e2abbc7fdf41983ad14438961e76029aee52c01",
        "02783edf31f3a8845c6350d17a254a73561c02f1d00c69a8972fd91472c1920105"
      ],
      "sequence": 4294967293
    }
  ],
  "vout": [
    {
      "value": 0.03532507,
      "n": 0,
      "scriptPubKey": {
        "asm": "OP_HASH160 deb26fa74cb3bb95cd00213172397ec91c5fc9ba OP_EQUAL",
        "hex": "a914deb26fa74cb3bb95cd00213172397ec91c5fc9ba87",
        "address": "2NDYjkqA8jUpMAqU2rBaSumb5bqa41Ri5BM",
        "type": "scripthash"
      }
    },
    {
      "value": 0.00069944,
      "n": 1,
      "scriptPubKey": {
        "asm": "OP_HASH160 c0a4669d0b6fd3ce7b22e158ac160f2e656f2592 OP_EQUAL",
        "hex": "a914c0a4669d0b6fd3ce7b22e158ac160f2e656f259287",
        "address": "2NAopftKM5sNgM7AueL7Cin9NsFv8ykBkUA",
        "type": "scripthash"
      }
    }
  ],
  "hex": "02000000000102d6abdc8aba1451e0010896c36196b2422cf173283244b30dff927fd98fef75900000000017160014e4a7ff7c7e16cb6f15914938e2b92e2801220250fdffffff0fb751b2bd4485add3fa7fa4e5f451ad97faa9af2de0d0dab0da8199a53b6dd3000000001716001442721355859d8f2a461a5badfb19e59a61935692fdffffff02dbe635000000000017a914deb26fa74cb3bb95cd00213172397ec91c5fc9ba87381101000000000017a914c0a4669d0b6fd3ce7b22e158ac160f2e656f259287024830450221008a777087167aaeda51cf3532da368a7541630cd7274068ae4353aa1e9e32d7850220628ad0f414ae4cfb7a6dcd590b0e21e003b2ff638c5fc9aaad9b411783b03e33012102de057221383ed65635568e38d4305d9120a4e68e205734a5f95a8feea3dd5f5302483045022100e49eac220605239d702261c5929e4544e2d3ea70f3372527cee7f6cb31dabd24022015b67591a07e15a7a35ac5cc775e2abbc7fdf41983ad14438961e76029aee52c012102783edf31f3a8845c6350d17a254a73561c02f1d00c69a8972fd91472c192010500000000",
  "blockhash": "00000000025a711e6cd4bce9138dc852232a4494afbf36d8bb80499a786da2a4",
  "confirmations": 1,
  "time": 1633944124,
  "blocktime": 1633944124
};
