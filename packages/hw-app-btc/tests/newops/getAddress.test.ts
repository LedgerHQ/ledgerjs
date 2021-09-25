import bippath from "bip32-path";
import { asciiResponse, cla, comm, h, p1p2, statusResponse } from "./common";
import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Btc from "../../src/Btc";
import { StatusCodes, TransportStatusError } from "@ledgerhq/errors";
import { AddressType } from "../../src/newops/getAddress";

/*
addressType: 1 (legacy), 2 (segwit) or 3 (nested segwit)
 */
function getAddressApdu(
  display: boolean,
  addressType: AddressType,
  path: string
): string {
  const pathArray = bippath.fromString(path).toPathArray();
  const data =
    (display ? h(1) : h(0)) +
    h(addressType) +
    h(pathArray.length) +
    pathArray.map((n) => h(n, 4)).join("");
  const dataLength = h(data.length / 2);
  return comm + cla + "01" + p1p2 + dataLength + data;
}

async function run(
  display: boolean,
  addressType: AddressType,
  path: string,
  apdus: string
): Promise<string> {
  const transport = await openTransportReplayer(RecordStore.fromString(apdus));
  const btc = new Btc(transport);
  return btc.btc2getAddress(display, addressType, path);
}

async function expectOk(
  display: boolean,
  addressType: number,
  path: string,
  expectedResult: string
): Promise<void> {
  const apdus = `${getAddressApdu(display, addressType, path)}
    ${asciiResponse(expectedResult)}`;
  return expect(run(display, addressType, path, apdus)).resolves.toEqual(
    expectedResult
  );
}

async function expectFail(
  display: boolean,
  addressType: number,
  path: string
): Promise<void> {
  return expect(run(display, addressType, path, "")).rejects.toBeInstanceOf(
    Error
  );
}

async function expectErrorCode(
  display: boolean,
  addressType: number,
  path: string,
  statusCode: number
): Promise<void> {
  const apdus = `
    ${getAddressApdu(display, addressType, path)}
    ${statusResponse(statusCode)}`;
  return expect(run(display, addressType, path, apdus)).rejects.toEqual(
    new TransportStatusError(statusCode)
  );
}

test("btc2getAddress", async () => {
  return expectOk(true, AddressType.LEGACY, "m/1/2/3/4/5/6", "dummyaddr");
});
test("btc2getAddress too long path", async () => {
  return expectFail(true, 2, "m/1/2/3/4/5/6/7");
});
test("btc2getAddress user rejects", async () => {
  return expectErrorCode(
    true,
    3,
    "m/1/2/3/4/5/6",
    StatusCodes.CONDITIONS_OF_USE_NOT_SATISFIED
  );
});
test("ok with btc2getAddress unexpected address type for standard path", async () => {
  return expectOk(false, AddressType.LEGACY, "m/84'/0'/0'/0'/0/0", "dummyaddr");
});
test("Error on invalid path", async () => {
  return expectFail(false, AddressType.SEGWIT, "n/1/2");
});
