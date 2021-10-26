/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable prettier/prettier */
import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import { TransportReplayer } from "@ledgerhq/hw-transport-mocker/lib/openTransportReplayer";
import ecc from "tiny-secp256k1";
import { getXpubComponents, pathArrayToString } from "../../src/bip32";
import BtcNew from "../../src/BtcNew";
import {
  DefaultDescriptorTemplate,
  WalletPolicy
} from "../../src/newops/policy";
import { PsbtV2 } from "../../src/newops/psbtv2";
import { AccountType, addressFormatFromDescriptorTemplate, creatDummyXpub, masterFingerprint, runSignTransaction, TestingClient } from "./integrationtools";
import { CoreTx, p2pkh, p2tr, p2wpkh, wrappedP2wpkh, wrappedP2wpkhTwoInputs } from "./testtx";

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

function testPaths(type: AccountType): {ins: string[], out?: string} {
  const basePath = `m/${type}/1'/0'/`;
  const ins = [
    basePath + "0/0",
    basePath + "1/0",
    basePath + "0/1",
    basePath + "1/1",
    basePath + "0/2",
    basePath + "1/2",
  ];
  return {ins};
}

test("Sign p2pkh", async () => {
  const changePubkey = "037ed58c914720772c59f7a1e7e76fba0ef95d7c5667119798586301519b9ad2cf";
  await runSignTransactionTest(p2pkh, AccountType.p2pkh, changePubkey);
});
test("Sign p2wpkh wrapped", async () => {
  let changePubkey = "03efc6b990c1626d08bd176aab0e545a4f55c627c7ddee878d12bbbc46a126177a";
  await runSignTransactionTest(wrappedP2wpkh, AccountType.p2wpkhInP2sh, changePubkey);
  changePubkey = "031175a985c56e310ce3496a819229b427a2172920fd20b5972dda62758c6def09";
  await runSignTransactionTest(wrappedP2wpkhTwoInputs, AccountType.p2wpkhInP2sh, changePubkey);
});
test("Sign p2wpkh", async () => {
  await runSignTransactionTest(p2wpkh, AccountType.p2wpkh);
});
test("Sign p2tr", async () => {
  await runSignTransactionTest(p2tr, AccountType.p2tr);
});

async function runSignTransactionTest(testTx: CoreTx, accountType: AccountType, changePubkey?: string) {
  const [client, transport] = await createClient();
  const accountXpub = "tpubDCwYjpDhUdPGP5rS3wgNg13mTrrjBuG8V9VpWbyptX6TRPbNoZVXsoVUSkCjmQ8jJycjuDKBb9eataSymXakTTaGifxR6kmVsfFehH1ZgJT";
  client.mockGetPubkeyResponse(`m/${accountType}/1'/0'`, accountXpub);
  const paths = testPaths(accountType);
  if (changePubkey) {
    paths.out =  `m/${accountType}/1'/0'` + "/1/3";
    client.mockGetPubkeyResponse(paths.out, creatDummyXpub(Buffer.from(changePubkey, "hex")));
  }
  const tx = await runSignTransaction(testTx, paths, client, transport);
  expect(tx).toEqual(testTx.hex);
  await transport.close();
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

export async function createClient(): Promise<[MockClient, TransportReplayer]> {
  const transport = await openTransportReplayer(RecordStore.fromString(""));
  return [new MockClient(transport), transport];
}

class MockClient extends TestingClient {
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
  async getExtendedPubkey(display: boolean, pathElements: number[]): Promise<string> {
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

