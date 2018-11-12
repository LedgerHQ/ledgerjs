//@flow

// TODO future refactoring
// - drop utils.js & refactoring with async/await style
// - try to avoid every place we do hex<>Buffer conversion. also accept Buffer as func parameters (could accept both a string or a Buffer in the API)
// - there are redundant code across apps (see Eth vs Btc). we might want to factorize it somewhere. also each app apdu call should be abstracted it out as an api
import { foreach, doIf, asyncWhile, splitPath, eachSeries } from "./utils";
import type Transport from "@ledgerhq/hw-transport";
import createHash from "create-hash";

const MAX_SCRIPT_BLOCK = 50;
const DEFAULT_VERSION = 1;
const DEFAULT_LOCKTIME = 0;
const DEFAULT_SEQUENCE = 0xffffffff;
const SIGHASH_ALL = 1;
const OP_DUP = 0x76;
const OP_HASH160 = 0xa9;
const HASH_SIZE = 0x14;
const OP_EQUALVERIFY = 0x88;
const OP_CHECKSIG = 0xac;
/**
 * Bitcoin API.
 *
 * @example
 * import Btc from "@ledgerhq/hw-app-btc";
 * const btc = new Btc(transport)
 */
export default class Btc {
  transport: Transport<*>;

  constructor(transport: Transport<*>, scrambleKey: string = "BTC") {
    this.transport = transport;
    transport.decorateAppAPIMethods(
      this,
      [
        "getWalletPublicKey",
        "signP2SHTransaction",
        "signMessageNew",
        "createPaymentTransactionNew"
      ],
      scrambleKey
    );
  }

  hashPublicKey(buffer: Buffer) {
    return createHash("rmd160")
      .update(
        createHash("sha256")
          .update(buffer)
          .digest()
      )
      .digest();
  }

  getWalletPublicKey_private(
    path: string,
    verify: boolean,
    segwit: boolean
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
    return this.transport.send(0xe0, 0x40, p1, p2, buffer).then(response => {
      const publicKeyLength = response[0];
      const addressLength = response[1 + publicKeyLength];
      const publicKey = response.slice(1, 1 + publicKeyLength).toString("hex");
      const bitcoinAddress = response
        .slice(1 + publicKeyLength + 1, 1 + publicKeyLength + 1 + addressLength)
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

  /**
   * @param path a BIP 32 path
   * @param segwit use segwit
   * @example
   * btc.getWalletPublicKey("44'/0'/0'/0").then(o => o.bitcoinAddress)
   */
  getWalletPublicKey(
    path: string,
    verify?: boolean = false,
    segwit?: boolean = false
  ): Promise<{
    publicKey: string,
    bitcoinAddress: string,
    chainCode: string
  }> {
    return this.getWalletPublicKey_private(path, verify, segwit);
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
    transaction: Transaction,
    additionals: Array<string> = []
  ): Promise<string> {
    const { inputs, outputs, locktime } = transaction;
    if (!outputs || !locktime) {
      throw new Error("getTrustedInput: locktime & outputs is expected");
    }
    const isDecred = additionals.includes("decred");
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

      // Handle case when no script length: we still want to pass the sequence
      // relatable: https://github.com/LedgerHQ/ledger-live-desktop/issues/1386
      if (script.length === 0) {
        scriptBlocks.push(sequence);
      }

      return eachSeries(scriptBlocks, scriptBlock =>
        this.getTrustedInputRaw(scriptBlock)
      );
    };

    const processWholeScriptBlock = (script, sequence) =>
      this.getTrustedInputRaw(Buffer.concat([script, sequence]));

    const processInputs = () => {
      return eachSeries(inputs, input => {
        const data = Buffer.concat([
          input.prevout,
          isDecred ? Buffer.from([0x00]) : Buffer.alloc(0), //tree
          this.createVarint(input.script.length)
        ]);
        return this.getTrustedInputRaw(data).then(() => {
          // iteration (eachSeries) ended
          // TODO notify progress
          // deferred.notify("input");
          return isDecred
            ? processWholeScriptBlock(input.script, input.sequence)
            : processScriptBlocks(input.script, input.sequence);
        });
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
          isDecred ? Buffer.from([0x00, 0x00]) : Buffer.alloc(0), //Version script
          this.createVarint(output.script.length),
          output.script
        ]);
        return this.getTrustedInputRaw(data).then(() => {
          // iteration (eachSeries) ended
          // TODO notify progress
          // deferred.notify("output");
        });
      }).then(() => {
        //Add expiry height for decred
        const finalData = isDecred
          ? Buffer.concat([locktime, Buffer.from([0x00, 0x00, 0x00, 0x00])])
          : locktime;
        return this.getTrustedInputRaw(finalData);
      });

    const data = Buffer.concat([
      transaction.version,
      transaction.timestamp || Buffer.alloc(0),
      this.createVarint(inputs.length)
    ]);
    return this.getTrustedInputRaw(data, indexLookup)
      .then(processInputs)
      .then(processOutputs);
  }

  async getTrustedInputBIP143(
    indexLookup: number,
    transaction: Transaction,
    additionals: Array<string> = []
  ) {
    if (!transaction) {
      throw new Error("getTrustedInputBIP143: missing tx");
    }
    const isDecred = additionals.includes("decred");
    if (isDecred) {
      throw new Error("Decred does not implement BIP143");
    }
    let sha = createHash("sha256");
    sha.update(this.serializeTransaction(transaction, true));
    let hash = sha.digest();
    sha = createHash("sha256");
    sha.update(hash);
    hash = sha.digest();
    const data = Buffer.alloc(4);
    data.writeUInt32LE(indexLookup, 0);
    const { outputs, locktime } = transaction;
    if (!outputs || !locktime) {
      throw new Error("getTrustedInputBIP143: locktime & outputs is expected");
    }
    if (!outputs[indexLookup]) {
      throw new Error("getTrustedInputBIP143: wrong index");
    }
    hash = Buffer.concat([hash, data, outputs[indexLookup].amount]);
    return await hash.toString("hex");
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
    transactionData: Buffer,
    bip143?: boolean = false,
    overwinter?: boolean = false,
    additionals: Array<string> = []
  ) {
    const p2 = bip143
      ? additionals.includes("sapling")
        ? 0x05
        : overwinter
          ? 0x04
          : 0x02
      : 0x00;
    return this.transport.send(
      0xe0,
      0x44,
      firstRound ? 0x00 : 0x80,
      newTransaction ? p2 : 0x80,
      transactionData
    );
  }

  startUntrustedHashTransactionInput(
    newTransaction: boolean,
    transaction: Transaction,
    inputs: Array<{ trustedInput: boolean, value: Buffer }>,
    bip143?: boolean = false,
    overwinter?: boolean = false,
    additionals: Array<string> = []
  ) {
    let data = Buffer.concat([
      transaction.version,
      transaction.timestamp || Buffer.alloc(0),
      transaction.nVersionGroupId || Buffer.alloc(0),
      this.createVarint(transaction.inputs.length)
    ]);
    return this.startUntrustedHashTransactionInputRaw(
      newTransaction,
      true,
      data,
      bip143,
      overwinter,
      additionals
    ).then(() => {
      let i = 0;
      const isDecred = additionals.includes("decred");
      return eachSeries(transaction.inputs, input => {
        let prefix;
        if (bip143) {
          prefix = Buffer.from([0x02]);
        } else {
          if (inputs[i].trustedInput) {
            prefix = Buffer.from([0x01, inputs[i].value.length]);
          } else {
            prefix = Buffer.from([0x00]);
          }
        }
        data = Buffer.concat([
          prefix,
          inputs[i].value,
          isDecred ? Buffer.from([0x00]) : Buffer.alloc(0),
          this.createVarint(input.script.length)
        ]);
        return this.startUntrustedHashTransactionInputRaw(
          newTransaction,
          false,
          data,
          bip143,
          overwinter,
          additionals
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
              scriptBlock,
              bip143,
              overwinter,
              additionals
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

  hashOutputFull(
    outputScript: Buffer,
    additionals: Array<string> = []
  ): Promise<*> {
    let offset = 0;
    let p1 = 0x80;
    const isDecred = additionals.includes("decred");
    ///WARNING: Decred works only with one call (without chunking)
    //TODO: test without this for Decred
    if (isDecred) {
      return this.transport.send(0xe0, 0x4a, p1, 0x00, outputScript);
    }
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

  signTransaction(
    path: string,
    lockTime?: number = DEFAULT_LOCKTIME,
    sigHashType?: number = SIGHASH_ALL,
    expiryHeight?: Buffer,
    additionals: Array<string> = []
  ): Promise<Buffer> {
    const isDecred = additionals.includes("decred");
    const paths = splitPath(path);
    let offset = 0;
    const pathsBuffer = Buffer.alloc(paths.length * 4);
    paths.forEach(element => {
      pathsBuffer.writeUInt32BE(element, offset);
      offset += 4;
    });
    const lockTimeBuffer = Buffer.alloc(4);
    lockTimeBuffer.writeUInt32BE(lockTime, 0);
    let buffer = isDecred
      ? Buffer.concat([
          Buffer.from([paths.length]),
          pathsBuffer,
          lockTimeBuffer,
          expiryHeight || Buffer.from([0x00, 0x00, 0x00, 0x00]),
          Buffer.from([sigHashType])
        ])
      : Buffer.concat([
          Buffer.from([paths.length]),
          pathsBuffer,
          Buffer.from([0x00]),
          lockTimeBuffer,
          Buffer.from([sigHashType])
        ]);
    if (expiryHeight && !isDecred) {
      buffer = Buffer.concat([buffer, expiryHeight]);
    }
    return this.transport.send(0xe0, 0x48, 0x00, 0x00, buffer).then(result => {
      if (result.length > 0) {
        result[0] = 0x30;
        return result.slice(0, result.length - 2);
      }
      return result;
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
   * @param outputScriptHex is the hexadecimal serialized outputs of the transaction to sign
   * @param lockTime is the optional lockTime of the transaction to sign, or default (0)
   * @param sigHashType is the hash type of the transaction to sign, or default (all)
   * @param segwit is an optional boolean indicating wether to use segwit or not
   * @param initialTimestamp is an optional timestamp of the function call to use for coins that necessitate timestamps only, (not the one that the tx will include)
   * @param additionals list of additionnal options
   * - "abc" for bch
   * - "gold" for btg
   * - "bipxxx" for using BIPxxx
   * - "sapling" to indicate a zec transaction is supporting sapling (to be set over block 419200)
   * @param expiryHeight is an optional Buffer for zec overwinter / sapling Txs
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
    sigHashType?: number = SIGHASH_ALL,
    segwit?: boolean = false,
    initialTimestamp?: number,
    additionals: Array<string> = [],
    expiryHeight?: Buffer
  ) {
    const isDecred = additionals.includes("decred");
    const hasTimestamp = initialTimestamp !== undefined;
    let startTime = Date.now();
    const sapling = additionals.includes("sapling");
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
      : defaultVersion.writeUInt32LE(1, 0);
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
      ? this.getTrustedInputBIP143.bind(this)
      : this.getTrustedInput.bind(this);
    const outputScript = Buffer.from(outputScriptHex, "hex");

    return foreach(inputs, input => {
      return doIf(!resuming, () => {
        return getTrustedInputCall(input[1], input[0], additionals).then(
          trustedInput => {
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
        );
      })
        .then(() => {
          const { outputs } = input[0];
          const index = input[1];
          if (outputs && index <= outputs.length - 1) {
            regularOutputs.push(outputs[index]);
          }
        })
        .then(() => {
          if (!!expiryHeight && !isDecred) {
            targetTransaction.nVersionGroupId = Buffer.from(
              sapling ? [0x85, 0x20, 0x2f, 0x89] : [0x70, 0x82, 0xc4, 0x03]
            );
            targetTransaction.nExpiryHeight = expiryHeight;
            // For sapling : valueBalance (8), nShieldedSpend (1), nShieldedOutput (1), nJoinSplit (1)
            // Overwinter : use nJoinSplit (1)
            targetTransaction.extraData = Buffer.from(
              sapling
                ? [
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                    0x00
                  ]
                : [0x00]
            );
          } else if (isDecred) {
            targetTransaction.nExpiryHeight = expiryHeight;
          }
        });
    })
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
      .then(() =>
        doIf(!resuming, () =>
          // Collect public keys
          foreach(inputs, (input, i) =>
            this.getWalletPublicKey_private(associatedKeysets[i], false, false)
          ).then(result => {
            for (let index = 0; index < result.length; index++) {
              publicKeys.push(
                this.compressPublicKey(
                  Buffer.from(result[index].publicKey, "hex")
                )
              );
            }
          })
        )
      )
      .then(() => {
        if (hasTimestamp) {
          targetTransaction.timestamp = Buffer.alloc(4);
          targetTransaction.timestamp.writeUInt32LE(
            Math.floor(initialTimestamp + (Date.now() - startTime) / 1000),
            0
          );
        }
      })
      .then(() =>
        doIf(useBip143, () =>
          // Do the first run with all inputs
          this.startUntrustedHashTransactionInput(
            true,
            targetTransaction,
            trustedInputs,
            true,
            !!expiryHeight,
            additionals
          ).then(() =>
            doIf(!resuming && typeof changePath != "undefined", () => {
              // $FlowFixMe
              return this.provideOutputFullChangePath(changePath);
            }).then(() => this.hashOutputFull(outputScript))
          )
        )
      )
      .then(() =>
        doIf(!!expiryHeight && !isDecred, () =>
          this.signTransaction("", undefined, SIGHASH_ALL, expiryHeight)
        )
      )
      .then(() =>
        // Do the second run with the individual transaction
        foreach(inputs, (input, i) => {
          let script =
            inputs[i].length >= 3 && typeof inputs[i][2] === "string"
              ? Buffer.from(inputs[i][2], "hex")
              : !segwit
                ? regularOutputs[i].script
                : Buffer.concat([
                    Buffer.from([OP_DUP, OP_HASH160, HASH_SIZE]),
                    this.hashPublicKey(publicKeys[i]),
                    Buffer.from([OP_EQUALVERIFY, OP_CHECKSIG])
                  ]);
          let pseudoTX = Object.assign({}, targetTransaction);
          let pseudoTrustedInputs = useBip143
            ? [trustedInputs[i]]
            : trustedInputs;
          if (useBip143) {
            pseudoTX.inputs = [{ ...pseudoTX.inputs[i], script }];
          } else {
            pseudoTX.inputs[i].script = script;
          }
          return this.startUntrustedHashTransactionInput(
            !useBip143 && firstRun,
            pseudoTX,
            pseudoTrustedInputs,
            useBip143,
            !!expiryHeight && !isDecred,
            additionals
          )
            .then(() =>
              doIf(!useBip143, () =>
                doIf(!resuming && typeof changePath != "undefined", () => {
                  // $FlowFixMe
                  return this.provideOutputFullChangePath(changePath);
                }).then(() => this.hashOutputFull(outputScript, additionals))
              )
            )
            .then(() => {
              return this.signTransaction(
                associatedKeysets[i],
                lockTime,
                sigHashType,
                expiryHeight,
                additionals
              );
            })
            .then(signature => {
              signatures.push(signature);
              targetTransaction.inputs[i].script = nullScript;
              if (firstRun) {
                firstRun = false;
              }
            });
        })
      )
      .then(() => {
        // Populate the final input scripts
        for (let i = 0; i < inputs.length; i++) {
          if (segwit) {
            targetTransaction.witness = Buffer.alloc(0);
            targetTransaction.inputs[i].script = Buffer.concat([
              Buffer.from("160014", "hex"),
              this.hashPublicKey(publicKeys[i])
            ]);
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
          this.serializeTransaction(
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
        if (expiryHeight) {
          result = Buffer.concat([
            result,
            targetTransaction.nExpiryHeight || Buffer.alloc(0),
            targetTransaction.extraData || Buffer.alloc(0)
          ]);
        }

        result = Buffer.concat([result, lockTimeBuffer]);

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
   * @param outputScriptHex is the hexadecimal serialized outputs of the transaction to sign
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
    sigHashType?: number = SIGHASH_ALL,
    segwit?: boolean = false,
    transactionVersion?: number = DEFAULT_VERSION
  ) {
    // Inputs are provided as arrays of [transaction, output_index, redeem script, optional sequence]
    // associatedKeysets are provided as arrays of [path]
    const nullScript = Buffer.alloc(0);
    const nullPrevout = Buffer.alloc(0);
    const defaultVersion = Buffer.alloc(4);
    defaultVersion.writeUInt32LE(transactionVersion, 0);
    const trustedInputs = [];
    const regularOutputs: Array<TransactionOutput> = [];
    const signatures = [];
    let firstRun = true;
    const resuming = false;
    let targetTransaction: Transaction = {
      inputs: [],
      version: defaultVersion
    };

    const getTrustedInputCall = segwit
      ? this.getTrustedInputBIP143.bind(this)
      : this.getTrustedInput.bind(this);
    const outputScript = Buffer.from(outputScriptHex, "hex");

    return foreach(inputs, input =>
      doIf(!resuming, () =>
        getTrustedInputCall(input[1], input[0]).then(trustedInput => {
          let sequence = Buffer.alloc(4);
          sequence.writeUInt32LE(
            input.length >= 4 && typeof input[3] === "number"
              ? input[3]
              : DEFAULT_SEQUENCE,
            0
          );
          trustedInputs.push({
            trustedInput: false,
            value: segwit
              ? Buffer.from(trustedInput, "hex")
              : Buffer.from(trustedInput, "hex").slice(4, 4 + 0x24),
            sequence
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
        // Pre-build the target transaction
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
      .then(() =>
        doIf(segwit, () =>
          // Do the first run with all inputs
          this.startUntrustedHashTransactionInput(
            true,
            targetTransaction,
            trustedInputs,
            true
          ).then(() => this.hashOutputFull(outputScript))
        )
      )
      .then(() =>
        foreach(inputs, (input, i) => {
          let script =
            inputs[i].length >= 3 && typeof inputs[i][2] === "string"
              ? Buffer.from(inputs[i][2], "hex")
              : regularOutputs[i].script;
          let pseudoTX = Object.assign({}, targetTransaction);
          let pseudoTrustedInputs = segwit ? [trustedInputs[i]] : trustedInputs;
          if (segwit) {
            pseudoTX.inputs = [{ ...pseudoTX.inputs[i], script }];
          } else {
            pseudoTX.inputs[i].script = script;
          }
          return this.startUntrustedHashTransactionInput(
            !segwit && firstRun,
            pseudoTX,
            pseudoTrustedInputs,
            segwit
          )
            .then(() => doIf(!segwit, () => this.hashOutputFull(outputScript)))
            .then(() =>
              this.signTransaction(
                associatedKeysets[i],
                lockTime,
                sigHashType
              ).then(signature => {
                signatures.push(
                  segwit
                    ? signature.toString("hex")
                    : signature.slice(0, signature.length - 1).toString("hex")
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
  splitTransaction(
    transactionHex: string,
    isSegwitSupported: ?boolean = false,
    hasTimestamp?: boolean = false,
    hasExtraData?: boolean = false,
    additionals: Array<string> = []
  ): Transaction {
    const inputs = [];
    const outputs = [];
    var witness = false;
    let offset = 0;
    let timestamp = Buffer.alloc(0);
    let nExpiryHeight = Buffer.alloc(0);
    let nVersionGroupId = Buffer.alloc(0);
    let extraData = Buffer.alloc(0);
    const isDecred = additionals.includes("decred");
    const transaction = Buffer.from(transactionHex, "hex");
    const version = transaction.slice(offset, offset + 4);
    const overwinter =
      version.equals(Buffer.from([0x03, 0x00, 0x00, 0x80])) ||
      version.equals(Buffer.from([0x04, 0x00, 0x00, 0x80]));
    offset += 4;
    if (
      !hasTimestamp &&
      isSegwitSupported &&
      (transaction[offset] === 0 && transaction[offset + 1] !== 0)
    ) {
      offset += 2;
      witness = true;
    }
    if (hasTimestamp) {
      timestamp = transaction.slice(offset, 4 + offset);
      offset += 4;
    }
    if (overwinter) {
      nVersionGroupId = transaction.slice(offset, 4 + offset);
      offset += 4;
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

      if (isDecred) {
        //Script version
        offset += 2;
      }

      varint = this.getVarint(transaction, offset);
      offset += varint[1];
      const script = transaction.slice(offset, offset + varint[0]);
      offset += varint[0];
      outputs.push({ amount, script });
    }
    let witnessScript, locktime;
    if (witness) {
      witnessScript = transaction.slice(offset, -4);
      locktime = transaction.slice(transaction.length - 4);
    } else {
      locktime = transaction.slice(offset, offset + 4);
    }
    offset += 4;
    if (overwinter || isDecred) {
      nExpiryHeight = transaction.slice(offset, offset + 4);
      offset += 4;
    }
    if (hasExtraData) {
      extraData = transaction.slice(offset);
    }

    return {
      version,
      inputs,
      outputs,
      locktime,
      witness: witnessScript,
      timestamp,
      nVersionGroupId,
      nExpiryHeight,
      extraData
    };
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
  serializeTransaction(
    transaction: Transaction,
    skipWitness: boolean,
    timestamp?: Buffer,
    additionals: Array<string> = []
  ) {
    const isDecred = additionals.includes("decred");
    let inputBuffer = Buffer.alloc(0);
    let useWitness =
      typeof transaction["witness"] != "undefined" && !skipWitness;
    transaction.inputs.forEach(input => {
      inputBuffer = isDecred
        ? Buffer.concat([
            inputBuffer,
            input.prevout,
            Buffer.from([0x00]), //tree
            input.sequence
          ])
        : Buffer.concat([
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
      outputBuffer = Buffer.concat([
        outputBuffer,
        (useWitness && transaction.witness) || Buffer.alloc(0),
        transaction.locktime,
        transaction.nExpiryHeight || Buffer.alloc(0),
        transaction.extraData || Buffer.alloc(0)
      ]);
    }

    return Buffer.concat([
      transaction.version,
      timestamp ? timestamp : Buffer.alloc(0),
      transaction.nVersionGroupId || Buffer.alloc(0),
      useWitness ? Buffer.from("0001", "hex") : Buffer.alloc(0),
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
  locktime?: Buffer,
  witness?: Buffer,
  timestamp?: Buffer,
  nVersionGroupId?: Buffer,
  nExpiryHeight?: Buffer,
  extraData?: Buffer
};
