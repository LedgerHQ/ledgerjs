import { expect } from "chai";
import transactions from "./__fixtures__/transactions";

import { getTransport } from "../utils";
import { CLA, INS_ATTEST_UTXO, INS_SET_ATTEST_KEY, ERRORS } from "./constants";

const P1_INIT = 0x01;
const P1_CONTINUE = 0x02;
const CHUNK_SIZE = 255;

describe("attestUtxo", async () => {
  let transport = {};
  let transaction = null;
  let send;
  let reset;
  let isDebug;

  beforeEach(async () => {
    transport = await getTransport();
    transaction = transactions[0];

    send = (p1, p2, data) => transport.send(CLA, INS_ATTEST_UTXO, p1, p2, data);

    reset = async () => {
      try {
        const res = await transport.send(
          CLA,
          0x00,
          0x00,
          0x00,
          Buffer.alloc(0)
        );
        isDebug = (res[4] | 1) == 1;
      } catch (error) {
        // pass
      }
    };

    // forces to switch away from INS_ATTEST_UTXO instruction and thus reset its state
    await reset();
    if (isDebug) {
      // set reference attestation
      await transport.send(
        CLA,
        INS_SET_ATTEST_KEY,
        0x00,
        0x00,
        Buffer.alloc(32)
      );
    }
  });

  afterEach(async () => {
    // forces to switch away from INS_ATTEST_UTXO instruction and thus reset its state
    await reset();
    await transport.close();
  });

  it("Should work", async () => {
    // This is a sanity check test, to make sure the API did not change
    // If it is failing, you have to refactor all other tests

    const txRaw = Buffer.from(transaction.tx, "hex");
    {
      const data = Buffer.alloc(4);
      data.writeUInt32BE(0, 0);
      await send(P1_INIT, 0x00, data);
    }

    let i = 0;
    let tmp;
    while (i < txRaw.length) {
      const chunk = txRaw.slice(i, i + CHUNK_SIZE);
      i += CHUNK_SIZE;
      tmp = await send(P1_CONTINUE, 0x00, chunk);
    }

    if (isDebug) {
      expect(tmp.toString("hex")).to.be.equal(transaction.outputs[0].response);
    } else {
      // We do not have control over attest key
      const dataLen = 2 * (32 + 4 + 8);
      expect(tmp.toString("hex").slice(0, dataLen)).to.be.equal(
        transaction.outputs[0].response.slice(0, dataLen)
      );
    }
  });

  it("Should not permit data after end of transaction", async () => {
    // This is a sanity check test, to make sure the API did not change
    // If it is failing, you have to refactor all other tests

    const txRaw = Buffer.from(transaction.tx + "00", "hex");
    {
      const data = Buffer.alloc(4);
      data.writeUInt32BE(0, 0);
      await send(P1_INIT, 0x00, data);
    }

    const txChunks = [];

    let i = 0;
    while (i < txRaw.length) {
      txChunks.push(txRaw.slice(i, i + CHUNK_SIZE));
      i += CHUNK_SIZE;
    }

    for (const chunk of txChunks.slice(0, -1)) {
      let tmp;
      tmp = await send(P1_CONTINUE, 0x00, chunk);
      expect(tmp.toString("hex")).to.be.equal("9000");
    }

    try {
      await send(P1_CONTINUE, 0x00, txChunks[txChunks.length - 1]);
      throw new Error("should have thrown earlier");
    } catch (error) {
      expect(error.message).to.have.string(ERRORS.INVALID_DATA);
    }
  });

  it("Should not permit continue parameter without initializing first", async () => {
    try {
      const data = Buffer.alloc(4);
      data.writeUInt32BE(0, 0);
      await send(P1_CONTINUE, 0x00, data);

      throw new Error("should have thrown by now");
    } catch (error) {
      expect(error.message).to.have.string(ERRORS.INVALID_STATE);
    }
  });

  it("Should not not allow bad initialization data length (less)", async () => {
    try {
      const data = Buffer.alloc(3);
      await send(P1_INIT, 0x00, data);

      throw new Error("should have thrown by now");
    } catch (error) {
      expect(error.message).to.have.string(ERRORS.INVALID_DATA);
    }
  });

  it("Should not not allow bad initialization data length (more)", async () => {
    try {
      const data = Buffer.alloc(5);
      await send(P1_INIT, 0x00, data);

      throw new Error("should have thrown by now");
    } catch (error) {
      expect(error.message).to.have.string(ERRORS.INVALID_DATA);
    }
  });

  it("Should not permit invalid parameters", async () => {
    const test = async (p1, p2, data) => {
      await reset();
      try {
        await send(p1, p2, data);

        throw new Error("Should have thrown by now");
      } catch (error) {
        const checkError = bits => string =>
          bits.some(bit => string.includes(bit));

        expect(error.message).to.satisfy(
          checkError([ERRORS.INVALID_PARAMETERS, ERRORS.INVALID_STATE])
        );
      }
    };

    const validData = Buffer.alloc(4);

    await test(P1_INIT, 0x55, validData);
    await test(0x55, 0x00, validData);
    await send(P1_INIT, 0x00, validData);
    await test(P1_CONTINUE, 0x55, validData);
  });

  //////////////////////////
  // These tests are slow because they try to do thorough testing.

  /*
  const randInt = n => Math.floor(Math.random() * n);

  it("Should work with various slicings", async () => {
    const testcase = async txChunks => {
      {
        const data = Buffer.alloc(4);
        data.writeUInt32BE(0, 0);
        await send(P1_INIT, 0x00, data);
      }

      for (const chunk of txChunks.slice(0, -1)) {
        const tmp = await send(P1_CONTINUE, 0x00, chunk);
        expect(tmp.toString("hex")).to.be.equal("9000");
      }
      const result = await send(
        P1_CONTINUE,
        0x00,
        txChunks[txChunks.length - 1]
      );
      expect(result.toString("hex")).to.be.equal(
        transaction.outputs[0].response
      );
    };

    for (let i = 0; i < 1000; i++) {
      let txRaw = Buffer.from(transaction.tx, "hex");
      console.log("Trying random split", i);
      const chunks = [];
      while (txRaw.length > 0) {
        const x = randInt(32);
        chunks.push(txRaw.slice(0, x));
        txRaw = txRaw.slice(x);
      }
      //console.log(chunks);
      await testcase(chunks);
    }
  });

  it("Should not crash on random corruption", async () => {
    const testcase = async txChunks => {
      await reset();

      {
        const data = Buffer.alloc(4);
        data.writeUInt32BE(0, 0);
        await send(P1_INIT, 0x00, data);
      }

      try {
        for (const chunk of txChunks.slice(0, -1)) {
          await send(P1_CONTINUE, 0x00, chunk);
        }
      } catch (error) {
        // pass
      }
    };

    for (let i = 0; i < 5000; i++) {
      let txRaw = Buffer.from(transaction.tx, "hex");
      console.log("Trying random corruption", i);
      const chunks = [];

      const ERROR_COUNT = 2;

      for (let i = 0; i < ERROR_COUNT; i++) {
        const pos = randInt(txRaw.length);
        const c = randInt(256);
        txRaw[pos] = c;
      }

      while (txRaw.length > 0) {
        chunks.push(txRaw.slice(0, CHUNK_SIZE));
        txRaw = txRaw.slice(CHUNK_SIZE);
      }
      //console.log(chunks);
      await testcase(chunks);
    }
  });

  it("Should handle insanely long UTxOs", async () => {
    const zlib = require("zlib");
    const fs = require("fs");
    const path = require("path");

    const inp = fs.readFileSync(
      // relative to test/lib
      path.resolve(__dirname, "../../src/direct/__fixtures__/insaneUtxo.bin.gz")
    );

    const txRaw = zlib.unzipSync(inp);

    console.log("Insanely long utxo length:", inp.length);
    {
      const data = Buffer.alloc(4);
      data.writeUInt32BE(4747, 0);
      await send(P1_INIT, 0x00, data);
    }

    let i = 0;
    let tmp;
    while (i < txRaw.length) {
      console.log(i, "/", txRaw.length);
      const chunk = txRaw.slice(i, i + CHUNK_SIZE);
      i += CHUNK_SIZE;
      tmp = await send(P1_CONTINUE, 0x00, chunk);
    }
    console.log(tmp.toString("hex"));

    const tmpHex = tmp.toString("hex");
    const expectedTxHash =
      "37630ca542a8b05b7592db5545b20ec0c8def68dc98a81b9bd35be22ef68471e";
    expect(tmpHex.slice(0, 2 * 32)).to.be.equal(expectedTxHash);
    expect(tmpHex.slice(2 * 32, 2 * 36)).to.be.equal("0000128b");
    expect(tmpHex.slice(2 * 36, 2 * 40)).to.be.equal("00000000");
    expect(tmpHex.slice(2 * 40, 2 * 44)).to.be.equal("0000128b");
  });
  */
});
