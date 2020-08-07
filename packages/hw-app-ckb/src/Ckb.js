//@flow

import type Transport from "@ledgerhq/hw-transport";
import BIPPath from "bip32-path";
import * as blockchain from "./annotated";
import Blake2b from "blake2b-wasm";
import * as bech32 from "bech32";

/**
 * Nervos API
 *
 * @example
 * import Ckb from "@ledgerhq/hw-app-ckb";
 * const ckb = new Ckb(transport);
 */
export default class Ckb {
  transport: Transport<*>;

  constructor(transport: Transport<*>, scrambleKey: string = "CKB") {
    this.transport = transport;
    transport.decorateAppAPIMethods(
      this,
      [
        "getAppConfiguration",
        "getWalletId",
        "getWalletPublicKey",
        "signAnnotatedTransaction",
      ],
      scrambleKey
    );
  }

  /**
   * get CKB address for a given BIP 32 path.
   *
   * @param path a path in BIP 32 format
   * @return an object with a publicKey, lockArg, and (secp256k1+blake160) address.
   * @example
   * const result = await ckb.getWalletPublicKey("44'/144'/0'/0/0");
   * const publicKey = result.publicKey;
   * const lockArg = result.lockArg;
   * const address = result.address;
   */
  async getWalletPublicKey(path: string, testnet: boolean): Promise<string> {
    const bipPath = BIPPath.fromString(path).toPathArray();

    const cla = 0x80;
    const ins = 0x02;
    const p1 = 0x00;
    const p2 = 0x00;
    const data = Buffer.alloc(1 + bipPath.length * 4);

    data.writeUInt8(bipPath.length, 0);
    bipPath.forEach((segment, index) => {
      data.writeUInt32BE(segment, 1 + index * 4);
    });

    const response = await this.transport.send(cla, ins, p1, p2, data);

    const publicKeyLength = response[0];
    const publicKey = response.slice(1, 1 + publicKeyLength);

    const compressedPublicKey = Buffer.alloc(33);
    compressedPublicKey.fill(publicKey[64] & 1 ? "03" : "02", 0, 1, "hex");
    compressedPublicKey.fill(publicKey.subarray(1, 33), 1, 33);
    const lockArg = Buffer.from(
      Blake2b(32, null, null, Uint8Array.from("ckb-default-hash"))
        .update(compressedPublicKey)
        .digest("binary")
        .subarray(0, 20)
    );

    const addr_contents = Buffer.alloc(22);
    addr_contents.fill("0100", 0, 2, "hex");
    addr_contents.fill(lockArg, 2, 22);
    const addr = bech32.encode(
      testnet ? "ckt" : "ckb",
      bech32.toWords(addr_contents)
    );

    return {
      publicKey: publicKey.toString("hex"),
      lockArg: lockArg.toString("hex"),
      address: addr,
    };
  }

  /**
   * get extended public key for a given BIP 32 path.
   *
   * @param path a path in BIP 32 format
   * @return an object with a publicKey
   * @example
   * const result = await ckb.getWalletPublicKey("44'/144'/0'/0/0");
   * const publicKey = result;
   */
  async getWalletExtendedPublicKey(path: string): Promise<string> {
    const bipPath = BIPPath.fromString(path).toPathArray();

    const cla = 0x80;
    const ins = 0x04;
    const p1 = 0x00;
    const p2 = 0x00;
    const data = Buffer.alloc(1 + bipPath.length * 4);

    data.writeUInt8(bipPath.length, 0);
    bipPath.forEach((segment, index) => {
      data.writeUInt32BE(segment, 1 + index * 4);
    });

    const response = await this.transport.send(cla, ins, p1, p2, data);
    const publicKeyLength = response[0];
    const chainCodeOffset = 2 + publicKeyLength;
    const chainCodeLength = response[1 + publicKeyLength];
    return {
      public_key: response.slice(1, 1 + publicKeyLength).toString("hex"),
      chain_code: response
        .slice(chainCodeOffset, chainCodeOffset + chainCodeLength)
        .toString("hex"),
    };
  }

  /**
   * Sign a Nervos transaction with a given BIP 32 path
   *
   * @param signPath the path to sign with, in BIP 32 format
   * @param rawTxHex transaction to sign
   * @param groupWitnessesHex hex of in-group and extra witnesses to include in signature
   * @param contextTransaction list of transaction contexts for parsing
   * @param changePath the path the transaction sends change to, in BIP 32 format (optional, defaults to signPath)
   * @return a signature as hex string
   * @example
   * TODO
   */

  async signTransaction(
    signPath: string | BIPPath | [number],
    rawTx: string | blockchain.RawTransactionJSON,
    groupWitnessesHex?: [string],
    rawContextsTx: [string | blockchain.RawTransactionJSON],
    changePath: string | BIPPath | [number]
  ): Promise<string> {
    return await this.signAnnotatedTransaction(
      this.buildAnnotatedTransaction(
        signPath,
        rawTx,
        groupWitnessesHex,
        rawContextsTx,
        changePath
      )
    );
  }

  /**
   * Construct an AnnotatedTransaction for a given collection of signing data
   *
   * Parameters are the same as for signTransaction, but no ledger interaction is attempted.
   *
   * AnnotatedTransaction is a type defined for the ledger app that collects
   * all of the information needed to securely confirm a transaction on-screen
   * and a few bits of duplicative information to allow it to be processed as a
   * stream.
   */

  buildAnnotatedTransaction(
    signPath: string | BIPPath | [number],
    rawTx: string | RawTransactionJSON,
    groupWitnesses?: [string],
    rawContextsTx: [string | RawTransactionJSON],
    changePath: string | BIPPath | [number]
  ): AnnotatedTransactionJSON {
    const prepBipPath = (pathSrc) => {
      if (Array.isArray(pathSrc)) {
        return pathSrc;
      }
      if (typeof pathSrc === "object") {
        return pathSrc.toPathArray();
      }
      if (typeof pathSrc === "string") {
        return BIPPath.fromString(signPath).toPathArray();
      }
    };

    const signBipPath = prepBipPath(signPath);
    const changeBipPath = prepBipPath(changePath);

    const getRawTransactionJSON = (rawTrans) => {
      if (typeof rawTrans === "string") {
        const rawTxBuffer = Buffer.from(rawTrans, "hex");
        return new blockchain.RawTransaction(rawTxBuffer.buffer).toObject();
      }
      return rawTrans;
    };

    const contextTransactions = rawContextsTx.map(getRawTransactionJSON);

    const rawTxUnpacked = getRawTransactionJSON(rawTx);

    const annotatedCellInputVec = rawTxUnpacked.inputs.map((inpt, idx) => ({
      input: inpt,
      source: contextTransactions[idx],
    }));

    const annotatedRawTransaction = {
      version: rawTxUnpacked.version,
      cell_deps: rawTxUnpacked.cell_deps,
      header_deps: rawTxUnpacked.header_deps,
      inputs: annotatedCellInputVec,
      outputs: rawTxUnpacked.outputs,
      outputs_data: rawTxUnpacked.outputs_data,
    };

    return {
      signPath: signBipPath,
      changePath: changeBipPath,
      inputCount: rawTxUnpacked.inputs.length,
      raw: annotatedRawTransaction,
      witnesses:
        Array.isArray(groupWitnesses) && groupWitnesses.length > 0
          ? groupWitnesses
          : [this.defaultSighashWitness],
    };
  }

  /**
   * Sign an already constructed AnnotatedTransaction.
   */
  async signAnnotatedTransaction(
    tx: AnnotatedTransaction | AnnotatedTransactionJSON
  ): Promise<string> {
    const rawAnTx = Buffer.from(blockchain.SerializeAnnotatedTransaction(tx));

    const maxApduSize = 230;

    let txFullChunks = Math.floor(rawAnTx.byteLength / maxApduSize);
    let isContinuation = 0x00;
    for (let i = 0; i < txFullChunks; i++) {
      let data = rawAnTx.slice(i * maxApduSize, (i + 1) * maxApduSize);
      await this.transport.send(0x80, 0x03, isContinuation, 0x00, data);
      isContinuation = 0x01;
    }

    let lastOffset = txFullChunks * maxApduSize;
    let lastData = rawAnTx.slice(lastOffset, lastOffset + maxApduSize);
    let response = await this.transport.send(
      0x80,
      0x03,
      isContinuation | 0x80,
      0x00,
      lastData
    );
    return response.toString("hex");
  }

  /**
   * An empty WitnessArgs with enough space to fit a sighash signature into.
   */
  defaultSighashWitness =
    "55000000100000005500000055000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

  /**
   * Get the version of the Nervos app installed on the hardware device
   *
   * @return an object with a version
   * @example
   * const result = await ckb.getAppConfiguration();
   *
   * {
   *   "version": "1.0.3",
   *   "hash": "0000000000000000000000000000000000000000"
   * }
   */
  async getAppConfiguration(): Promise<{
    version: string,
    hash: string,
  }> {
    const response1 = await this.transport.send(0x80, 0x00, 0x00, 0x00);
    const response2 = await this.transport.send(0x80, 0x09, 0x00, 0x00);

    const result = {};
    result.version =
      "" + response1[0] + "." + response1[1] + "." + response1[2];
    result.hash = response2.toString("hex");

    return result;
  }

  /**
   * Get the wallet identifier for the Ledger wallet
   *
   * @return a byte string
   * @example
   * const id = await ckb.getWalletId();
   *
   * "0x69c46b6dd072a2693378ef4f5f35dcd82f826dc1fdcc891255db5870f54b06e6"
   */
  async getWalletId(): Promise<string> {
    const response = await this.transport.send(0x80, 0x01, 0x00, 0x00);

    const result = response.slice(0, 32).toString("hex");

    return result;
  }

  async signMessage(
    path: string,
    rawMsgHex: string,
    displayHex: bool
  ): Promise<string> {
    const bipPath = BIPPath.fromString(path).toPathArray();
    const magicBytes = Buffer.from("Nervos Message:");
    const rawMsg = Buffer.concat([magicBytes, Buffer.from(rawMsgHex, "hex")]);

    //Init apdu
    let rawPath = Buffer.alloc(1 + 1 + bipPath.length * 4);
    rawPath.writeInt8(displayHex, 0);
    rawPath.writeInt8(bipPath.length, 1);
    bipPath.forEach((segment, index) => {
      rawPath.writeUInt32BE(segment, 2 + index * 4);
    });
    await this.transport.send(0x80, 0x06, 0x00, 0x00, rawPath);

    // Msg Chunking
    const maxApduSize = 230;
    let txFullChunks = Math.floor(rawMsg.length / maxApduSize);
    for (let i = 0; i < txFullChunks; i++) {
      let data = rawMsg.slice(i*maxApduSize, (i+1)*maxApduSize);
      await this.transport.send(0x80, 0x06, 0x01, 0x00, data);
    }

    let lastOffset = Math.floor(rawMsg.length / maxApduSize) * maxApduSize;
    let lastData = rawMsg.slice(lastOffset, lastOffset+maxApduSize);
    let response = await this.transport.send(0x80, 0x06, 0x81, 0x00, lastData);
    return response.toString("hex");
  }

}

