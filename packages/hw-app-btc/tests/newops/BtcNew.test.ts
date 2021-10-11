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
});
test("getWalletPublicKey p2wpkh", async () => {
  await testGetWalletPublicKey("m/84'/1'/0'", "wpkh(@0)");
  await testGetWalletPublicKey("m/84'/0'/17'", "wpkh(@0)");
});
test("getWalletPublicKey wrapped p2wpkh", async () => {
  await testGetWalletPublicKey("m/49'/1'/0'", "sh(wpkh(@0))");
  await testGetWalletPublicKey("m/49'/0'/17'", "sh(wpkh(@0))");
});
test("getWalletPublicKey p2tr", async () => {
  await testGetWalletPublicKey("m/86'/1'/0'", "tr(@0)");
  await testGetWalletPublicKey("m/86'/0'/17'", "tr(@0)");
});

test("Sign p2pkh", async () => {
  await runSignTransactionTest(p2pkh);
});
test("Sign p2wpkh wrapped", async () => {
  await runSignTransactionTest(wrappedP2wpkh);
});
test("Sign p2wpkh", async () => {
  await runSignTransactionTest(p2wpkh);
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
    outputWriter.writeUInt64(BigInt(output.value*100000000));
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
  fail();
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
  fail();
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
  fail();
}

function getAccountType(coreInput: CoreInput, btc: Btc): AccountType {
  const spentTx = spentTxs[coreInput.txid];
  const splitSpentTx = btc. splitTransaction(spentTx, !!coreInput.txinwitness);
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

type CoreInput = {txid: string, vout: number, scriptSig: {hex: string, [x: string]: unknown}, txinwitness?: string[], sequence: number}
type CoreOutput = {value: number, scriptPubKey: {hex: string, [x: string]: unknown}, [x: string]: unknown}
type CoreTx = {txid: string, vin: CoreInput[], vout: CoreOutput[], hex: string, locktime: number, [x: string]: unknown}
const spentTxs = {
  "5c02391a5b8f55ebb0db0e4e75900ace70f7e8e992115b3931379ab32b69da40": "020000000001016dac615a27b99c5e82af284cc01b410e789047709de08026c861bb6675fbf81800000000171600140fc5a02184f752c41e7f5da947f48646a213e32dfeffffff02ab5b990000000000160014080b627107f555d511730262f3c7167168e0db46a086010000000000220020de4cbf3bfa733a93fc7db03ef7aef2d3aae4e6c04c0ed3a9ebfe6aae259bb7e8024730440220740e00a9cde06677429018b6cadadbdbe7edd2bcd20f8255be2d83560de1490b02206be17eb882b02b25db2367d3afe8b67e6fb62fee2cd8244285403f16efc1886c012103ad62cd5bce8dab660f74c6bdcd4fc2695acdaa3687d8d6901c1cfb35b1211f3b87032000",
  "80453b180c6616431d28d395a6a89cb331d7ecb21bf3ac1cbb68c90dba6e95ff": "02000000015e50f6bfe2d91dc2927ba425fd1617cc2b68d2d7d2b70a3c795c15a9c86f43f1010000006a47304402203c9bf4759c850c43d7c25936c4163a3e6b869cc8a4cce107475fb0447442814c02203630d862ad274ba227ddd8d7ca85580139398b53101d4c4eec9d54712bc4b0420121037ed58c914720772c59f7a1e7e76fba0ef95d7c5667119798586301519b9ad2cfffffffff020000000000000000366a34696f6e3a322e516d66316f75486a46474b48674652716262794a4463454c617369414c595a344d5769797542715877674376695494eded07000000001976a9147628046f6ec479c031d03a47b6a003c4dedb1cad88ac00000000",
  "0d41be343ced2023ff112b123a7bb5c8f345becddb8f1cc7070e1273a21d3710": "0200000000010112fad068799db7637882b643557fb48fd5a7d733276a0e8e96cb44c28e3633230100000000fdffffff01b23f010000000000225120aaeed4185487b0fa6939914cf851cfbe84f5ef098bdc79408e8201b98339a0d80400473044022037ac3cbec286964f3fda9fdd4a73e510d76e829b267aafab392ee23b72d888f602200cc2f93f9251efd6ff1d511384fd0f7d0eb62924444f3806c5ac5e82977e546f0147304402203d5f1ef5cf53bce95e10731375b625dbaf4f6a344cb858d203b422aa421e59e902206fab1e6ee80420a46b5bafbf5ceecd06fd0971080b4c3d0c69d24f953f30ce160169522102bec882e74ae50d719b95087050feb223d9af025d381700c02eb27e8efc5aa50d21038be5e2af3e885abb51d4bd2dbe7bde16d24e1bc3fbe74781ff09645786c7cc262103b135afbeb5dd40aab1fd5e0b19aa537713af8507f01cbfc123a21a750e0efd8753aeb1f61f00",
  "5742c24f1485958d0e36d0ae758b1e33c01ba99107eb54baa539cc7db233a330": "02000000000101b7ff921fcf988d2f394b23f7a9e4648a11e64040d9cbe140d68e9f0fa63b52bd00000000171600142d62a39a40a30228c77de441c1f0993fe1707ddaffffffff02c38f934c0200000017a9145a102ac5376429003168cad88c80331daa3a747187102700000000000017a914c18c7cc194e62a004de3427199417f42d32cd81b870247304402205b615920b281070e99804ef9c5fe57e0595cb0c7968dd5d803cc505f7d28413102202b51ebf4ba70d7f987a98d101e1d60a6b40fba5bcb6ba9261eca9ed3777761cd012103efc6b990c1626d08bd176aab0e545a4f55c627c7ddee878d12bbbc46a126177a00000000",
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
