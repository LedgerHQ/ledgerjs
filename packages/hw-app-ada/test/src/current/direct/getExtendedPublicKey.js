import { expect } from "chai";

import { getTransport, pathToArray } from "../../utils";

const INS_GET_EXT_PUBLIC_KEY = 0x10;
const CLA = 0xd7;

const codeTooFarMessage = "Should not be so far";

const pathToBuffer = path => {
  const pathArray = pathToArray(path);
  const buffer = Buffer.alloc(1 + 4 * pathArray.length);
  buffer.writeUInt8(3, 0);

  for (let i = 0; i < pathArray.length; i++) {
    buffer.writeUInt32BE(pathArray[i], 1 + i * 4);
  }

  return buffer;
};

describe("getExtendedPublicKey", async () => {
  let transport = {};
  let validDataBuffer = null;

  beforeEach(async () => {
    transport = await getTransport();

    validDataBuffer = pathToBuffer("44'/1815'/1'");
  });

  afterEach(async () => {
    await transport.close();
  });

  it("Should work", async () => {
    // This is a sanity check test, to make sure the API did not change
    // If it is failing, you have to refactor all other tests
    await transport.send(
      CLA,
      INS_GET_EXT_PUBLIC_KEY,
      0x00,
      0x00,
      validDataBuffer
    );
  });

  it("Should not permit mismatch between path length and according buffer length", async () => {
    try {
      const data = [...validDataBuffer, 8];

      await transport.send(CLA, INS_GET_EXT_PUBLIC_KEY, 0x00, 0x00, data);

      throw new Error(codeTooFarMessage);
    } catch (error) {
      expect(error.message).not.to.have.string(codeTooFarMessage);
    }
  });

  it("Should not permit unknown P1/P2 parameters", async () => {
    const send = async (p1, p2) => {
      try {
        // invalid P1
        await transport.send(
          CLA,
          INS_GET_EXT_PUBLIC_KEY,
          p1,
          p2,
          validDataBuffer
        );

        throw new Error(codeTooFarMessage);
      } catch (error) {
        expect(error.message).not.to.have.string(codeTooFarMessage);
      }
    };

    // Invalid P1
    await send(0x01, 0x00);

    // // Invalid P2
    await send(0x00, 0x01);
  });

  it("Should not permit path not starting with 44'/1815'/n'", async () => {
    const paths = ["44'", "44'/132'/1'", "33'/1815'/1'", "44'/1815'/1"];

    for (let path of paths) {
      try {
        await transport.send(
          CLA,
          INS_GET_EXT_PUBLIC_KEY,
          0x01,
          0x00,
          pathToBuffer(path)
        );

        throw new Error(codeTooFarMessage);
      } catch (error) {
        expect(error.message).not.to.have.string(codeTooFarMessage);
      }
    }
  });

  it("Should not permit paths longer than 10 indexes", async () => {
    const path = ["44'/1815'/1'/4/5/6/7/8/9/10/11"];

    try {
      await transport.send(
        CLA,
        INS_GET_EXT_PUBLIC_KEY,
        0x01,
        0x00,
        pathToBuffer(path)
      );

      throw new Error(codeTooFarMessage);
    } catch (error) {
      expect(error.message).not.to.have.string(codeTooFarMessage);
    }
  });
});
