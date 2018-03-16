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

import type Transport from "@ledgerhq/hw-transport";

const CLA = 0x80;

const OFFSET_CDATA = 8;
const OFFSET_LC = 4;

const INS_GET_PUBLIC_KEY = 0x01;
const INS_APP_INFO = 0x04;

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

  constructor(transport: Transport<*>) {
    this.transport = transport;
    this.methods = [ "isConnected", "getWalletRecoveryPassphrase", "getWalletPublicKeyWithIndex", "signTransaction" ];
    transport.decorateAppAPIMethods(this, this.methods, "ADA");
  }

  /**
   * Checks if the device is connected and if so, returns an object
   * containing the app version.
   *
   * @returns {Promise<{success:boolean, major:number, minor:number, patch:number}>} Result object containing the application version number.
   *
   * @example
   * ada.isConnected()
   *  .then((response) => {
   *    const { major, minor, patch } = response;
   *    console.log('App version %d.%d.%d: ', major, minor, patch);
   *  })
   *  .catch(error => console.log(error));
   *
   */
  async isConnected(): Promise<{ major: string, minor: string, patch: string }> {
    const buffer = Buffer.alloc(OFFSET_CDATA);
    buffer.writeUInt32BE(0, OFFSET_LC);

    const response = await this.transport.send(CLA, INS_APP_INFO, 0x00, 0x00, buffer);
    const [ major, minor, patch ] = response;

    return { major, minor, patch };
  }

  /**
   * @description Get the root extended public key of the wallet,
   * also known as the wallet recovery passphrase.
   * BIP 32 Path M 44' /1815'
   * 32 Byte Public Key
   * 32 Byte Chain Code
   *
   * @return {Promise<{success:boolean, publicKey:string, chainCode:string }>} The result object containing the root wallet public key and chaincode.
   *
   * @example
   * ada.getWalletRecoveryPassphrase()
   *  .then((response) => {
   *    console.log(response.publicKey);
   *    console.log(response.chainCode);
   *  })
   *  .catch(error => console.log(error));
   *
   */
  async getWalletRecoveryPassphrase(): Promise<{ publicKey: string, chainCode: string }> {
    const buffer = Buffer.alloc(OFFSET_CDATA);
    buffer.writeUInt32BE(0, OFFSET_LC);

    const response = await this.transport.send(CLA, INS_GET_PUBLIC_KEY, 0x01, 0x00, buffer);
    const [ publicKeyLength ] = response;
    const publicKey = response.slice(1, 1 + publicKeyLength).toString("hex");
    const chainCode = response.slice(1, 1 + publicKeyLength + 32).toString("hex");

    return { publicKey, chainCode };
  }

  /**
   * @description Get a public key from the specified BIP 32 index.
   * The BIP 32 index is from the path at `44'/1815'/0'/[index]`.
   *
   * @param {number} index The index to retrieve.
   * @return {Promise<{ success:boolean, publicKey:string }>} The public key for the given index.
   *
   * @throws 5201 - Non-hardened index passed in, Index < 0x80000000
   * @throws 5202 - Invalid header
   * @throws 5003 - Index not a number
   *
   * @example
   * ada.getWalletPublicKeyWithIndex(0xC001CODE)
   *  .then((response) => {
   *    console.log(response.publicKey);
   *  })
   *  .catch(error => console.log(error));
   *
   */
  async getWalletPublicKeyWithIndex(index: number): Promise<{ publicKey: string }> {
    const buffer = Buffer.alloc(OFFSET_CDATA + 4);
    buffer.writeUInt32BE(4, OFFSET_LC);
    buffer.writeUInt32BE(index, OFFSET_CDATA);
    
    const response = await this.transport.send(CLA, INS_GET_PUBLIC_KEY, 0x02, 0x00, buffer);
    const [ publicKeyLength ] = response;
    const publicKey = response.slice(1, 1 + publicKeyLength).toString("hex");

    return { publicKey };
  }
};
