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
// FIXME drop:
import { splitPath, foreach } from "./utils";
import { log } from "@ledgerhq/logs";
import { LatAppPleaseEnableContractData } from "@ledgerhq/errors";
import type Transport from "@ledgerhq/hw-transport";
import { BigNumber } from "bignumber.js";
import { ethers } from "ethers";
import { byContractAddress } from "./prc20";
import { getInfosForContractMethod } from "./contracts";

export type StarkQuantizationType =
  | "lat"
  | "prc20"
  | "prc721"
  | "prc20mintable"
  | "prc721mintable";

const starkQuantizationTypeMap = {
  lat: 1,
  prc20: 2,
  prc721: 3,
  prc20mintable: 4,
  prc721mintable: 5,
};

function hexBuffer(str: string): Buffer {
  return Buffer.from(str.startsWith("0x") ? str.slice(2) : str, "hex");
}

function maybeHexBuffer(
  str: string | null | undefined
): Buffer | null | undefined {
  if (!str) return null;
  return hexBuffer(str);
}

const remapTransactionRelatedErrors = (e) => {
  if (e && e.statusCode === 0x6a80) {
    return new LatAppPleaseEnableContractData(
      "Please enable Contract data on the Lat app Settings"
    );
  }

  return e;
};

/**
 * Lat API
 *
 * @example
 * import Lat from "@ledgerhq/hw-app-lat";
 * const eth = new Lat(transport)
 */
export default class Lat {
  transport: Transport;

  constructor(transport: Transport, scrambleKey = "w0w") {
    this.transport = transport;
    transport.decorateAppAPIMethods(
      this,
      [
        "getAddress",
        "providePRC20TokenInformation",
        "signTransaction",
        "signPersonalMessage",
        "getAppConfiguration",
        "setExternalPlugin",
      ],
      scrambleKey
    );
  }

  /**
   * get Lat address for a given BIP 32 path.
   * @param path a path in BIP 32 format
   * @option boolDisplay optionally enable or not the display
   * @option boolChaincode optionally enable or not the chaincode request
   * @return an object with a publicKey, address and (optionally) chainCode
   * @example
   * eth.getAddress("44'/486'/0'/0/0").then(o => o.address)
   */
  getAddress(
    path: string,
    boolDisplay?: boolean,
    boolChaincode?: boolean
  ): Promise<{
    publicKey: string;
    address: string;
    chainCode?: string;
  }> {
    const paths = splitPath(path);
    const buffer = Buffer.alloc(1 + paths.length * 4);
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    return this.transport
      .send(
        0xe0,
        0x02,
        boolDisplay ? 0x01 : 0x00,
        boolChaincode ? 0x01 : 0x00,
        buffer
      )
      .then((response) => {
        const publicKeyLength = response[0];
        const addressLength = response[1 + publicKeyLength];

        return {
          publicKey: response.slice(1, 1 + publicKeyLength).toString("hex"),
          address:
            response
              .slice(
                1 + publicKeyLength + 1,
                1 + publicKeyLength + 1 + addressLength
              )
              .toString("ascii"),
          chainCode: boolChaincode
            ? response
                .slice(
                  1 + publicKeyLength + 1 + addressLength,
                  1 + publicKeyLength + 1 + addressLength + 32
                )
                .toString("hex")
            : undefined,
        };
      });
  }

  /**
   * This commands provides a trusted description of an PRC 20 token
   * to associate a contract address with a ticker and number of decimals.
   *
   * It shall be run immediately before performing a transaction involving a contract
   * calling this contract address to display the proper token information to the user if necessary.
   *
   * @param {*} info: a blob from "prc20.js" utilities that contains all token information.
   *
   * @example
   * import { byContractAddress } from "@ledgerhq/hw-app-lat/prc20"
   * const zrxInfo = byContractAddress("lax10jc0t4ndqarj4q6ujl3g3ycmufgc77epxg02lt")
   * if (zrxInfo) await appEth.providePRC20TokenInformation(zrxInfo)
   * const signed = await appEth.signTransaction(path, rawTxHex)
   */
  providePRC20TokenInformation({ data }: { data: Buffer }): Promise<boolean> {
    return providePRC20TokenInformation(this.transport, data);
  }

  /**
   * You can sign a transaction and retrieve v, r, s given the raw transaction and the BIP 32 path of the account to sign
   * @example
   eth.signTransaction("44'/486'/0'/0/0", "e8018504e3b292008252089428ee52a8f3d6e5d15f8b131996950d7f296c7952872bd72a2487400080").then(result => ...)
   */
  async signTransaction(
    path: string,
    rawTxHex: string
  ): Promise<{
    s: string;
    v: string;
    r: string;
  }> {
    const paths = splitPath(path);
    let offset = 0;
    const rawTx = Buffer.from(rawTxHex, "hex");
    const toSend: Buffer[] = [];
    let response;
    // Check if the TX is encoded following EIP 155
    let rlpTx = ethers.utils.RLP.decode("0x" + rawTxHex).map((hex) =>
      Buffer.from(hex.slice(2), "hex")
    );

    let rlpOffset = 0;
    let chainIdPrefix = "";

    if (rlpTx.length > 6) {
      const rlpVrs = Buffer.from(
        ethers.utils.RLP.encode(rlpTx.slice(-3)).slice(2),
        "hex"
      );

      rlpOffset = rawTx.length - (rlpVrs.length - 1);

      // First byte > 0xf7 means the length of the list length doesn't fit in a single byte.
      if (rlpVrs[0] > 0xf7) {
        // Increment rlpOffset to account for that extra byte.
        rlpOffset++;

        // Compute size of the list length.
        const sizeOfListLen = rlpVrs[0] - 0xf7;

        // Increase rlpOffset by the size of the list length.
        rlpOffset += sizeOfListLen - 1;
      }

      const chainIdSrc: any = rlpTx[6];
      const chainIdBuf = Buffer.alloc(4);
      chainIdSrc.copy(chainIdBuf, 4 - chainIdSrc.length);
      chainIdPrefix = (chainIdBuf.readUInt32BE(0) * 2 + 35)
        .toString(16)
        .slice(0, -2);

      // Drop the low byte, that comes from the ledger.
      if (chainIdPrefix.length % 2 === 1) {
        chainIdPrefix = "0" + chainIdPrefix;
      }
    }

    while (offset !== rawTx.length) {
      const maxChunkSize = offset === 0 ? 150 - 1 - paths.length * 4 : 150;
      let chunkSize =
        offset + maxChunkSize > rawTx.length
          ? rawTx.length - offset
          : maxChunkSize;

      if (rlpOffset != 0 && offset + chunkSize == rlpOffset) {
        // Make sure that the chunk doesn't end right on the EIP 155 marker if set
        chunkSize--;
      }

      const buffer = Buffer.alloc(
        offset === 0 ? 1 + paths.length * 4 + chunkSize : chunkSize
      );

      if (offset === 0) {
        buffer[0] = paths.length;
        paths.forEach((element, index) => {
          buffer.writeUInt32BE(element, 1 + 4 * index);
        });
        rawTx.copy(buffer, 1 + 4 * paths.length, offset, offset + chunkSize);
      } else {
        rawTx.copy(buffer, 0, offset, offset + chunkSize);
      }

      toSend.push(buffer);
      offset += chunkSize;
    }

    rlpTx = ethers.utils.RLP.decode("0x" + rawTxHex);

    const decodedTx = {
      data: rlpTx[5],
      to: rlpTx[3],
    };
    const provideForContract = async (address) => {
      const prc20Info = byContractAddress(address);
      if (prc20Info) {
        log(
          "Lat",
          "loading prc20token info for " +
            prc20Info.contractAddress +
            " (" +
            prc20Info.ticker +
            ")"
        );
        await providePRC20TokenInformation(this.transport, prc20Info.data);
      }
    };

    if (decodedTx.data.length >= 10) {
      const selector = decodedTx.data.substring(0, 10);
      const infos = getInfosForContractMethod(decodedTx.to, selector);

      if (infos) {
        const { plugin, payload, signature, prc20OfInterest, abi } = infos;

        if (plugin) {
          log("Lat", "loading plugin for " + selector);
          await setExternalPlugin(this.transport, payload, signature);
        }

        if (prc20OfInterest && prc20OfInterest.length && abi) {
          const contract = new ethers.utils.Interface(abi);
          const args = contract.parseTransaction(decodedTx).args;

          for (path of prc20OfInterest) {
            const address = path.split(".").reduce((value, seg) => {
              if (seg === "-1" && Array.isArray(value)) {
                return value[value.length - 1];
              }
              return value[seg];
            }, args);
            await provideForContract(address);
          }
        }
      } else {
        log("Lat", "no infos for selector " + selector);
      }

      await provideForContract(decodedTx.to);
    }

    return foreach(toSend, (data, i) =>
      this.transport
        .send(0xe0, 0x04, i === 0 ? 0x00 : 0x80, 0x00, data)
        .then((apduResponse) => {
          response = apduResponse;
        })
    ).then(
      () => {
        const v = chainIdPrefix + response.slice(0, 1).toString("hex");
        const r = response.slice(1, 1 + 32).toString("hex");
        const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
        return {
          v,
          r,
          s,
        };
      },
      (e) => {
        throw remapTransactionRelatedErrors(e);
      }
    );
  }

  /**
   */
  getAppConfiguration(): Promise<{
    arbitraryDataEnabled: number;
    prc20ProvisioningNecessary: number;
    version: string;
  }> {
    return this.transport.send(0xe0, 0x06, 0x00, 0x00).then((response) => {
      return {
        arbitraryDataEnabled: response[0] & 0x01,
        prc20ProvisioningNecessary: response[0] & 0x02,
        version: "" + response[1] + "." + response[2] + "." + response[3],
      };
    });
  }

  /**
  * You can sign a message according to eth_sign RPC call and retrieve v, r, s given the message and the BIP 32 path of the account to sign.
  * @example
  eth.signPersonalMessage("44'/486'/0'/0/0", Buffer.from("test").toString("hex")).then(result => {
  var v = result['v'] - 27;
  v = v.toString(16);
  if (v.length < 2) {
    v = "0" + v;
  }
  console.log("Signature 0x" + result['r'] + result['s'] + v);
  })
   */
  signPersonalMessage(
    path: string,
    messageHex: string
  ): Promise<{
    v: number;
    s: string;
    r: string;
  }> {
    const paths = splitPath(path);
    let offset = 0;
    const message = Buffer.from(messageHex, "hex");
    const toSend: Buffer[] = [];
    let response;

    while (offset !== message.length) {
      const maxChunkSize = offset === 0 ? 150 - 1 - paths.length * 4 - 4 : 150;
      const chunkSize =
        offset + maxChunkSize > message.length
          ? message.length - offset
          : maxChunkSize;
      const buffer = Buffer.alloc(
        offset === 0 ? 1 + paths.length * 4 + 4 + chunkSize : chunkSize
      );

      if (offset === 0) {
        buffer[0] = paths.length;
        paths.forEach((element, index) => {
          buffer.writeUInt32BE(element, 1 + 4 * index);
        });
        buffer.writeUInt32BE(message.length, 1 + 4 * paths.length);
        message.copy(
          buffer,
          1 + 4 * paths.length + 4,
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
      this.transport
        .send(0xe0, 0x08, i === 0 ? 0x00 : 0x80, 0x00, data)
        .then((apduResponse) => {
          response = apduResponse;
        })
    ).then(() => {
      const v = response[0];
      const r = response.slice(1, 1 + 32).toString("hex");
      const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
      return {
        v,
        r,
        s,
      };
    });
  }

  /**
  * Sign a prepared message following web3.eth.signTypedData specification. The host computes the domain separator and hashStruct(message)
  * @example
  eth.signEIP712HashedMessage("44'/486'/0'/0/0", Buffer.from("0101010101010101010101010101010101010101010101010101010101010101").toString("hex"), Buffer.from("0202020202020202020202020202020202020202020202020202020202020202").toString("hex")).then(result => {
  var v = result['v'] - 27;
  v = v.toString(16);
  if (v.length < 2) {
    v = "0" + v;
  }
  console.log("Signature 0x" + result['r'] + result['s'] + v);
  })
   */
  signEIP712HashedMessage(
    path: string,
    domainSeparatorHex: string,
    hashStructMessageHex: string
  ): Promise<{
    v: number;
    s: string;
    r: string;
  }> {
    const domainSeparator = hexBuffer(domainSeparatorHex);
    const hashStruct = hexBuffer(hashStructMessageHex);
    const paths = splitPath(path);
    const buffer = Buffer.alloc(1 + paths.length * 4 + 32 + 32, 0);
    let offset = 0;
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    offset = 1 + 4 * paths.length;
    domainSeparator.copy(buffer, offset);
    offset += 32;
    hashStruct.copy(buffer, offset);
    return this.transport
      .send(0xe0, 0x0c, 0x00, 0x00, buffer)
      .then((response) => {
        const v = response[0];
        const r = response.slice(1, 1 + 32).toString("hex");
        const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
        return {
          v,
          r,
          s,
        };
      });
  }

  /**
   * Set the name of the plugin that should be used to parse the next transaction
   *
   * @param pluginName string containing the name of the plugin, must have length between 1 and 30 bytes
   * @return True if the method was executed successfully
   */
  setExternalPlugin(
    pluginName: string,
    contractAddress: string,
    selector: string
  ): Promise<boolean> {
    return setExternalPlugin(this.transport, pluginName, selector);
  }
}

// internal helpers

function providePRC20TokenInformation(
  transport: Transport,
  data: Buffer
): Promise<boolean> {
  return transport.send(0xe0, 0x0a, 0x00, 0x00, data).then(
    () => true,
    (e) => {
      if (e && e.statusCode === 0x6d00) {
        // this case happen for older version of ETH app, since older app version had the PRC20 data hardcoded, it's fine to assume it worked.
        // we return a flag to know if the call was effective or not
        return false;
      }
      throw e;
    }
  );
}

function setExternalPlugin(
  transport: Transport,
  payload: string,
  signature: string
): Promise<boolean> {
  const payloadBuffer = Buffer.from(payload, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");
  const buffer = Buffer.concat([payloadBuffer, signatureBuffer]);
  return transport.send(0xe0, 0x12, 0x00, 0x00, buffer).then(
    () => true,
    (e) => {
      if (e && e.statusCode === 0x6a80) {
        // this case happen when the plugin name is too short or too long
        return false;
      } else if (e && e.statusCode === 0x6984) {
        // this case happen when the plugin requested is not installed on the device
        return false;
      } else if (e && e.statusCode === 0x6d00) {
        // this case happen for older version of ETH app
        return false;
      }
      throw e;
    }
  );
}
