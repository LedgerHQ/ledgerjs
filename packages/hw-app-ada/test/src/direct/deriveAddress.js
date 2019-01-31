import { expect } from "chai";

import { getTransport, pathToBuffer } from "../utils";
import { CLA, INS_DERIVE_ADDRESS, ERRORS } from "./constants";

const P1_RETURN = 0x01;
//const P1_DISPLAY = 0x02;

describe("deriveAddress", async () => {
  let validDataBuffer = null;
  let send = null;
  let checkThrows = async (p1, p2, data, errorMsg) => {
    try {
      await send(p1, p2, data);
      throw new Error("should have thrown by now");
    } catch (error) {
      expect(error.message).to.have.string(errorMsg);
    }
  };

  let transport = null;

  beforeEach(async () => {
    transport = await getTransport();

    validDataBuffer = pathToBuffer("44'/1815'/0'/0/0");
    send = (p1, p2, data) =>
      transport.send(CLA, INS_DERIVE_ADDRESS, p1, p2, data);
  });

  afterEach(async () => {
    await transport.close();
  });

  // This is a sanity check test, to make sure the API did not change
  // If it is failing, you have to refactor all other tests
  it("Should work", async () => {
    await send(P1_RETURN, 0x00, validDataBuffer);
  });

  it("Should not permit mismatch between path length and according buffer length (longer)", async () => {
    const data = Buffer.concat([validDataBuffer, Buffer.from("00", "hex")]);
    await checkThrows(P1_RETURN, 0x00, data, ERRORS.INVALID_DATA);
  });

  it("Should not permit mismatch between path length and according buffer length (shorter)", async () => {
    const data = validDataBuffer.slice(0, -1);
    await checkThrows(P1_RETURN, 0x00, data, ERRORS.INVALID_DATA);
  });

  it("Should not permit zero data edge case", async () => {
    await checkThrows(P1_RETURN, 0x00, Buffer.alloc(0), ERRORS.INVALID_DATA);
  });

  it("Should not permit unknown P1/P2 parameters", async () => {
    const testcase = async (p1, p2) =>
      checkThrows(p1, p2, validDataBuffer, ERRORS.INVALID_PARAMETERS);

    // Invalid P1
    await testcase(0x00, 0x00);
    await testcase(0x03, 0x00);

    // // Invalid P2
    await testcase(0x00, 0x01);
  });

  it("Should not permit path not starting with 44'/1815'/x'/(0 or 1)/y", async () => {
    const paths = [
      "44'",
      "44'/132'/1'",
      "33'/1815'/1'",
      "44'/1815'/1",
      "44'/1815'/5'/3/6"
    ];

    const testcase = async path =>
      checkThrows(
        P1_RETURN,
        0x00,
        pathToBuffer(path),
        ERRORS.REJECTED_BY_POLICY
      );

    for (let path of paths) {
      await testcase(path);
    }
  });

  it("Should not permit paths longer than 10 indexes", async () => {
    const path = "44'/1815'/1'/4/5/6/7/8/9/10/11";

    await checkThrows(P1_RETURN, 0x00, pathToBuffer(path), ERRORS.INVALID_DATA);
  });
});
