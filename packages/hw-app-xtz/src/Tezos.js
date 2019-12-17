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

import type Transport from "@ledgerhq/hw-transport";

export const TezosCurves = {
  ED25519: 0x00,
  SECP256K1: 0x01,
  SECP256R1: 0x02
};

export type Curve = $Values<typeof TezosCurves>;

export type GetAddressResult = {|
  publicKey: string
|};

export type SignOperationResult = {|
  signature: string
|};

export type GetVersionResult = {|
  major: number,
  minor: number,
  patch: number,
  bakingApp: boolean
|};

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
      ["getAddress", "signOperation", "signHash", "getVersion"],
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
  async getAddress(
    path: string,
    boolDisplay?: boolean,
    curve?: Curve,
    apdu?: number // TODO specify
  ): Promise<GetAddressResult> {
    const cla = 0x80;
    if (!apdu) {
      if (boolDisplay) {
        apdu = 0x03;
      } else {
        apdu = 0x02;
      }
    }
    const p1 = 0;
    const p2 = curve || 0;

    let paths = splitPath(path);
    let buffer = new Buffer(1 + paths.length * 4);
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });

    const payload = await this.transport.send(cla, apdu, p1, p2, buffer);

    let publicKeyLength = payload[0];
    let publicKey = payload.slice(1, 1 + publicKeyLength);
    const res: GetAddressResult = {
      publicKey: publicKey.toString("hex")
    };
    return res;
  }

  async sign(
    path: string,
    rawTxHex: string,
    curve: Curve,
    apdu: number
  ): Promise<SignOperationResult> {
    let paths = splitPath(path);
    let offset = 0;
    let rawTx = new Buffer(rawTxHex, "hex");
    let toSend = [];

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
      let maxChunkSize = 230;
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

    let response;
    for (let i = 0; i < toSend.length; i++) {
      const data = toSend[i];
      let code = 0x01;
      if (i === 0) {
        code = 0x00;
      } else if (i === toSend.length - 1) {
        code = 0x81;
      }
      response = await this.transport.send(0x80, apdu, code, curve, data);
    }
    let signature;
    if (curve == 0) {
      // tz1 signatures come correctly formatted from the ledger.
      signature = response.slice(0, response.length - 2).toString("hex");
    } else {
      // tz2 and tz3 signatures are in DER format from the ledger.
      const parseError = function() { throw new Error("Cannot parse ledger response."); }
      var signature_buffer = new Buffer(64);
      signature_buffer.fill(0);
      var r_val = signature_buffer.subarray(0, 32);
      var s_val = signature_buffer.subarray(32,64);
      var idx=0;
      const frameType=response.readUInt8(idx++);
      // Accept either an ASN.1 sequence or ASN.1 set
      if(frameType != 0x31 && frameType != 0x30) parseError();

      // We are two bytes into the signature, and there are two bytes after the
      // signature in response, so length +4 here.
      if(response.readUInt8(idx++)+4 != response.length) parseError();
      if(response.readUInt8(idx++) != 0x02) parseError();
      var r_length = response.readUInt8(idx++);
      if(r_length>32) { // Handle forced 0x00 33rd byte from DER format
              idx+=(r_length-32);
              r_length=32;
      }
      response.copy(r_val,32-r_length,idx,idx+r_length);
      idx+=r_length;
      if(response.readUInt8(idx++) != 0x02) parseError();
      var s_length = response.readUInt8(idx++);
      if(s_length>32) { // Handle forced 0x00 33rd byte from DER format
              idx+=(s_length-32);
              s_length=32;
      }
      response.copy(s_val,32-s_length,idx,idx+s_length);
      idx+=s_length;

      // We should have just the two bytes at the end of the ledger response left.
      if(idx != response.length-2) parseError();

      signature = signature_buffer.toString("hex");
    }
    return { signature };
  }

  async signOperation(
    path: string,
    rawTxHex: string,
    curve?: number
  ): Promise<{
      signature: string
  }> {
    curve = curve ? curve : 0x00;
    const result = await this.sign(path, rawTxHex, curve, 0x04);
    return result;
  }

  async signHash(
    path: string,
    rawTxHex: string,
    curve?: number
  ): Promise<{
      signature: string
  }> {
    curve = curve ? curve : 0x00;
    const result = await this.sign(path, rawTxHex, curve, 0x05);
    return result;
  }

  async getVersion(): Promise<GetVersionResult> {
    const [appFlag, major, minor, patch] = await this.transport.send(
      0x80,
      0x00,
      0x00,
      0x00,
      new Buffer(0)
    );
    const bakingApp = appFlag === 1;
    return { major, minor, patch, bakingApp };
  }
}

// TODO use bip32-path library
function splitPath(path: string): number[] {
  let result = [];
  let components = path.split("/");
  components.forEach(element => {
    let number = parseInt(element, 10);
    if (isNaN(number)) {
      return; // FIXME shouldn't it throws instead?
    }
    if (element.length > 1 && element[element.length - 1] === "'") {
      number += 0x80000000;
    }
    result.push(number);
  });
  return result;
}
