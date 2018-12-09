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
// @flow

import Int64 from "node-int64";
import type Transport from "@ledgerhq/hw-transport";
import { TransportStatusError } from "@ledgerhq/hw-transport";

const CLA = 0x80;

const INS_GET_PUBLIC_KEY = 0x01;
const INS_SET_TX = 0x02;
const INS_SIGN_TX = 0x03;
const INS_APP_INFO = 0x04;

const P1_FIRST = 0x01;
const P1_NEXT = 0x02;
const P1_LAST = 0x03;

const P2_SINGLE_TX = 0x01;
const P2_MULTI_TX = 0x02;

const MAX_APDU_SIZE = 64;
const OFFSET_CDATA = 5;
const MAX_ADDR_PRINT_LENGTH = 12;
const INDEX_MAX = 0xffffffff;

const INDEX_NAN = 0x5003;
const INDEX_MAX_EXCEEDED = 0x5302;

/**
 * Cardano ADA API
 *
 * @example
 * import Ada from "@ledgerhq/hw-app-ada";
 * const ada = new Ada(transport);
 */
export default class Ada {
  transport: Transport<*>;
  methods: Array<string>;

  constructor(transport: Transport<*>, scrambleKey: string = "ADA") {
    this.transport = transport;
    this.methods = [
      "isConnected",
      "getWalletRecoveryPassphrase",
      "getWalletPublicKeyWithIndex",
      "signTransaction"
    ];
    this.transport.decorateAppAPIMethods(this, this.methods, scrambleKey);
  }

  /**
   * Checks if the device is connected and if so, returns an object
   * containing the app version.
   *
   * @returns {Promise<{major:number, minor:number, patch:number}>} Result object containing the application version number.
   *
   * @example
   * const { major, minor, patch } = await ada.isConnected();
   * console.log(`App version ${major}.${minor}.${patch}`);
   *
   */
  async isConnected(): Promise<{
    major: string,
    minor: string,
    patch: string
  }> {
    const response = await this.transport.send(CLA, INS_APP_INFO, 0x00, 0x00);

    const [major, minor, patch] = response;
    return { major, minor, patch };
  }

  /**
   * @description Get the root extended public key of the wallet,
   * also known as the wallet recovery passphrase.
   * BIP 32 Path M 44' /1815'
   * 32 Byte Public Key
   * 32 Byte Chain Code
   *
   * @return {Promise<{ publicKey:string, chainCode:string }>} The result object containing the root wallet public key and chaincode.
   *
   * @example
   * const { publicKey, chainCode } = await ada.getWalletRecoveryPassphrase();
   * console.log(publicKey);
   * console.log(chainCode);
   *
   */
  async getWalletRecoveryPassphrase(): Promise<{
    publicKey: string,
    chainCode: string
  }> {
    const response = await this.transport.send(
      CLA,
      INS_GET_PUBLIC_KEY,
      0x01,
      0x00
    );

    const [publicKeyLength] = response;
    const publicKey = response.slice(1, 1 + publicKeyLength).toString("hex");
    const chainCode = response
      .slice(1 + publicKeyLength, 1 + publicKeyLength + 32)
      .toString("hex");

    return { publicKey, chainCode };
  }

  /**
   * @description Get a public key from the specified BIP 32 index.
   * The BIP 32 index is from the path at `44'/1815'/0'/[index]`.
   *
   * @param {number} index The index to retrieve.
   * @return {Promise<{ publicKey:string }>} The public key for the given index.
   *
   * @throws 5201 - Non-hardened index passed in, Index < 0x80000000
   * @throws 5202 - Invalid header
   * @throws 5003 - Index not a number
   *
   * @example
   * const { publicKey } = await ada.getWalletPublicKeyWithIndex(0xC001CODE);
   * console.log(publicKey);
   *
   */
  async getWalletPublicKeyWithIndex(
    index: number
  ): Promise<{ publicKey: string }> {
    if (isNaN(index)) {
      throw new TransportStatusError(INDEX_NAN);
    }

    const data = Buffer.alloc(4);
    data.writeUInt32BE(index, 0);

    const response = await this.transport.send(
      CLA,
      INS_GET_PUBLIC_KEY,
      0x02,
      0x00,
      data
    );

    const [publicKeyLength] = response;
    const publicKey = response.slice(1, 1 + publicKeyLength).toString("hex");

    return { publicKey };
  }

  /**
   * @description Signs a hex encoded transaction with the given indexes.
   * The transaction is hased using Blake2b on the Ledger device.
   * Then, signed by the private key derived from each of the passed in indexes at
   * path 44'/1815'/0'/[index].
   *
   * @param {string} txHex The transaction to be signed.
   * @param {number[]} indexes The indexes of the keys to be used for signing.
   * @return {Array.Promise<{ digest:string }>} An array of result objects containing a digest for each of the passed in indexes.
   *
   * @throws 5001 - Tx > 1024 bytes
   * @throws 5301 - Index < 0x80000000
   * @throws 5302 - Index > 0xFFFFFFFF
   * @throws 5003 - Index not a number
   *
   * @example
   * const transaction = '839F8200D8185826825820E981442C2BE40475BB42193CA35907861D90715854DE6FCBA767B98F1789B51219439AFF9F8282D818584A83581CE7FE8E468D2249F18CD7BF9AEC0D4374B7D3E18609EDE8589F82F7F0A20058208200581C240596B9B63FC010C06FBE92CF6F820587406534795958C411E662DC014443C0688E001A6768CC861B0037699E3EA6D064FFA0';
   * const { digest } = await ada.signTransaction(transaction, [0xF005BA11]);
   * console.log(`Signed successfully: ${digest}`);
   *
   */
  async signTransaction(
    txHex: string,
    indexes: Array<number>
  ): Promise<Array<{ digest: string }>> {
    await this.setTransaction(txHex);
    return this.signTransactionWithIndexes(indexes);
  }

  /**
   * Set the transaction.
   *
   * @param {string} txHex The transaction to be set.
   * @return Promise<{ inputs?: string, outputs?: string, txs?: Array<{ address: string, amount: string }> }>  The response from the device.
   * @private
   */
  async setTransaction(
    txHex: string
  ): Promise<{
    inputs?: string,
    outputs?: string,
    txs?: Array<{ address: string, amount: string }>
  }> {
    const rawTx = Buffer.from(txHex, "hex");
    const chunkSize = MAX_APDU_SIZE - OFFSET_CDATA;
    let response = {};

    for (let i = 0; i < rawTx.length; i += chunkSize) {
      const chunk = rawTx.slice(i, i + chunkSize);
      const p2 = rawTx.length < chunkSize ? P2_SINGLE_TX : P2_MULTI_TX;
      let p1 = P1_NEXT;

      if (i === 0) {
        p1 = P1_FIRST;
      } else if (i + chunkSize >= rawTx.length) {
        p1 = P1_LAST;
      }

      const res = await this.transport.send(CLA, INS_SET_TX, p1, p2, chunk);

      if (res.length > 4) {
        const [inputs, outputs] = res;
        const txs = [];

        let offset = 2;
        for (let i = 0; i < outputs; i++) {
          let address = res
            .slice(offset, offset + MAX_ADDR_PRINT_LENGTH)
            .toString();
          offset += MAX_ADDR_PRINT_LENGTH;
          let amount = new Int64(
            res.readUInt32LE(offset + 4),
            res.readUInt32LE(offset)
          ).toOctetString();
          txs.push({ address, amount });
          offset += 8;
        }

        response = { inputs, outputs, txs };
      }
    }

    return response;
  }

  /**
   * Sign the set transaction with the given indexes.
   * Note that setTransaction must be called prior to this being called.
   *
   * @param {number[]} indexes The indexes of the keys to be used for signing.
   * @returns {Array.Promise<Object>} An array of result objects containing a digest for each of the passed in indexes.
   * @private
   */
  async signTransactionWithIndexes(
    indexes: Array<number>
  ): Promise<Array<{ digest: string }>> {
    let response = [];

    for (let i = 0; i < indexes.length; i++) {
      if (isNaN(indexes[i])) {
        throw new TransportStatusError(INDEX_NAN);
      }

      if (indexes[i] > INDEX_MAX) {
        throw new TransportStatusError(INDEX_MAX_EXCEEDED);
      }

      const data = Buffer.alloc(4);
      data.writeUInt32BE(indexes[i], 0);

      const res = await this.transport.send(CLA, INS_SIGN_TX, 0x00, 0x00, data);
      const digest = res.slice(0, res.length - 2).toString("hex");

      response.push({ digest });
    }

    return response;
  }
}
