// @flow

import type Transport from "@ledgerhq/hw-transport";
import { hashPublicKey } from "./hashPublicKey";
import { getWalletPublicKey } from "./getWalletPublicKey";
import type { AddressFormat } from "./getWalletPublicKey";
import { getTrustedInput } from "./getTrustedInput";
import { startUntrustedHashTransactionInput } from "./startUntrustedHashTransactionInput";
import { serializeTransaction } from "./serializeTransaction";
import { getTrustedInputBIP143 } from "./getTrustedInputBIP143";
import { compressPublicKey } from "./compressPublicKey";
import { signTransaction } from "./signTransaction";
import { hashOutputFull, provideOutputFullChangePath } from "./finalizeInput";
import type { TransactionOutput, Transaction } from "./types";
import {
  DEFAULT_LOCKTIME,
  DEFAULT_SEQUENCE,
  SIGHASH_ALL,
  OP_DUP,
  OP_HASH160,
  HASH_SIZE,
  OP_EQUALVERIFY,
  OP_CHECKSIG
} from "./constants";

export type { AddressFormat };

const defaultsSignTransaction = {
  lockTime: DEFAULT_LOCKTIME,
  sigHashType: SIGHASH_ALL,
  segwit: false,
  additionals: [],
  onDeviceStreaming: _progress => {},
  onDeviceSignatureGranted: () => {},
  onDeviceSignatureRequested: () => {}
};

export type CreateTransactionArg = {
  inputs: Array<[Transaction, number, ?string, ?number]>,
  associatedKeysets: string[],
  changePath?: string,
  outputScriptHex: string,
  lockTime?: number,
  sigHashType?: number,
  segwit?: boolean,
  initialTimestamp?: number,
  additionals: Array<string>,
  expiryHeight?: Buffer,
  onDeviceStreaming?: number => void,
  onDeviceSignatureRequested?: () => void,
  onDeviceSignatureGranted?: () => void
};

export async function createTransaction(
  transport: Transport<*>,
  arg: CreateTransactionArg
) {
  const {
    inputs,
    associatedKeysets,
    changePath,
    outputScriptHex,
    lockTime,
    sigHashType,
    segwit,
    initialTimestamp,
    additionals,
    expiryHeight,
    onDeviceStreaming,
    onDeviceSignatureGranted,
    onDeviceSignatureRequested
  } = {
    ...defaultsSignTransaction,
    ...arg
  };

  const isDecred = additionals.includes("decred");
  const isXST = additionals.includes("stealthcoin");
  const hasTimestamp = initialTimestamp !== undefined;
  let startTime = Date.now();
  const sapling = additionals.includes("sapling");
  const bech32 = segwit && additionals.includes("bech32");
  let useBip143 =
    segwit ||
    (!!additionals &&
      (additionals.includes("abc") ||
        additionals.includes("gold") ||
        additionals.includes("bip143"))) ||
    (!!expiryHeight && !isDecred);
  // Inputs are provided as arrays of [transaction, output_index, optional redeem script, optional sequence]
  // associatedKeysets are provided as arrays of [path]
  const nullScript = Buffer.alloc(0);
  const nullPrevout = Buffer.alloc(0);
  const defaultVersion = Buffer.alloc(4);
  !!expiryHeight && !isDecred
    ? defaultVersion.writeUInt32LE(sapling ? 0x80000004 : 0x80000003, 0)
    : isXST
    ? defaultVersion.writeUInt32LE(2, 0)
    : defaultVersion.writeUInt32LE(1, 0); // Default version to 2 for XST not to have timestamp
  const trustedInputs: Array<*> = [];
  const regularOutputs: Array<TransactionOutput> = [];
  const signatures = [];
  const publicKeys = [];
  let firstRun = true;
  const resuming = false;
  const targetTransaction: Transaction = {
    inputs: [],
    version: defaultVersion,
    timestamp: Buffer.alloc(0)
  };
  const getTrustedInputCall = useBip143
    ? getTrustedInputBIP143
    : getTrustedInput;
  const outputScript = Buffer.from(outputScriptHex, "hex");

  onDeviceStreaming(0);

  // first pass on inputs to get trusted inputs
  for (let input of inputs) {
    if (!resuming) {
      const trustedInput = await getTrustedInputCall(
        transport,
        input[1],
        input[0],
        additionals
      );
      let sequence = Buffer.alloc(4);
      sequence.writeUInt32LE(
        input.length >= 4 && typeof input[3] === "number"
          ? input[3]
          : DEFAULT_SEQUENCE,
        0
      );
      trustedInputs.push({
        trustedInput: true,
        value: Buffer.from(trustedInput, "hex"),
        sequence
      });
    }

    const { outputs } = input[0];
    const index = input[1];
    if (outputs && index <= outputs.length - 1) {
      regularOutputs.push(outputs[index]);
    }

    if (expiryHeight && !isDecred) {
      targetTransaction.nVersionGroupId = Buffer.from(
        sapling ? [0x85, 0x20, 0x2f, 0x89] : [0x70, 0x82, 0xc4, 0x03]
      );
      targetTransaction.nExpiryHeight = expiryHeight;
      // For sapling : valueBalance (8), nShieldedSpend (1), nShieldedOutput (1), nJoinSplit (1)
      // Overwinter : use nJoinSplit (1)
      targetTransaction.extraData = Buffer.from(
        sapling
          ? [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
          : [0x00]
      );
    } else if (isDecred) {
      targetTransaction.nExpiryHeight = expiryHeight;
    }
  }

  targetTransaction.inputs = inputs.map(input => {
    let sequence = Buffer.alloc(4);
    sequence.writeUInt32LE(
      input.length >= 4 && typeof input[3] === "number"
        ? input[3]
        : DEFAULT_SEQUENCE,
      0
    );
    return {
      script: nullScript,
      prevout: nullPrevout,
      sequence
    };
  });

  if (!resuming) {
    // Collect public keys
    const result = [];
    for (let i = 0; i < inputs.length; i++) {
      const r = await getWalletPublicKey(transport, {
        path: associatedKeysets[i]
      });
      onDeviceStreaming((i + 1) / inputs.length);
      result.push(r);
    }
    for (let i = 0; i < result.length; i++) {
      publicKeys.push(
        compressPublicKey(Buffer.from(result[i].publicKey, "hex"))
      );
    }
  }

  if (hasTimestamp) {
    targetTransaction.timestamp = Buffer.alloc(4);
    targetTransaction.timestamp.writeUInt32LE(
      Math.floor(initialTimestamp + (Date.now() - startTime) / 1000),
      0
    );
  }

  onDeviceSignatureRequested();

  if (useBip143) {
    // Do the first run with all inputs
    await startUntrustedHashTransactionInput(
      transport,
      true,
      targetTransaction,
      trustedInputs,
      true,
      !!expiryHeight,
      additionals
    );

    if (!resuming && changePath) {
      await provideOutputFullChangePath(transport, changePath);
    }

    await hashOutputFull(transport, outputScript);
  }

  if (!!expiryHeight && !isDecred) {
    await signTransaction(transport, "", lockTime, SIGHASH_ALL, expiryHeight);
  }

  // Do the second run with the individual transaction
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    let script =
      inputs[i].length >= 3 && typeof input[2] === "string"
        ? Buffer.from(input[2], "hex")
        : !segwit
        ? regularOutputs[i].script
        : Buffer.concat([
            Buffer.from([OP_DUP, OP_HASH160, HASH_SIZE]),
            hashPublicKey(publicKeys[i]),
            Buffer.from([OP_EQUALVERIFY, OP_CHECKSIG])
          ]);
    let pseudoTX = Object.assign({}, targetTransaction);
    let pseudoTrustedInputs = useBip143 ? [trustedInputs[i]] : trustedInputs;
    if (useBip143) {
      pseudoTX.inputs = [{ ...pseudoTX.inputs[i], script }];
    } else {
      pseudoTX.inputs[i].script = script;
    }

    await startUntrustedHashTransactionInput(
      transport,
      !useBip143 && firstRun,
      pseudoTX,
      pseudoTrustedInputs,
      useBip143,
      !!expiryHeight && !isDecred,
      additionals
    );

    if (!useBip143) {
      if (!resuming && changePath) {
        await provideOutputFullChangePath(transport, changePath);
      }
      await hashOutputFull(transport, outputScript, additionals);
    }

    if (firstRun) {
      onDeviceSignatureGranted();
      onDeviceStreaming(0);
    }

    const signature = await signTransaction(
      transport,
      associatedKeysets[i],
      lockTime,
      sigHashType,
      expiryHeight,
      additionals
    );
    onDeviceStreaming((i + 1) / inputs.length);

    signatures.push(signature);
    targetTransaction.inputs[i].script = nullScript;
    if (firstRun) {
      firstRun = false;
    }
  }

  // Populate the final input scripts
  for (let i = 0; i < inputs.length; i++) {
    if (segwit) {
      targetTransaction.witness = Buffer.alloc(0);
      if (!bech32) {
        targetTransaction.inputs[i].script = Buffer.concat([
          Buffer.from("160014", "hex"),
          hashPublicKey(publicKeys[i])
        ]);
      }
    } else {
      const signatureSize = Buffer.alloc(1);
      const keySize = Buffer.alloc(1);
      signatureSize[0] = signatures[i].length;
      keySize[0] = publicKeys[i].length;
      targetTransaction.inputs[i].script = Buffer.concat([
        signatureSize,
        signatures[i],
        keySize,
        publicKeys[i]
      ]);
    }
    let offset = useBip143 ? 0 : 4;
    targetTransaction.inputs[i].prevout = trustedInputs[i].value.slice(
      offset,
      offset + 0x24
    );
  }

  const lockTimeBuffer = Buffer.alloc(4);
  lockTimeBuffer.writeUInt32LE(lockTime, 0);

  var result = Buffer.concat([
    serializeTransaction(
      targetTransaction,
      false,
      targetTransaction.timestamp,
      additionals
    ),
    outputScript
  ]);

  if (segwit && !isDecred) {
    var witness = Buffer.alloc(0);
    for (var i = 0; i < inputs.length; i++) {
      var tmpScriptData = Buffer.concat([
        Buffer.from("02", "hex"),
        Buffer.from([signatures[i].length]),
        signatures[i],
        Buffer.from([publicKeys[i].length]),
        publicKeys[i]
      ]);
      witness = Buffer.concat([witness, tmpScriptData]);
    }
    result = Buffer.concat([result, witness]);
  }

  // FIXME: In ZEC or KMD sapling lockTime is serialized before expiryHeight.
  // expiryHeight is used only in overwinter/sapling so I moved lockTimeBuffer here
  // and it should not break other coins because expiryHeight is false for them.
  // Don't know about Decred though.
  result = Buffer.concat([result, lockTimeBuffer]);

  if (expiryHeight) {
    result = Buffer.concat([
      result,
      targetTransaction.nExpiryHeight || Buffer.alloc(0),
      targetTransaction.extraData || Buffer.alloc(0)
    ]);
  }

  if (isDecred) {
    let decredWitness = Buffer.from([targetTransaction.inputs.length]);
    inputs.forEach((input, inputIndex) => {
      decredWitness = Buffer.concat([
        decredWitness,
        Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
        Buffer.from([0x00, 0x00, 0x00, 0x00]), //Block height
        Buffer.from([0xff, 0xff, 0xff, 0xff]), //Block index
        Buffer.from([targetTransaction.inputs[inputIndex].script.length]),
        targetTransaction.inputs[inputIndex].script
      ]);
    });

    result = Buffer.concat([result, decredWitness]);
  }

  return result.toString("hex");
}
