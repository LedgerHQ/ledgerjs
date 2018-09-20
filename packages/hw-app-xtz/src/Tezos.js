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

// FIXME drop:
import { splitPath, foreach } from "./utils";
import type Transport from "@ledgerhq/hw-transport";

/**
 * Tezos API
 *
 * @example
 * import Tezos from "@ledgerhq/hw-app-xtz";
 * const tez = new Tezos(transport)
 */
export default class Tezos {
  transport: Transport<*>;

  constructor(transport: Transport<*>) {
    this.transport = transport;
    transport.decorateAppAPIMethods(
      this,
      [
        "getAddress",
        "signOperation",
        "getVersion"
      ],
      "XTZ"
    );
  }

  /**
   * get Tezos address for a given BIP 32 path.
   * @param path a path in BIP 32 format, must begin with 44'/1729'
   * @option boolDisplay optionally enable or not the display
   * @option boolChaincode optionally enable or not the chaincode request
   * @option apdu to use a custom apdu. This should currently only be unset (which will choose
             an appropriate APDU based on the boolDisplay parameter), or else set to 0x0A
             for the special "display" APDU which uses the alternate copy "Your Key"
   * @return an object with a publicKey
   * @example
   * tez.getAddress("44'/1729'/0'/0'").then(o => o.address)
   */
  getAddress(
    path: string,
    boolDisplay?: boolean,
    curve?: number,
    apdu?: number
  ): Promise<{
    publicKey: string
  }> {
    if (!apdu) {
      if (boolDisplay) {
        apdu = 0x03;
      } else {
        apdu = 0x02;
      }
    }

    let paths = splitPath(path);
    let buffer = new Buffer(1 + paths.length * 4);
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    return this.transport
      .send(
        0x80,
        apdu,
        0,
        curve ? curve : 0x00, // Defaults to Secp256k1
        buffer
      )
      .then(response => {
        let result = {};
        let publicKeyLength = response[0];
        result.publicKey = response
          .slice(1, 1 + publicKeyLength)
          .toString("hex");
        return result;
      });
  }

  signOperation(
    path: string,
    rawTxHex: string,
    curve?: number
  ): Promise<{
      signature: string
  }> {
    let paths = splitPath(path);
    let offset = 0;
    let rawTx = new Buffer(rawTxHex, "hex");
    let toSend = [];
    let response;
    curve = curve ? curve : 0x00;

    // Initial key setting
    {
      let buffer = new Buffer(paths.length * 4 + 1);
      buffer[0] = paths.length;
      paths.forEach((element, index) => {
        buffer.writeUInt32BE(element, 1 + 4 * index);
      });
      toSend.push(buffer);
    }

    while (offset !== rawTx.length) {
      let maxChunkSize = 255;
      let chunkSize;
      if (offset + maxChunkSize >= rawTx.length) {
        chunkSize = rawTx.length - offset;
      } else {
        chunkSize = maxChunkSize;
      }
      let buffer = new Buffer(chunkSize);
      rawTx.copy(buffer, 0, offset, offset + chunkSize);
      toSend.push(buffer);
      offset += chunkSize;
    }

    return foreach(toSend, (data, i) => {
      let code = 0x01;
      if (i === 0) {
        code = 0x00;
      } else if (i === toSend.length - 1) {
        code = 0x81;
      }
      return this.transport
        .send(0x80, 0x04, code, curve, data)
        .then(apduResponse => {
          response = apduResponse;
        })
    }
    ).then(() => {
      let signature = response.slice(0, response.length - 2).toString("hex");
      return { signature };
    });
  }

  getVersion(): Promise<{
      major: number,
      minor: number,
      patch: number,
      bakingApp: boolean
  }> {
      return this.transport.send(0x80, 0x00, 0x00, 0x00, new Buffer(0)).then(apduResponse => {
          let bakingApp = apduResponse[0] == 1;
          let major = apduResponse[1];
          let minor = apduResponse[2];
          let patch = apduResponse[3];
          return { major, minor, patch, bakingApp };
      });
  }
}
