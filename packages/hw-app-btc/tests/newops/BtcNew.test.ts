import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import BtcNew from "../../src/BtcNew";
import bippath from "bip32-path";
import { StatusCodes, TransportStatusError } from "@ledgerhq/errors";
import { asciiResponse, cla, comm, h, p1p2, statusResponse } from "./common";
import { AddressFormat } from "../../lib/Btc";

function getpubkey(display: boolean, path: string): string {
  const pathArray = bippath.fromString(path).toPathArray();
  const data =
    (display ? h(1) : h(0)) +
    h(pathArray.length) +
    pathArray.map((n) => h(n, 4)).join("");
  return comm + cla + "00" + p1p2 + h(data.length / 2) + data;
}
async function run(
  display: boolean,
  path: string,
  apdus: string
): Promise<{publicKey: string, bitcoinAddress: string, chainCode: string}> {
  const transport = await openTransportReplayer(RecordStore.fromString(apdus));
  const btc = new BtcNew(transport);
  const params = { verify: display, format: "legacy" as AddressFormat };
  return btc.getWalletPublicKey(path, params);
}
async function expectOk(
  display: boolean,
  path: string,
  expectedResult: string
): Promise<void> {
  const apdus = `
    ${getpubkey(display, path)}
    ${asciiResponse(expectedResult)}`;
  return expect(run(display, path, apdus)).resolves.toEqual(expectedResult);
}
async function expectFail(display: boolean, path: string): Promise<void> {
  return expect(run(display, path, "")).rejects.toBeInstanceOf(Error);
}
async function expectErrorCode(
  display: boolean,
  path: string,
  statusCode: number
): Promise<void> {
  const apdus = `
    ${getpubkey(display, path)}
    ${statusResponse(statusCode)}`;
  return expect(run(display, path, apdus)).rejects.toEqual(
    new TransportStatusError(statusCode)
  );
}

test("btc2getPubkey", async () => {
  // The xpub:
  // tpubDHcN44A4UHqdHJZwBxgTbu8Cy87ZrZkN8tQnmJGhcijHqe4rztuvGcD4wo36XSviLmiqL5fUbDnekYaQ7LzAnaqauBb9RsyahsTTFHdeJGd
  // decodes to (see bip32)
  // 043587cf // version bytes (testnet)
  // 05       // Depth
  // f7ed8b7e // Parent fingerprint
  // 00000000 // Child index
  // 0322c8f681e7274e767cee09b8e41770e6d2afd504fd5f85dfaab3e1ff6cdfcc // chaincode
  // 02ee8608207e21028426f69e76447d7e3d5e077049f5e683c3136c2314762a4718 // pubkey
  // c954d976 // checksum
  return expectOk(
    true,
    "m/1/2/3/4/5/6",
    "tpubDHcN44A4UHqdHJZwBxgTbu8Cy87ZrZkN8tQnmJGhcijHqe4rztuvGcD4wo36XSviLmiqL5fUbDnekYaQ7LzAnaqauBb9RsyahsTTFHdeJGd"
  );
});
test("btc2getPubkey too long path", async () => {
  return expectFail(true, "m/1/2/3/4/5/6/7");
});
test("btc2getPubkey user rejects", async () => {
  return expectErrorCode(
    false,
    "m/1/2/3/4/5/6",
    StatusCodes.CONDITIONS_OF_USE_NOT_SATISFIED
  );
});
