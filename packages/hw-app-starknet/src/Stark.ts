/********************************************************************************
 * (c) 2022 Ledger
 *  (c) 2019-2020 Zondax GmbH
 *  (c) 2016-2017 Ledger
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
import Transport from "@ledgerhq/hw-transport";
import { serializePath } from "./helper";
import {
  ResponseAddress,
  ResponseAppInfo,
  ResponseSign,
  ResponseVersion,
} from "./types";
import {
  HASH_MAX_LENGTH,
  CHUNK_SIZE,
  CLA,
  errorCodeToString,
  getVersion,
  INS,
  LedgerError,
  P1_VALUES,
  PAYLOAD_TYPE,
  processErrorResponse,
} from "./common";

export { LedgerError };
export * from "./types";

function processGetAddrResponse(response: Uint8Array) {
  let partialResponse = response;

  const errorCodeData = partialResponse.subarray(-2);
  const returnCode = errorCodeData[0] * 256 + errorCodeData[1];

  //get public key len (variable)
  const PKLEN = partialResponse[0];
  const publicKey = partialResponse.slice(1, 1 + PKLEN);

  //"advance" buffer
  partialResponse = partialResponse.subarray(1 + PKLEN);

  return {
    publicKey,
    returnCode,
    errorMessage: errorCodeToString(returnCode),
  };
}

/* see https://github.com/0xs34n/starknet.js/blob/develop/src/utils/ellipticCurve.ts#L29 */
function fixHash(hash: string) {
  let fixed_hash = hash.replace(/^0x0*/, "");
  if (fixed_hash.length > HASH_MAX_LENGTH) {
    throw "invalid hash length";
  }
  const s = "0".repeat(HASH_MAX_LENGTH - fixed_hash.length);
  fixed_hash = s.concat(fixed_hash);
  return fixed_hash + "0";
}

function hexToBytes(hex: string) {
  const bytes: number[] = [];
  for (let c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substring(c, c + 2), 16));
  return Uint8Array.from(bytes);
}

/**
 * Starknet API
 *
 * @example
 * import Stark from "@ledgerhq/hw-app-starknet";
 * const stark = new Stark(transport)
 */
export default class Stark {
  transport;

  constructor(transport: Transport) {
    this.transport = transport;
    if (!transport) {
      throw new Error("Transport has not been defined");
    }
  }

  static prepareChunks(message: Uint8Array, serializedPathBuffer?: Uint8Array) {
    const chunks: Uint8Array[] = [];

    // First chunk (only path)
    if (serializedPathBuffer !== undefined) {
      // First chunk (only path)
      chunks.push(serializedPathBuffer!);
    }

    const messageBuffer = Uint8Array.from(message);

    for (let i = 0; i < messageBuffer.length; i += CHUNK_SIZE) {
      let end = i + CHUNK_SIZE;
      if (i > messageBuffer.length) {
        end = messageBuffer.length;
      }
      chunks.push(messageBuffer.subarray(i, end));
    }

    return chunks;
  }

  async signGetChunks(path: string, message: Uint8Array) {
    return Stark.prepareChunks(message, serializePath(path));
  }

  /**
   * get version of Nano Starknet application
   * @return an object with a major, minor, patch
   */
  async getVersion(): Promise<ResponseVersion> {
    return getVersion(this.transport).catch((err) => processErrorResponse(err));
  }

  /**
   * get information about Nano Starknet application
   * @return an object with appName, appVersion
   */
  async getAppInfo(): Promise<ResponseAppInfo> {
    return this.transport.send(0xb0, 0x01, 0, 0).then((response) => {
      const errorCodeData = response.subarray(-2);
      const returnCode = errorCodeData[0] * 256 + errorCodeData[1];

      const result: { errorMessage?: string; returnCode?: LedgerError } = {};

      let appName = "err";
      let appVersion = "err";
      let flagLen = 0;
      let flagsValue = 0;

      if (response[0] !== 1) {
        // Ledger responds with format ID 1. There is no spec for any format != 1
        result.errorMessage = "response format ID not recognized";
        result.returnCode = LedgerError.DeviceIsBusy;
      } else {
        const appNameLen = response[1];
        appName = response.subarray(2, 2 + appNameLen).toString("ascii");
        let idx = 2 + appNameLen;
        const appVersionLen = response[idx];
        idx += 1;
        appVersion = response
          .subarray(idx, idx + appVersionLen)
          .toString("ascii");
        idx += appVersionLen;
        const appFlagsLen = response[idx];
        idx += 1;
        flagLen = appFlagsLen;
        flagsValue = response[idx];
      }

      return {
        returnCode,
        errorMessage: errorCodeToString(returnCode),
        //
        appName,
        appVersion,
        flagLen,
        flagsValue,
        flagRecovery: (flagsValue & 1) !== 0,
        // eslint-disable-next-line no-bitwise
        flagSignedMcuCode: (flagsValue & 2) !== 0,
        // eslint-disable-next-line no-bitwise
        flagOnboarded: (flagsValue & 4) !== 0,
        // eslint-disable-next-line no-bitwise
        flagPINValidated: (flagsValue & 128) !== 0,
      };
    }, processErrorResponse);
  }

  /**
   * get Starknet public key derived from provided derivation path
   * @param path a path in EIP-2645 format (https://github.com/ethereum/EIPs/blob/master/EIPS/eip-2645.md)
   * @return an object with publicKey
   *  * @example
   * stark.getPubKey("m/2645'/579218131'/0'/0'").then(o => o.publicKey)
   */
  async getPubKey(path: string): Promise<ResponseAddress> {
    const serializedPath = Buffer.from(serializePath(path));
    return this.transport
      .send(CLA, INS.GET_ADDR, P1_VALUES.ONLY_RETRIEVE, 0, serializedPath, [
        LedgerError.NoErrors,
      ])
      .then(processGetAddrResponse, processErrorResponse);
  }

  /**
   * get and show Starknet public key derived from provided derivation path
   * @param path a path in EIP-2645 format (https://github.com/ethereum/EIPs/blob/master/EIPS/eip-2645.md)
   * @return an object with publicKey
   * @example
   * stark.showPubKey("m/2645'/579218131'/0'/0'").then(o => o.publicKey)
   */
  async showPubKey(path: string): Promise<ResponseAddress> {
    const serializedPath = Buffer.from(serializePath(path));
    return this.transport
      .send(
        CLA,
        INS.GET_ADDR,
        P1_VALUES.SHOW_ADDRESS_IN_DEVICE,
        0,
        serializedPath,
        [LedgerError.NoErrors]
      )
      .then(processGetAddrResponse, processErrorResponse);
  }

  async signSendChunk(
    chunkIdx: number,
    chunkNum: number,
    chunk: Uint8Array,
    ins: number = INS.SIGN,
    p2 = 0
  ): Promise<ResponseSign> {
    let payloadType = PAYLOAD_TYPE.ADD;
    if (chunkIdx === 1) {
      payloadType = PAYLOAD_TYPE.INIT;
    }
    if (chunkIdx === chunkNum) {
      payloadType = PAYLOAD_TYPE.LAST;
    }

    return this.transport
      .send(CLA, ins, payloadType, p2, Buffer.from(chunk), [
        LedgerError.NoErrors,
        LedgerError.DataIsInvalid,
        LedgerError.BadKeyHandle,
        LedgerError.SignVerifyError,
      ])
      .then((response: Uint8Array) => {
        const errorCodeData = response.subarray(-2);
        const returnCode = errorCodeData[0] * 256 + errorCodeData[1];
        let errorMessage = errorCodeToString(returnCode);

        if (
          returnCode === LedgerError.BadKeyHandle ||
          returnCode === LedgerError.DataIsInvalid ||
          returnCode === LedgerError.SignVerifyError
        ) {
          errorMessage = `${errorMessage} : ${response
            .subarray(0, response.length - 2)
            .toString()}`;
        }

        if (returnCode === LedgerError.NoErrors && response.length > 2) {
          return {
            r: response.subarray(0, 32),
            s: response.subarray(32, 32 + 32),
            v: response[64],
            hash: response.subarray(65, 65 + 32),
            returnCode: returnCode,
            errorMessage: errorMessage,
          };
        }

        return {
          returnCode: returnCode,
          errorMessage: errorMessage,
        };
      }, processErrorResponse);
  }

  /**
   * sign the given hash over the Starknet elliptic curve (!! apply a SHA256() on message before computing signature)
   * @param path a path in EIP-2645 format
   * @param message hexadecimal hash to sign
   * @return an object with (r, s, v) signature
   */
  async sign(path: string, message: Uint8Array) {
    return this.signGetChunks(path, message).then((chunks) => {
      return this.signSendChunk(1, chunks.length, chunks[0], INS.SIGN).then(
        async (response) => {
          let result = {
            returnCode: response.returnCode,
            errorMessage: response.errorMessage,
            hash: null as null | Uint8Array,
            r: null as null | Uint8Array,
            s: null as null | Uint8Array,
            v: null as null | number,
          };

          for (let i = 1; i < chunks.length; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            result = await this.signSendChunk(
              1 + i,
              chunks.length,
              chunks[i],
              INS.SIGN
            );
            if (result.returnCode !== LedgerError.NoErrors) {
              break;
            }
          }
          return result;
        },
        processErrorResponse
      );
    }, processErrorResponse);
  }

  /**
   * sign the given hash over the Starknet elliptic curve
   * @param path a path in EIP-2645 format
   * @param message hexadecimal hash to sign
   * @return an object with (r, s, v) signature
   */
  async signFelt(path: string, hash: string, show = true) {
    const felt = hexToBytes(fixHash(hash));

    return this.signGetChunks(path, felt).then((chunks) => {
      return this.signSendChunk(
        1,
        chunks.length,
        chunks[0],
        INS.SIGN_FELT,
        show ? 1 : 0
      ).then(async (response) => {
        let result = {
          returnCode: response.returnCode,
          errorMessage: response.errorMessage,
          hash: undefined as undefined | Uint8Array,
          r: null as null | Uint8Array,
          s: null as null | Uint8Array,
          v: null as null | number,
        };
        for (let i = 1; i < chunks.length; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          result = await this.signSendChunk(
            1 + i,
            chunks.length,
            chunks[i],
            INS.SIGN_FELT,
            show ? 1 : 0
          );
          result.hash = undefined;

          if (result.returnCode !== LedgerError.NoErrors) {
            break;
          }
        }
        return result;
      }, processErrorResponse);
    }, processErrorResponse);
  }
}
