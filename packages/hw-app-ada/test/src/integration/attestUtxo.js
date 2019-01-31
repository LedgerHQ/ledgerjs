import { expect } from "chai";
import transactions from "./__fixtures__/transactions";

import { getAda } from "../utils";

describe("attestUtxo", async () => {
  let ada = {};

  beforeEach(async () => {
    ada = await getAda();
  });

  afterEach(async () => {
    await ada.t.close();
  });

  it("Should succesfuly attest utxo", async () => {
    const transaction = transactions[0];

    for (let i = 0; i < transaction.outputs.length; i++) {
      const { txHashHex, outputIndex, amountStr } = await ada.attestUtxo(
        transaction.tx,
        i
      );

      expect(outputIndex).to.equal(i);
      expect(txHashHex).to.equal(transaction.txHash);
      expect(amountStr).to.equal(transaction.outputs[i].amount);
    }
  });

  it("Should fail attesting invalid transaction", async () => {
    const invalidTransaction = "18915116451515aba6165165151165a1651515b151";

    try {
      await ada.attestUtxo(invalidTransaction, 0);

      throw new Error("Should not be here");
    } catch (error) {
      expect(error.message).not.to.have.string("Should not be here");
    }
  });
});
