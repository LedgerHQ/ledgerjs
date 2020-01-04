// @flow
import type Transport from "@ledgerhq/hw-transport";
import type { Transaction } from "./types";
import { MAX_SCRIPT_BLOCK } from "./constants";
import { createVarint } from "./varint";

export function getTrustedInputRaw(
  transport: Transport<*>,
  transactionData: Buffer,
  indexLookup: ?number
): Promise<string> {
  let data;
  let firstRound = false;
  if (typeof indexLookup === "number") {
    firstRound = true;
    const prefix = Buffer.alloc(4);
    prefix.writeUInt32BE(indexLookup, 0);
    data = Buffer.concat([prefix, transactionData], transactionData.length + 4);
  } else {
    data = transactionData;
  }
  return transport
    .send(0xe0, 0x42, firstRound ? 0x00 : 0x80, 0x00, data)
    .then(trustedInput =>
      trustedInput.slice(0, trustedInput.length - 2).toString("hex")
    );
}

export async function getTrustedInput(
  transport: Transport<*>,
  indexLookup: number,
  transaction: Transaction,
  additionals: Array<string> = []
): Promise<string> {
  const { version, inputs, outputs, locktime } = transaction;
  if (!outputs || !locktime) {
    throw new Error("getTrustedInput: locktime & outputs is expected");
  }
  const isDecred = additionals.includes("decred");
  const isXST = additionals.includes("stealthcoin");

  const processScriptBlocks = async (script, sequence) => {
    const scriptBlocks = [];
    let offset = 0;
    while (offset !== script.length) {
      let blockSize =
        script.length - offset > MAX_SCRIPT_BLOCK
          ? MAX_SCRIPT_BLOCK
          : script.length - offset;
      if (offset + blockSize !== script.length) {
        scriptBlocks.push(script.slice(offset, offset + blockSize));
      } else {
        scriptBlocks.push(
          Buffer.concat([script.slice(offset, offset + blockSize), sequence])
        );
      }
      offset += blockSize;
    }

    // Handle case when no script length: we still want to pass the sequence
    // relatable: https://github.com/LedgerHQ/ledger-live-desktop/issues/1386
    if (script.length === 0) {
      scriptBlocks.push(sequence);
    }

    for (let scriptBlock of scriptBlocks) {
      await getTrustedInputRaw(transport, scriptBlock);
    }
  };

  const processWholeScriptBlock = block => getTrustedInputRaw(transport, block);

  const processInputs = async () => {
    for (let input of inputs) {
      const isXSTV2 =
        isXST &&
        Buffer.compare(version, Buffer.from([0x02, 0x00, 0x00, 0x00])) === 0;
      const treeField = isDecred
        ? input.tree || Buffer.from([0x00])
        : Buffer.alloc(0);
      const data = Buffer.concat([
        input.prevout,
        treeField,
        isXSTV2 ? Buffer.from([0x00]) : createVarint(input.script.length)
      ]);
      await getTrustedInputRaw(transport, data);

      // iteration (eachSeries) ended
      // TODO notify progress
      // deferred.notify("input");
      // Reference: https://github.com/StealthSend/Stealth/commit/5be35d6c2c500b32ed82e5d6913d66d18a4b0a7f#diff-e8db9b851adc2422aadfffca88f14c91R566
      await (isDecred
        ? processWholeScriptBlock(Buffer.concat([input.script, input.sequence]))
        : isXSTV2
        ? processWholeScriptBlock(input.sequence)
        : processScriptBlocks(input.script, input.sequence));
    }

    const data = createVarint(outputs.length);
    const res = await getTrustedInputRaw(transport, data);
    return res;
  };

  const processOutputs = async () => {
    for (let output of outputs) {
      let data = output.amount;
      data = Buffer.concat([
        data,
        isDecred ? Buffer.from([0x00, 0x00]) : Buffer.alloc(0), //Version script
        createVarint(output.script.length),
        output.script
      ]);
      await getTrustedInputRaw(transport, data);
    }

    //Add expiry height for decred
    const finalData = isDecred
      ? Buffer.concat([locktime, Buffer.from([0x00, 0x00, 0x00, 0x00])])
      : locktime;
    const res = await getTrustedInputRaw(transport, finalData);
    return res;
  };

  const data = Buffer.concat([
    transaction.version,
    transaction.timestamp || Buffer.alloc(0),
    createVarint(inputs.length)
  ]);

  return getTrustedInputRaw(transport, data, indexLookup)
    .then(processInputs)
    .then(processOutputs);
}
