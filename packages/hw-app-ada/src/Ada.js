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
import { TransportStatusError } from "@ledgerhq/hw-transport";

const CLA = 0xD7;
const HARDENED = 0x80000000;

const INS_GET_VERSION = 0x00;
const INS_GET_EXT_PUBLIC_KEY = 0x10;

// These are just JS error codes (no parallel with in-ledger app codes)
const INVALID_PATH = 0x5001;
const INVALID_PATH_LENGTH = 0x5002;
const INDEX_NAN = 0x5003;

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
      "getVersion",
      "getExtendedPublicKey",
      "signTransaction"
    ];
    this.transport.decorateAppAPIMethods(this, this.methods, scrambleKey);
  }

  /**
   * Returns an object containing the app version.
   *
   * @returns {Promise<{major:number, minor:number, patch:number}>} Result object containing the application version number.
   *
   * @example
   * const { major, minor, patch } = await ada.getVersion();
   * console.log(`App version ${major}.${minor}.${patch}`);
   *
   */
  async getVersion(): Promise<{
    major: string,
    minor: string,
    patch: string
  }> {
    const response = await this.transport.send(CLA, INS_GET_VERSION, 0x00, 0x00);

    const [major, minor, patch] = response;
    return { major, minor, patch };
  }

  /**
   * @description Get a public key from the specified BIP 32 path.
   *
   * @param {Array<number>} indexes The path indexes. Path must begin with `44'/1815'/n'`, and may be up to 10 indexes long.
   * @return {Promise<{ publicKey:string, chainCode:string }>} The public key with chaincode for the given path.
   *
   * @throws 5001 - The path provided does not have the first 3 indexes hardened
   * @throws 5002 - The path provided is less than 3 indexes
   * @throws 5003 - Some of the indexes is not a number
   *
   * @example
   * const { publicKey, chainCode } = await ada.getExtendedPublicKey([ HARDENED + 44, HARDENED + 1815, HARDENED + 1 ]);
   * console.log(publicKey);
   *
   */
  async getExtendedPublicKey(
    indexes: Array<number>
  ): Promise<{ publicKey: string, chainCode: string }> {
    if (indexes.length < 3 || indexes.length > 10) {
      throw new TransportStatusError(INVALID_PATH_LENGTH);
    }
    if (indexes.some(index => isNaN(index))) {
      throw new TransportStatusError(INDEX_NAN);
    }
    if (indexes.slice(0, 3).some(x => x < HARDENED)) {
      throw new TransportStatusError(INVALID_PATH);
    }

    const data = Buffer.alloc(1 + 4 * indexes.length);
    data.writeUInt8(indexes.length, 0);

    for (let i = 0; i < indexes.length; i++) {
      data.writeUInt32BE(indexes[i], 1 + i * 4);
    }

    const response = await this.transport.send(
      CLA,
      INS_GET_EXT_PUBLIC_KEY,
      0x00,
      0x00,
      data
    );

    const publicKeyLength = response[0];
    const publicKey = response.slice(1, 1 + publicKeyLength).toString("hex");
    const chainCode = response
      .slice(1 + publicKeyLength, 1 + publicKeyLength + 32)
      .toString("hex");

    return { publicKey, chainCode };
  }
}