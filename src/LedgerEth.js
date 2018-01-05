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

import { splitPath, foreach } from "./utils";
import type LedgerComm from "./LedgerComm";

export default class LedgerEth {
  comm: LedgerComm;

  constructor(comm: LedgerComm) {
    this.comm = comm;
    comm.setScrambleKey("w0w");
  }

  getAddress_async(
    path: string,
    boolDisplay: boolean,
    boolChaincode: boolean
  ): Promise<{
    publicKey: string,
    address: string,
    chainCode?: string
  }> {
    let paths = splitPath(path);
    let buffer = new Buffer(5 + 1 + paths.length * 4);
    buffer[0] = 0xe0;
    buffer[1] = 0x02;
    buffer[2] = boolDisplay ? 0x01 : 0x00;
    buffer[3] = boolChaincode ? 0x01 : 0x00;
    buffer[4] = 1 + paths.length * 4;
    buffer[5] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 6 + 4 * index);
    });
    return this.comm
      .exchange(buffer.toString("hex"), [0x9000])
      .then(responseHex => {
        let result = {};
        let response = new Buffer(responseHex, "hex");
        let publicKeyLength = response[0];
        let addressLength = response[1 + publicKeyLength];
        result.publicKey = response
          .slice(1, 1 + publicKeyLength)
          .toString("hex");
        result.address =
          "0x" +
          response
            .slice(
              1 + publicKeyLength + 1,
              1 + publicKeyLength + 1 + addressLength
            )
            .toString("ascii");
        if (boolChaincode) {
          result.chainCode = response
            .slice(
              1 + publicKeyLength + 1 + addressLength,
              1 + publicKeyLength + 1 + addressLength + 32
            )
            .toString("hex");
        }
        return result;
      });
  }

  signTransaction_async(
    path: string,
    rawTxHex: string
  ): Promise<{
    s: string,
    v: string,
    r: string
  }> {
    let paths = splitPath(path);
    let offset = 0;
    let rawTx = new Buffer(rawTxHex, "hex");
    let apdus = [];
    let response = [];
    while (offset !== rawTx.length) {
      let maxChunkSize = offset === 0 ? 150 - 1 - paths.length * 4 : 150;
      let chunkSize =
        offset + maxChunkSize > rawTx.length
          ? rawTx.length - offset
          : maxChunkSize;
      let buffer = new Buffer(
        offset === 0 ? 5 + 1 + paths.length * 4 + chunkSize : 5 + chunkSize
      );
      buffer[0] = 0xe0;
      buffer[1] = 0x04;
      buffer[2] = offset === 0 ? 0x00 : 0x80;
      buffer[3] = 0x00;
      buffer[4] = offset === 0 ? 1 + paths.length * 4 + chunkSize : chunkSize;
      if (offset === 0) {
        buffer[5] = paths.length;
        paths.forEach((element, index) => {
          buffer.writeUInt32BE(element, 6 + 4 * index);
        });
        rawTx.copy(buffer, 6 + 4 * paths.length, offset, offset + chunkSize);
      } else {
        rawTx.copy(buffer, 5, offset, offset + chunkSize);
      }
      apdus.push(buffer.toString("hex"));
      offset += chunkSize;
    }
    return foreach(apdus, apdu =>
      this.comm.exchange(apdu, [0x9000]).then(apduResponse => {
        response = apduResponse;
      })
    ).then(() => {
      response = new Buffer(response, "hex");
      const v = response.slice(0, 1).toString("hex");
      const r = response.slice(1, 1 + 32).toString("hex");
      const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
      return { v, r, s };
    });
  }

  getAppConfiguration_async(): Promise<{
    arbitraryDataEnabled: number,
    version: string
  }> {
    let buffer = new Buffer(5);
    buffer[0] = 0xe0;
    buffer[1] = 0x06;
    buffer[2] = 0x00;
    buffer[3] = 0x00;
    buffer[4] = 0x00;
    return this.comm
      .exchange(buffer.toString("hex"), [0x9000])
      .then(responseHex => {
        let result = {};
        let response = Buffer.from(responseHex, "hex");
        result.arbitraryDataEnabled = response[0] & 0x01;
        result.version =
          "" + response[1] + "." + response[2] + "." + response[3];
        return result;
      });
  }

  signPersonalMessage_async(
    path: string,
    messageHex: string
  ): Promise<{
    v: number,
    s: string,
    r: string
  }> {
    let paths = splitPath(path);
    let offset = 0;
    let message = new Buffer(messageHex, "hex");
    let apdus = [];
    let response = [];
    while (offset !== message.length) {
      let maxChunkSize = offset === 0 ? 150 - 1 - paths.length * 4 - 4 : 150;
      let chunkSize =
        offset + maxChunkSize > message.length
          ? message.length - offset
          : maxChunkSize;
      let buffer = new Buffer(
        offset === 0 ? 5 + 1 + paths.length * 4 + 4 + chunkSize : 5 + chunkSize
      );
      buffer[0] = 0xe0;
      buffer[1] = 0x08;
      buffer[2] = offset === 0 ? 0x00 : 0x80;
      buffer[3] = 0x00;
      buffer[4] =
        offset === 0 ? 1 + paths.length * 4 + 4 + chunkSize : chunkSize;
      if (offset === 0) {
        buffer[5] = paths.length;
        paths.forEach((element, index) => {
          buffer.writeUInt32BE(element, 6 + 4 * index);
        });
        buffer.writeUInt32BE(message.length, 6 + 4 * paths.length);
        message.copy(
          buffer,
          6 + 4 * paths.length + 4,
          offset,
          offset + chunkSize
        );
      } else {
        message.copy(buffer, 5, offset, offset + chunkSize);
      }
      apdus.push(buffer.toString("hex"));
      offset += chunkSize;
    }
    return foreach(apdus, apdu =>
      this.comm.exchange(apdu, [0x9000]).then(apduResponse => {
        response = apduResponse;
      })
    ).then(() => {
      response = new Buffer(response, "hex");
      const v = response[0];
      const r = response.slice(1, 1 + 32).toString("hex");
      const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
      return { v, r, s };
    });
  }
}
