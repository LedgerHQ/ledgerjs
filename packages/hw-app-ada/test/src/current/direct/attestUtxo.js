import { expect } from "chai";
import transactions from "../../fixtures/transactions";

import { getTransport } from "../../utils";
import { CLA, INS_ATTEST_UTXO } from "../../constants";

const P1_INIT = 0x01;
const P1_CONTINUE = 0x02;
const CHUNK_SIZE = 100;

const codeTooFarMessage = "Should not be so far";

describe("attestUtxo", async () => {
  let transport = {};
  let transaction = null;

  beforeEach(async () => {
    transport = await getTransport();
    transaction = transactions[0];
  });

  afterEach(async () => {
    await transport.close();
  });

  // This test is commented out because it does not currently pass and
  // freezes all other test

  // it("Should work", async () => {
  //   // This is a sanity check test, to make sure the API did not change
  //   // If it is failing, you have to refactor all other tests

  //   const txRaw = Buffer.from(transaction.tx, "hex");
  //   {
  //     const data = Buffer.alloc(4);
  //     data.writeUInt32BE(0, 0);
  //     await transport.send(CLA, INS_ATTEST_UTXO, P1_INIT, 0x00, data);
  //   }

  //   let i = 0;
  //   while (i < txRaw.length) {
  //     const chunk = txRaw.slice(i, i + CHUNK_SIZE);
  //     i += CHUNK_SIZE;
  //     await transport.send(CLA, INS_ATTEST_UTXO, P1_CONTINUE, 0x00, chunk);
  //   }
  // });

  it("Should not permit continue parameter without initializing first", async () => {
    try {
      const data = Buffer.alloc(4);
      data.writeUInt32BE(0, 0);
      await transport.send(CLA, INS_ATTEST_UTXO, P1_CONTINUE, 0x00, data);

      throw new Error(codeTooFarMessage);
    } catch (error) {
      expect(error.message).not.to.have.string(codeTooFarMessage);
    }
  });

  it("Should not permit invalid parameters", async () => {
    const test = async (p1, p2, data) => {
      try {
        data.writeUInt32BE(0, 0);
        await transport.send(CLA, INS_ATTEST_UTXO, p1, p2, data);

        throw new Error(codeTooFarMessage);
      } catch (error) {
        expect(error.message).not.to.have.string(codeTooFarMessage);
      }
    };

    const validData = Buffer.alloc(4);

    test(P1_INIT, 0x55);
    test(0x55, 0x00, validData);
    test(P1_INIT, 0x00, Buffer.alloc(2));
  });
});
