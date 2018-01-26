//@flow

// TODO future refactoring
// - drop utils.js & refactoring with async/await style
// - try to avoid every place we do hex<>Buffer conversion. also accept Buffer as func parameters (could accept both a string or a Buffer in the API)
// - there are redundant code across apps (see Eth vs Btc). we might want to factorize it somewhere. also each app apdu call should be abstracted it out as an api
import { foreach, doIf, asyncWhile, splitPath, eachSeries } from "./utils";
import type Transport from "@ledgerhq/hw-transport";

const MAX_SCRIPT_BLOCK = 50;
const DEFAULT_LOCKTIME = 0;
const DEFAULT_SEQUENCE = 0xffffffff;
const SIGHASH_ALL = 1;

/**
 * Bitcoin API.
 *
 * @example
 * import Btc from "@ledgerhq/hw-app-btc";
 * const btc = new Btc(transport)
 */
export default class Btc {
  transport: Transport<*>;

  constructor(transport: Transport<*>) {
    this.transport = transport;
    transport.setScrambleKey("BTC");
  }

  /**
   * @param path a BIP 32 path
   * @param segwit use segwit
   * @example
   * btc.getWalletPublicKey("44'/0'/0'/0").then(o => o.bitcoinAddress)
   */
  getWalletPublicKey(
    path: string,
    verify: boolean = false,
    segwit: boolean = false
  ): Promise<{
    publicKey: string,
    bitcoinAddress: string,
    chainCode: string
  }> {
    const paths = splitPath(path);
    var p1 = 0x00;
    var p2 = 0x00;
    if (verify === true) {
        p1 = 0x01;
    }
    if (segwit == true) {
        p2 = 0x01;
    }
    const buffer = Buffer.alloc(1 + paths.length * 4);
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    return this.transport
      .send(0xe0, 0x40, p1, p2, buffer)
      .then(response => {
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

  getTrustedInputRaw(
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
    return this.transport
      .send(0xe0, 0x42, firstRound ? 0x00 : 0x80, 0x00, data)
      .then(trustedInput =>
        trustedInput.slice(0, trustedInput.length - 2).toString("hex")
      );
  }

  getTrustedInput(
    indexLookup: number,
    transaction: Transaction
  ): Promise<string> {
    const { inputs, outputs, locktime } = transaction;
    if (!outputs || !locktime) {
      throw new Error("getTrustedInput: locktime & outputs is expected");
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
        this.getTrustedInputRaw(scriptBlock)
      );
    };

    const processInputs = () => {
      return eachSeries(inputs, input => {
        const data = Buffer.concat([
          input.prevout,
          this.createVarint(input.script.length)
        ]);
        return this.getTrustedInputRaw(data).then(() =>
          // iteration (eachSeries) ended
          // TODO notify progress
          // deferred.notify("input");
          processScriptBlocks(input.script, input.sequence)
        );
      }).then(() => {
        const data = this.createVarint(outputs.length);
        return this.getTrustedInputRaw(data);
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
        return this.getTrustedInputRaw(data).then(() => {
          // iteration (eachSeries) ended
          // TODO notify progress
          // deferred.notify("output");
        });
      }).then(() => this.getTrustedInputRaw(locktime));

    const data = Buffer.concat([
      transaction.version,
      this.createVarint(inputs.length)
    ]);
    return this.getTrustedInputRaw(data, indexLookup)
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

  startUntrustedHashTransactionInputRaw(
    newTransaction: boolean,
    firstRound: boolean,
    transactionData: Buffer
  ) {
    return this.transport.send(
      0xe0,
      0x44,
      firstRound ? 0x00 : 0x80,
      newTransaction ? 0x00 : 0x80,
      transactionData
    );
  }

  startUntrustedHashTransactionInput(
    newTransaction: boolean,
    transaction: Transaction,
    inputs: Array<{ trustedInput: boolean, value: Buffer }>
  ) {
    let data = Buffer.concat([
      transaction.version,
      this.createVarint(transaction.inputs.length)
    ]);
    return this.startUntrustedHashTransactionInputRaw(
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
        return this.startUntrustedHashTransactionInputRaw(
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
            return this.startUntrustedHashTransactionInputRaw(
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

  provideOutputFullChangePath(path: string): Promise<string> {
    let paths = splitPath(path);
    let buffer = Buffer.alloc(1 + paths.length * 4);
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    return this.transport.send(0xe0, 0x4a, 0xff, 0x00, buffer);
  }

  hashOutputFull(outputScript: Buffer): Promise<*> {
    let offset = 0;
    return asyncWhile(
      () => offset < outputScript.length,
      () => {
        let blockSize =
          offset + MAX_SCRIPT_BLOCK >= outputScript.length
            ? outputScript.length - offset
            : MAX_SCRIPT_BLOCK;
        let p1 = offset + blockSize === outputScript.length ? 0x80 : 0x00;
        let data = outputScript.slice(offset, offset + blockSize);
        return this.transport.send(0xe0, 0x4a, p1, 0x00, data).then(() => {
          offset += blockSize;
        });
      }
    );
  }

  /**
   */
  signTransaction(
    path: string,
    lockTime?: number = DEFAULT_LOCKTIME,
    sigHashType?: number = SIGHASH_ALL
  ): Promise<Buffer> {
    const paths = splitPath(path);
    const buffer = Buffer.alloc(1 + paths.length * 4 + 1 + 4 + 1); // TODO shouldn't have to calc that, just use buffer concat all the way down
    let offset = 0;
    buffer[offset++] = paths.length;
    paths.forEach(element => {
      buffer.writeUInt32BE(element, offset);
      offset += 4;
    });
    buffer[offset++] = 0x00; // authorization length
    buffer.writeUInt32LE(lockTime, offset);
    offset += 4;
    buffer[offset++] = sigHashType;
    return this.transport.send(0xe0, 0x48, 0x00, 0x00, buffer).then(result => {
      result[0] = 0x30;
      return result.slice(0, result.length - 2);
    });
  }

  /**
   * You can sign a message according to the Bitcoin Signature format and retrieve v, r, s given the message and the BIP 32 path of the account to sign.
   * @example
   btc.signMessageNew_async("44'/60'/0'/0'/0", Buffer.from("test").toString("hex")).then(function(result) {
     var v = result['v'] + 27 + 4;
     var signature = Buffer.from(v.toString(16) + result['r'] + result['s'], 'hex').toString('base64');
     console.log("Signature : " + signature);
   }).catch(function(ex) {console.log(ex);});
   */
  signMessageNew(
    path: string,
    messageHex: string
  ): Promise<{ v: number, r: string, s: string }> {
    const paths = splitPath(path);
    const message = new Buffer(messageHex, "hex");
    let offset = 0;
    const toSend = [];
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
        offset === 0 ? 1 + paths.length * 4 + 2 + chunkSize : chunkSize
      );
      if (offset === 0) {
        buffer[0] = paths.length;
        paths.forEach((element, index) => {
          buffer.writeUInt32BE(element, 1 + 4 * index);
        });
        buffer.writeUInt16BE(message.length, 1 + 4 * paths.length);
        message.copy(
          buffer,
          1 + 4 * paths.length + 2,
          offset,
          offset + chunkSize
        );
      } else {
        message.copy(buffer, 0, offset, offset + chunkSize);
      }
      toSend.push(buffer);
      offset += chunkSize;
    }
    return foreach(toSend, (data, i) =>
      this.transport.send(0xe0, 0x4e, 0x00, i === 0 ? 0x01 : 0x80, data)
    ).then(() => {
      return this.transport
        .send(0xe0, 0x4e, 0x80, 0x00, Buffer.from([0x00]))
        .then(response => {
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
    });
  }

  /**
   * To sign a transaction involving standard (P2PKH) inputs, call createPaymentTransactionNew with the following parameters
   * @param inputs is an array of [ transaction, output_index, optional redeem script, optional sequence ] where
   *
   * * transaction is the previously computed transaction object for this UTXO
   * * output_index is the output in the transaction used as input for this UTXO (counting from 0)
   * * redeem script is the optional redeem script to use when consuming a Segregated Witness input
   * * sequence is the sequence number to use for this input (when using RBF), or non present
   * @param associatedKeysets is an array of BIP 32 paths pointing to the path to the private key used for each UTXO
   * @param changePath is an optional BIP 32 path pointing to the path to the public key used to compute the change address
   * @param outputScript is the hexadecimal serialized outputs of the transaction to sign
   * @param lockTime is the optional lockTime of the transaction to sign, or default (0)
   * @param sigHashType is the hash type of the transaction to sign, or default (all)
   * @return the signed transaction ready to be broadcast
   * @example
btc.createPaymentTransactionNew(
   [ [tx1, 1] ],
   ["0'/0/0"],
   undefined,
   "01905f0100000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac"
 ).then(res => ...);
   */
  createPaymentTransactionNew(
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
        this.getTrustedInput(input[1], input[0]).then(trustedInput => {
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
            this.getWalletPublicKey(associatedKeysets[i])
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
          return this.startUntrustedHashTransactionInput(
            firstRun,
            targetTransaction,
            trustedInputs
          ).then(() =>
            Promise.resolve()
              .then(() => {
                if (!resuming && typeof changePath !== "undefined") {
                  return this.provideOutputFullChangePath(changePath);
                }
              })
              .then(() => this.hashOutputFull(outputScript))
              .then(() =>
                this.signTransaction(
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

  /**
   * To obtain the signature of multisignature (P2SH) inputs, call signP2SHTransaction_async with the folowing parameters
   * @param inputs is an array of [ transaction, output_index, redeem script, optional sequence ] where
   * * transaction is the previously computed transaction object for this UTXO
   * * output_index is the output in the transaction used as input for this UTXO (counting from 0)
   * * redeem script is the mandatory redeem script associated to the current P2SH input
   * * sequence is the sequence number to use for this input (when using RBF), or non present
   * @param associatedKeysets is an array of BIP 32 paths pointing to the path to the private key used for each UTXO
   * @param outputScript is the hexadecimal serialized outputs of the transaction to sign
   * @param lockTime is the optional lockTime of the transaction to sign, or default (0)
   * @param sigHashType is the hash type of the transaction to sign, or default (all)
   * @return the signed transaction ready to be broadcast
   * @example
btc.signP2SHTransaction(
 [ [tx, 1, "52210289b4a3ad52a919abd2bdd6920d8a6879b1e788c38aa76f0440a6f32a9f1996d02103a3393b1439d1693b063482c04bd40142db97bdf139eedd1b51ffb7070a37eac321030b9a409a1e476b0d5d17b804fcdb81cf30f9b99c6f3ae1178206e08bc500639853ae"] ],
 ["0'/0/0"],
 "01905f0100000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac"
).then(result => ...);
   */
  signP2SHTransaction(
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
        this.getTrustedInput(input[1], input[0]).then(trustedInput => {
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
          return this.startUntrustedHashTransactionInput(
            firstRun,
            targetTransaction,
            trustedInputs
          )
            .then(() => this.hashOutputFull(outputScript))
            .then(() =>
              this.signTransaction(
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

  /**
   * For each UTXO included in your transaction, create a transaction object from the raw serialized version of the transaction used in this UTXO.
   * @example
const tx1 = btc.splitTransaction("01000000014ea60aeac5252c14291d428915bd7ccd1bfc4af009f4d4dc57ae597ed0420b71010000008a47304402201f36a12c240dbf9e566bc04321050b1984cd6eaf6caee8f02bb0bfec08e3354b022012ee2aeadcbbfd1e92959f57c15c1c6debb757b798451b104665aa3010569b49014104090b15bde569386734abf2a2b99f9ca6a50656627e77de663ca7325702769986cf26cc9dd7fdea0af432c8e2becc867c932e1b9dd742f2a108997c2252e2bdebffffffff0281b72e00000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88aca0860100000000001976a9144533f5fb9b4817f713c48f0bfe96b9f50c476c9b88ac00000000");
   */
  splitTransaction(transactionHex: string, isSegwitSupported: boolean): Transaction {
    const inputs = [];
    const outputs = [];
    var witness = false;
    let offset = 0;
    const transaction = Buffer.from(transactionHex, "hex");
    const version = transaction.slice(offset, offset + 4);
    offset += 4;
    if (isSegwitSupported && ((transaction[offset] == 0) && (transaction[offset + 1] != 0))) {
        offset += 2;
        witness = true;
    }
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
    var witnessScript, locktime;
    if (witness) {
        witnessScript = transaction.slice(offset, - 4);
        locktime = transaction.slice(transaction.length - 4);
    }
    else {
        locktime = transaction.slice(offset, offset+ 4);
    }
    return { version, inputs, outputs, locktime, witness: witnessScript };
  }

  /**
  @example
const tx1 = btc.splitTransaction("01000000014ea60aeac5252c14291d428915bd7ccd1bfc4af009f4d4dc57ae597ed0420b71010000008a47304402201f36a12c240dbf9e566bc04321050b1984cd6eaf6caee8f02bb0bfec08e3354b022012ee2aeadcbbfd1e92959f57c15c1c6debb757b798451b104665aa3010569b49014104090b15bde569386734abf2a2b99f9ca6a50656627e77de663ca7325702769986cf26cc9dd7fdea0af432c8e2becc867c932e1b9dd742f2a108997c2252e2bdebffffffff0281b72e00000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88aca0860100000000001976a9144533f5fb9b4817f713c48f0bfe96b9f50c476c9b88ac00000000");
const outputScript = btc.serializeTransactionOutputs(tx1).toString('hex');
  */
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

  /**
   */
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

  /**
   */
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

/**
 */
type TransactionInput = {
  prevout: Buffer,
  script: Buffer,
  sequence: Buffer
};

/**
 */
type TransactionOutput = {
  amount: Buffer,
  script: Buffer
};

/**
 */
type Transaction = {
  version: Buffer,
  inputs: TransactionInput[],
  outputs?: TransactionOutput[],
  locktime?: Buffer
};
