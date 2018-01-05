/********************************************************************************
 *   Ledger Node JS API
 *   (c) 2016-2017 Ledger
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ********************************************************************************/
//@flow

import { foreach, doIf, asyncWhile, splitPath, eachSeries } from "./utils";
import type LedgerComm from "./LedgerComm";

const MAX_SCRIPT_BLOCK = 50;
const DEFAULT_LOCKTIME = 0;
const DEFAULT_SEQUENCE = 0xffffffff;
const SIGHASH_ALL = 1;

type TransactionInput = {
  prevout: Buffer,
  script: Buffer,
  sequence: Buffer
};
type TransactionOutput = {
  amount: Buffer,
  script: Buffer
};

type Transaction = {
  version: Buffer,
  inputs: TransactionInput[],
  outputs?: TransactionOutput[],
  locktime?: Buffer
};

export default class LedgerBtc {
  comm: LedgerComm;

  constructor(comm: LedgerComm) {
    this.comm = comm;
    comm.setScrambleKey("BTC");
  }

  getWalletPublicKey_async(
    path: string
  ): Promise<{
    publicKey: string,
    bitcoinAddress: string,
    chainCode: string
  }> {
    const paths = splitPath(path);
    const buffer = Buffer.alloc(5 + 1 + paths.length * 4);
    buffer[0] = 0xe0;
    buffer[1] = 0x40;
    buffer[2] = 0x00;
    buffer[3] = 0x00;
    buffer[4] = 1 + paths.length * 4;
    buffer[5] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 6 + 4 * index);
    });
    return this.comm
      .exchange(buffer.toString("hex"), [0x9000])
      .then(responseHex => {
        const response = Buffer.from(responseHex, "hex");
        const publicKeyLength = response[0];
        const addressLength = response[1 + publicKeyLength];
        const publicKey = response
          .slice(1, 1 + publicKeyLength)
          .toString("hex");
        const bitcoinAddress = response
          .slice(
            1 + publicKeyLength + 1,
            1 + publicKeyLength + 1 + addressLength
          )
          .toString("ascii");
        const chainCode = response
          .slice(
            1 + publicKeyLength + 1 + addressLength,
            1 + publicKeyLength + 1 + addressLength + 32
          )
          .toString("hex");
        return { publicKey, bitcoinAddress, chainCode };
      });
  }

  getTrustedInputRaw_async(
    transactionData: Buffer,
    indexLookup: ?number
  ): Promise<string> {
    let data;
    let firstRound = false;
    if (typeof indexLookup === "number") {
      firstRound = true;
      const prefix = Buffer.alloc(4);
      prefix.writeUInt32BE(indexLookup, 0);
      data = Buffer.concat(
        [prefix, transactionData],
        transactionData.length + 4
      );
    } else {
      data = transactionData;
    }
    let buffer = Buffer.alloc(5);
    buffer[0] = 0xe0;
    buffer[1] = 0x42;
    buffer[2] = firstRound ? 0x00 : 0x80;
    buffer[3] = 0x00;
    buffer[4] = data.length;
    buffer = Buffer.concat([buffer, data], 5 + data.length);
    return this.comm
      .exchange(buffer.toString("hex"), [0x9000])
      .then(trustedInput => trustedInput.substring(0, trustedInput.length - 4));
  }

  getTrustedInput_async(
    indexLookup: number,
    transaction: Transaction
  ): Promise<string> {
    const { inputs, outputs, locktime } = transaction;
    if (!outputs || !locktime) {
      throw new Error("getTrustedInput_async: locktime & outputs is expected");
    }

    const processScriptBlocks = (script, sequence) => {
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
      return eachSeries(scriptBlocks, scriptBlock =>
        this.getTrustedInputRaw_async(scriptBlock)
      );
    };

    const processInputs = () => {
      return eachSeries(inputs, input => {
        const data = Buffer.concat([
          input.prevout,
          this.createVarint(input.script.length)
        ]);
        return this.getTrustedInputRaw_async(data).then(() =>
          // iteration (eachSeries) ended
          // TODO notify progress
          // deferred.notify("input");
          processScriptBlocks(input.script, input.sequence)
        );
      }).then(() => {
        const data = this.createVarint(outputs.length);
        return this.getTrustedInputRaw_async(data);
      });
    };

    const processOutputs = () =>
      eachSeries(outputs, output => {
        let data = output.amount;
        data = Buffer.concat([
          data,
          this.createVarint(output.script.length),
          output.script
        ]);
        return this.getTrustedInputRaw_async(data).then(() => {
          // iteration (eachSeries) ended
          // TODO notify progress
          // deferred.notify("output");
        });
      }).then(() => this.getTrustedInputRaw_async(locktime));

    const data = Buffer.concat([
      transaction.version,
      this.createVarint(inputs.length)
    ]);
    return this.getTrustedInputRaw_async(data, indexLookup)
      .then(processInputs)
      .then(processOutputs);
  }

  getVarint(data: Buffer, offset: number): [number, number] {
    if (data[offset] < 0xfd) {
      return [data[offset], 1];
    }
    if (data[offset] === 0xfd) {
      return [(data[offset + 2] << 8) + data[offset + 1], 3];
    }
    if (data[offset] === 0xfe) {
      return [
        (data[offset + 4] << 24) +
          (data[offset + 3] << 16) +
          (data[offset + 2] << 8) +
          data[offset + 1],
        5
      ];
    }

    throw new Error("getVarint called with unexpected parameters");
  }

  startUntrustedHashTransactionInputRaw_async(
    newTransaction: boolean,
    firstRound: boolean,
    transactionData: Buffer
  ) {
    let buffer = Buffer.alloc(5);
    buffer[0] = 0xe0;
    buffer[1] = 0x44;
    buffer[2] = firstRound ? 0x00 : 0x80;
    buffer[3] = newTransaction ? 0x00 : 0x80;
    buffer[4] = transactionData.length;
    buffer = Buffer.concat(
      [buffer, transactionData],
      5 + transactionData.length
    );
    return this.comm.exchange(buffer.toString("hex"), [0x9000]);
  }

  startUntrustedHashTransactionInput_async(
    newTransaction: boolean,
    transaction: Transaction,
    inputs: Array<{ trustedInput: boolean, value: Buffer }>
  ) {
    let data = Buffer.concat([
      transaction.version,
      this.createVarint(transaction.inputs.length)
    ]);
    return this.startUntrustedHashTransactionInputRaw_async(
      newTransaction,
      true,
      data
    ).then(() => {
      let i = 0;
      return eachSeries(transaction.inputs, input => {
        // TODO : segwit
        let prefix;
        if (inputs[i].trustedInput) {
          prefix = Buffer.alloc(2);
          prefix[0] = 0x01;
          prefix[1] = inputs[i].value.length;
        } else {
          prefix = Buffer.alloc(1);
          prefix[0] = 0x00;
        }
        data = Buffer.concat([
          prefix,
          inputs[i].value,
          this.createVarint(input.script.length)
        ]);
        return this.startUntrustedHashTransactionInputRaw_async(
          newTransaction,
          false,
          data
        ).then(() => {
          let scriptBlocks = [];
          let offset = 0;
          if (input.script.length === 0) {
            scriptBlocks.push(input.sequence);
          } else {
            while (offset !== input.script.length) {
              let blockSize =
                input.script.length - offset > MAX_SCRIPT_BLOCK
                  ? MAX_SCRIPT_BLOCK
                  : input.script.length - offset;
              if (offset + blockSize !== input.script.length) {
                scriptBlocks.push(
                  input.script.slice(offset, offset + blockSize)
                );
              } else {
                scriptBlocks.push(
                  Buffer.concat([
                    input.script.slice(offset, offset + blockSize),
                    input.sequence
                  ])
                );
              }
              offset += blockSize;
            }
          }
          return eachSeries(scriptBlocks, scriptBlock => {
            return this.startUntrustedHashTransactionInputRaw_async(
              newTransaction,
              false,
              scriptBlock
            );
          }).then(() => {
            i++;
          });
        });
      });
    });
  }

  provideOutputFullChangePath_async(path: string): Promise<string> {
    let paths = splitPath(path);
    let buffer = Buffer.alloc(5 + 1 + paths.length * 4);
    buffer[0] = 0xe0;
    buffer[1] = 0x4a;
    buffer[2] = 0xff;
    buffer[3] = 0x00;
    buffer[4] = 1 + paths.length * 4;
    buffer[5] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 6 + 4 * index);
    });
    return this.comm.exchange(buffer.toString("hex"), [0x9000]);
  }

  hashOutputFull_async(outputScript: Buffer): Promise<*> {
    let offset = 0;
    return asyncWhile(
      () => offset < outputScript.length,
      () => {
        let blockSize =
          offset + MAX_SCRIPT_BLOCK >= outputScript.length
            ? outputScript.length - offset
            : MAX_SCRIPT_BLOCK;
        let p1 = offset + blockSize === outputScript.length ? 0x80 : 0x00;
        let prefix = Buffer.alloc(5);
        prefix[0] = 0xe0;
        prefix[1] = 0x4a;
        prefix[2] = p1;
        prefix[3] = 0x00;
        prefix[4] = blockSize;
        let data = Buffer.concat([
          prefix,
          outputScript.slice(offset, offset + blockSize)
        ]);
        return this.comm.exchange(data.toString("hex"), [0x9000]).then(() => {
          offset += blockSize;
        });
      }
    );
  }

  signTransaction_async(
    path: string,
    lockTime?: number = DEFAULT_LOCKTIME,
    sigHashType?: number = SIGHASH_ALL
  ): Promise<Buffer> {
    const paths = splitPath(path);
    const buffer = Buffer.alloc(5 + 1 + paths.length * 4 + 1 + 4 + 1);
    let offset = 0;
    buffer[offset++] = 0xe0;
    buffer[offset++] = 0x48;
    buffer[offset++] = 0x00;
    buffer[offset++] = 0x00;
    buffer[offset++] = 1 + paths.length * 4 + 1 + 4 + 1;
    buffer[offset++] = paths.length;
    paths.forEach(element => {
      buffer.writeUInt32BE(element, offset);
      offset += 4;
    });
    buffer[offset++] = 0x00; // authorization length
    buffer.writeUInt32LE(lockTime, offset);
    offset += 4;
    buffer[offset++] = sigHashType;
    return this.comm
      .exchange(buffer.toString("hex"), [0x9000])
      .then(signature => {
        const result = Buffer.from(signature, "hex");
        result[0] = 0x30;
        return result.slice(0, result.length - 2);
      });
  }

  signMessageNew_async(
    path: string,
    messageHex: string
  ): Promise<{ v: number, r: string, s: string }> {
    const paths = splitPath(path);
    const message = new Buffer(messageHex, "hex");
    let offset = 0;
    const apdus = [];
    while (offset !== message.length) {
      let maxChunkSize =
        offset === 0
          ? MAX_SCRIPT_BLOCK - 1 - paths.length * 4 - 4
          : MAX_SCRIPT_BLOCK;
      let chunkSize =
        offset + maxChunkSize > message.length
          ? message.length - offset
          : maxChunkSize;
      const buffer = new Buffer(
        offset === 0 ? 5 + 1 + paths.length * 4 + 2 + chunkSize : 5 + chunkSize
      );
      buffer[0] = 0xe0;
      buffer[1] = 0x4e;
      buffer[2] = 0x00;
      buffer[3] = offset === 0 ? 0x01 : 0x80;
      buffer[4] =
        offset === 0 ? 1 + paths.length * 4 + 2 + chunkSize : chunkSize;
      if (offset === 0) {
        buffer[5] = paths.length;
        paths.forEach((element, index) => {
          buffer.writeUInt32BE(element, 6 + 4 * index);
        });
        buffer.writeUInt16BE(message.length, 6 + 4 * paths.length);
        message.copy(
          buffer,
          6 + 4 * paths.length + 2,
          offset,
          offset + chunkSize
        );
      } else {
        message.copy(buffer, 5, offset, offset + chunkSize);
      }
      apdus.push(buffer.toString("hex"));
      offset += chunkSize;
    }
    return foreach(apdus, apdu => this.comm.exchange(apdu, [0x9000])).then(
      () => {
        const buffer = Buffer.alloc(6);
        buffer[0] = 0xe0;
        buffer[1] = 0x4e;
        buffer[2] = 0x80;
        buffer[3] = 0x00;
        buffer[4] = 0x01;
        buffer[5] = 0x00;
        return this.comm
          .exchange(buffer.toString("hex"), [0x9000])
          .then(apduResponse => {
            const response = Buffer.from(apduResponse, "hex");
            const v = response[0] - 0x30;
            let r = response.slice(4, 4 + response[3]);
            if (r[0] === 0) {
              r = r.slice(1);
            }
            r = r.toString("hex");
            let offset = 4 + response[3] + 2;
            let s = response.slice(offset, offset + response[offset - 1]);
            if (s[0] === 0) {
              s = s.slice(1);
            }
            s = s.toString("hex");
            return { v, r, s };
          });
      }
    );
  }

  createPaymentTransactionNew_async(
    inputs: Array<[Transaction, number, ?string, ?number]>,
    associatedKeysets: string[],
    changePath?: string,
    outputScriptHex: string,
    lockTime?: number = DEFAULT_LOCKTIME,
    sigHashType?: number = SIGHASH_ALL
  ) {
    // Inputs are provided as arrays of [transaction, output_index, optional redeem script, optional sequence]
    // associatedKeysets are provided as arrays of [path]
    const nullScript = Buffer.alloc(0);
    const nullPrevout = Buffer.alloc(0);
    const defaultVersion = Buffer.alloc(4);
    defaultVersion.writeUInt32LE(1, 0);
    const trustedInputs: Array<*> = [];
    const regularOutputs: Array<TransactionOutput> = [];
    const signatures = [];
    const publicKeys = [];
    let firstRun = true;
    const resuming = false;
    const targetTransaction: Transaction = {
      inputs: [],
      version: defaultVersion
    };

    const outputScript = Buffer.from(outputScriptHex, "hex");

    return foreach(inputs, input =>
      doIf(!resuming, () =>
        this.getTrustedInput_async(input[1], input[0]).then(trustedInput => {
          trustedInputs.push({
            trustedInput: true,
            value: Buffer.from(trustedInput, "hex")
          });
        })
      ).then(() => {
        const { outputs } = input[0];
        const index = input[1];
        if (outputs && index <= outputs.length - 1) {
          regularOutputs.push(outputs[index]);
        }
      })
    )
      .then(() => {
        for (let i = 0; i < inputs.length; i++) {
          let sequence = Buffer.alloc(4);
          sequence.writeUInt32LE(
            inputs[i].length >= 4 && typeof inputs[i][3] === "number"
              ? inputs[i][3]
              : DEFAULT_SEQUENCE,
            0
          );
          targetTransaction.inputs.push({
            script: nullScript,
            prevout: nullPrevout,
            sequence
          });
        }
      })
      .then(() => {
        return doIf(!resuming, () =>
          // Collect public keys
          foreach(inputs, (input, i) =>
            this.getWalletPublicKey_async(associatedKeysets[i])
          ).then(result => {
            for (let index = 0; index < result.length; index++) {
              publicKeys.push(
                this.compressPublicKey(
                  Buffer.from(result[index].publicKey, "hex")
                )
              );
            }
          })
        );
      })
      .then(() =>
        foreach(inputs, (input, i) => {
          targetTransaction.inputs[i].script =
            inputs[i].length >= 3 && typeof inputs[i][2] === "string"
              ? Buffer.from(inputs[i][2], "hex")
              : regularOutputs[i].script;
          return this.startUntrustedHashTransactionInput_async(
            firstRun,
            targetTransaction,
            trustedInputs
          ).then(() =>
            Promise.resolve()
              .then(() => {
                if (!resuming && typeof changePath !== "undefined") {
                  return this.provideOutputFullChangePath_async(changePath);
                }
              })
              .then(() => this.hashOutputFull_async(outputScript))
              .then(() =>
                this.signTransaction_async(
                  associatedKeysets[i],
                  lockTime,
                  sigHashType
                ).then(signature => {
                  signatures.push(signature);
                  targetTransaction.inputs[i].script = nullScript;
                  if (firstRun) {
                    firstRun = false;
                  }
                })
              )
          );
        })
      )
      .then(() => {
        // Populate the final input scripts
        for (let i = 0; i < inputs.length; i++) {
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
          targetTransaction.inputs[i].prevout = trustedInputs[i].value.slice(
            4,
            4 + 0x24
          );
        }

        const lockTimeBuffer = Buffer.alloc(4);
        lockTimeBuffer.writeUInt32LE(lockTime, 0);

        const result = Buffer.concat([
          this.serializeTransaction(targetTransaction),
          outputScript,
          lockTimeBuffer
        ]);

        return result.toString("hex");
      });
  }

  signP2SHTransaction_async(
    inputs: Array<[Transaction, number, ?string, ?number]>,
    associatedKeysets: string[],
    outputScriptHex: string,
    lockTime?: number = DEFAULT_LOCKTIME,
    sigHashType?: number = SIGHASH_ALL
  ) {
    // Inputs are provided as arrays of [transaction, output_index, redeem script, optional sequence]
    // associatedKeysets are provided as arrays of [path]
    const nullScript = Buffer.alloc(0);
    const nullPrevout = Buffer.alloc(0);
    const defaultVersion = Buffer.alloc(4);
    defaultVersion.writeUInt32LE(1, 0);
    const trustedInputs = [];
    const regularOutputs: Array<TransactionOutput> = [];
    const signatures = [];
    let firstRun = true;
    let resuming = false;
    let targetTransaction: Transaction = {
      inputs: [],
      version: defaultVersion
    };

    const outputScript = Buffer.from(outputScriptHex, "hex");

    return foreach(inputs, input =>
      doIf(!resuming, () =>
        this.getTrustedInput_async(input[1], input[0]).then(trustedInput => {
          let inputItem = {};
          inputItem.trustedInput = false;
          inputItem.value = Buffer.from(trustedInput, "hex").slice(4, 4 + 0x24);
          trustedInputs.push(inputItem);
        })
      ).then(() => {
        const { outputs } = input[0];
        const index = input[1];
        if (outputs && index <= outputs.length - 1) {
          regularOutputs.push(outputs[index]);
        }
      })
    )
      .then(() => {
        // Pre-build the target transaction
        for (let i = 0; i < inputs.length; i++) {
          let tmp = Buffer.alloc(4);
          let sequence;
          if (inputs[i].length >= 4 && typeof inputs[i][3] === "number") {
            sequence = inputs[i][3];
          } else {
            sequence = DEFAULT_SEQUENCE;
          }
          tmp.writeUInt32LE(sequence, 0);
          targetTransaction.inputs.push({
            prevout: nullPrevout,
            script: nullScript,
            sequence: tmp
          });
        }
      })
      .then(() =>
        foreach(inputs, (input, i) => {
          targetTransaction.inputs[i].script =
            inputs[i].length >= 3 && typeof inputs[i][2] === "string"
              ? Buffer.from(inputs[i][2], "hex")
              : regularOutputs[i].script;
          return this.startUntrustedHashTransactionInput_async(
            firstRun,
            targetTransaction,
            trustedInputs
          )
            .then(() => this.hashOutputFull_async(outputScript))
            .then(() =>
              this.signTransaction_async(
                associatedKeysets[i],
                lockTime,
                sigHashType
              ).then(signature => {
                signatures.push(
                  signature.slice(0, signature.length - 1).toString("hex")
                );
                targetTransaction.inputs[i].script = nullScript;
                if (firstRun) {
                  firstRun = false;
                }
              })
            );
        })
      )
      .then(() => signatures);
  }

  compressPublicKey(publicKey: Buffer): Buffer {
    const prefix = (publicKey[64] & 1) !== 0 ? 0x03 : 0x02;
    const prefixBuffer = Buffer.alloc(1);
    prefixBuffer[0] = prefix;
    return Buffer.concat([prefixBuffer, publicKey.slice(1, 1 + 32)]);
  }

  createVarint(value: number): Buffer {
    if (value < 0xfd) {
      const buffer = Buffer.alloc(1);
      buffer[0] = value;
      return buffer;
    }
    if (value <= 0xffff) {
      const buffer = Buffer.alloc(3);
      buffer[0] = 0xfd;
      buffer[1] = value & 0xff;
      buffer[2] = (value >> 8) & 0xff;
      return buffer;
    }
    const buffer = Buffer.alloc(5);
    buffer[0] = 0xfe;
    buffer[1] = value & 0xff;
    buffer[2] = (value >> 8) & 0xff;
    buffer[3] = (value >> 16) & 0xff;
    buffer[4] = (value >> 24) & 0xff;
    return buffer;
  }

  splitTransaction(transactionHex: string): Transaction {
    const inputs = [];
    const outputs = [];
    let offset = 0;
    const transaction = Buffer.from(transactionHex, "hex");
    const version = transaction.slice(offset, offset + 4);
    offset += 4;
    let varint = this.getVarint(transaction, offset);
    const numberInputs = varint[0];
    offset += varint[1];
    for (let i = 0; i < numberInputs; i++) {
      const prevout = transaction.slice(offset, offset + 36);
      offset += 36;
      varint = this.getVarint(transaction, offset);
      offset += varint[1];
      const script = transaction.slice(offset, offset + varint[0]);
      offset += varint[0];
      const sequence = transaction.slice(offset, offset + 4);
      offset += 4;
      inputs.push({ prevout, script, sequence });
    }
    varint = this.getVarint(transaction, offset);
    const numberOutputs = varint[0];
    offset += varint[1];
    for (let i = 0; i < numberOutputs; i++) {
      const amount = transaction.slice(offset, offset + 8);
      offset += 8;
      varint = this.getVarint(transaction, offset);
      offset += varint[1];
      const script = transaction.slice(offset, offset + varint[0]);
      offset += varint[0];
      outputs.push({ amount, script });
    }
    let locktime = transaction.slice(offset, offset + 4);
    return { version, inputs, outputs, locktime };
  }

  serializeTransactionOutputs({ outputs }: Transaction): Buffer {
    let outputBuffer = Buffer.alloc(0);
    if (typeof outputs !== "undefined") {
      outputBuffer = Buffer.concat([
        outputBuffer,
        this.createVarint(outputs.length)
      ]);
      outputs.forEach(output => {
        outputBuffer = Buffer.concat([
          outputBuffer,
          output.amount,
          this.createVarint(output.script.length),
          output.script
        ]);
      });
    }
    return outputBuffer;
  }

  serializeTransaction(transaction: Transaction) {
    let inputBuffer = Buffer.alloc(0);
    transaction.inputs.forEach(input => {
      inputBuffer = Buffer.concat([
        inputBuffer,
        input.prevout,
        this.createVarint(input.script.length),
        input.script,
        input.sequence
      ]);
    });

    let outputBuffer = this.serializeTransactionOutputs(transaction);
    if (
      typeof transaction.outputs !== "undefined" &&
      typeof transaction.locktime !== "undefined"
    ) {
      outputBuffer = Buffer.concat([outputBuffer, transaction.locktime]);
    }

    return Buffer.concat([
      transaction.version,
      this.createVarint(transaction.inputs.length),
      inputBuffer,
      outputBuffer
    ]);
  }

  displayTransactionDebug(transaction: Transaction) {
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
}
