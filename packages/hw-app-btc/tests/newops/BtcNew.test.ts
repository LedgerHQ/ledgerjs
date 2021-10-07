import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import { getXpubComponents, pathArrayToString } from "../../src/bip32";
import BtcNew from "../../src/BtcNew";
import { AppClient } from "../../src/newops/appClient";
import {
  DefaultDescriptorTemplate,
  WalletPolicy,
} from "../../src/newops/policy";
import ecc from "tiny-secp256k1";

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

// test("createPaymentTransactionNew p2pkh", async () => {
//   const client = createClient();
//   const btcNew = new BtcNew(client);
//   btcNew.createPaymentTransactionNew()
// })

async function createClient(): Promise<MockClient> {
  const transport = await openTransportReplayer(RecordStore.fromString(""));
  return new MockClient(transport);
}
async function testGetWalletPublicKey(
  accountPath: string,
  expectedDescriptorTemplate: DefaultDescriptorTemplate
) {
  const client = await createClient();
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
  const result = await btcNew.getWalletPublicKey(path);
  verifyGetWalletPublicKeyResult(result, keyXpub, "testaddress");

  const resultAccount = await btcNew.getWalletPublicKey(accountPath);
  verifyGetWalletPublicKeyResult(resultAccount, accountXpub);
}

function verifyGetWalletPublicKeyResult(
  result: { publicKey: string; bitcoinAddress: string; chainCode: string },
  expectedXpub: string,
  expectedAddress?: string
) {
  if (expectedAddress) expect(result.bitcoinAddress).toEqual("testaddress");
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
  private getWalletAddressKey(
    walletPolicy: WalletPolicy,
    change: number,
    addressIndex: number
  ): string {
    return walletPolicy.serialize().toString("hex") + change + addressIndex;
  }
}
