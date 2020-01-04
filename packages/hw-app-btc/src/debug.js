// @flow
import type { Transaction } from "./types";

export function displayTransactionDebug(transaction: Transaction) {
  console.log("version " + transaction.version.toString("hex"));
  transaction.inputs.forEach((input, i) => {
    const prevout = input.prevout.toString("hex");
    const script = input.script.toString("hex");
    const sequence = input.sequence.toString("hex");
    console.log(
      `input ${i} prevout ${prevout} script ${script} sequence ${sequence}`
    );
  });
  (transaction.outputs || []).forEach((output, i) => {
    const amount = output.amount.toString("hex");
    const script = output.script.toString("hex");
    console.log(`output ${i} amount ${amount} script ${script}`);
  });
  if (typeof transaction.locktime !== "undefined") {
    console.log("locktime " + transaction.locktime.toString("hex"));
  }
}
