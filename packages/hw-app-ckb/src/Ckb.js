//@flow

import type Transport from "@ledgerhq/hw-transport";
import BIPPath from "bip32-path";

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
        "signTransaction"
      ],
      scrambleKey
    );
  }

  /**
   * get CKB address for a given BIP 32 path.
   *
   * @param path a path in BIP 32 format
   * @return an object with a publicKey
   * @example
   * const result = await ckb.getWalletPublicKey("44'/144'/0'/0/0");
   * const publicKey = result;
   */
  async getWalletPublicKey(path: string): Promise<string> {
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
    return response.slice(1, 1 + publicKeyLength).toString("hex");
  }

  /**
   * Sign a Nervos transaction with a given BIP 32 path
   *
   * @param path a path in BIP 32 format
   * @param rawTxHex transaction to sign
   * @param contextTransaction list of transaction context to use in parsing (optional)
   * @return a signature as hex string
   * @example
   * const signature = await ckb.signTransaction("44'/144'/0'/0/0", "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");
   */
  async signTransaction(
    path: string,
    rawTxHex: string,
    rawContextsTxHex: [string]
  ): Promise<string> {
    const bipPath = BIPPath.fromString(path).toPathArray();
    const rawTx = Buffer.from(rawTxHex, "hex");

    let rawPath = Buffer.alloc(1 + bipPath.length * 4);
    rawPath.writeInt8(bipPath.length, 0);
    bipPath.forEach((segment, index) => {
      rawPath.writeUInt32BE(segment, 1 + index * 4);
    });
    await this.transport.send(0x80, 0x03, 0x00, 0x00, rawPath);

    const maxApduSize = 230;

    if (!rawContextsTxHex) rawContextsTxHex = [];

    for (const rawContextTxHex of rawContextsTxHex) {
      let rawContextTx =
        rawContextTxHex !== null ? Buffer.from(rawContextTxHex, "hex") : null;
      for (let i = 0; i < Math.floor(rawContextTx.length / maxApduSize); i++) {
        let data = rawContextTx.slice(i*maxApduSize, (i+1)*maxApduSize);
        await this.transport.send(0x80, 0x03, 0x21, 0x00, data);
      }

      let lastContextOffset = Math.floor(rawContextTx.length / maxApduSize) * maxApduSize;
      let lastContextData = rawContextTx.slice(lastContextOffset, lastContextOffset+maxApduSize);
      await this.transport.send(0x80, 0x03, 0xa1, 0x00, lastContextData);
    }

    for (let i = 0; i < Math.floor(rawTx.length / maxApduSize); i++) {
      let data = rawTx.slice(i*maxApduSize, (i+1)*maxApduSize);
      await this.transport.send(0x80, 0x03, 0x01, 0x00, data);
    }

    let lastOffset = Math.floor(rawTx.length / maxApduSize) * maxApduSize;
    let lastData = rawTx.slice(lastOffset, lastOffset+maxApduSize);
    let response = await this.transport.send(0x80, 0x03, 0x81, 0x00, lastData);
    return response.toString("hex");
  }

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
    hash: string
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
}
