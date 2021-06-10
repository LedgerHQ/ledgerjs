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
import { EthAppPleaseEnableContractData } from "@ledgerhq/errors";
import type Transport from "@ledgerhq/hw-transport";
import { BigNumber } from "bignumber.js";
import { ethers } from "ethers";
import { byContractAddress } from "./erc20";
import { getInfosForContractMethod } from "./contracts";

export type StarkQuantizationType =
  | "eth"
  | "erc20"
  | "erc721"
  | "erc20mintable"
  | "erc721mintable";
const starkQuantizationTypeMap = {
  eth: 1,
  erc20: 2,
  erc721: 3,
  erc20mintable: 4,
  erc721mintable: 5,
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
    return new EthAppPleaseEnableContractData(
      "Please enable Contract data on the Ethereum app Settings"
    );
  }

  return e;
};
/**
 * Ethereum API
 *
 * @example
 * import Eth from "@ledgerhq/hw-app-eth";
 * const eth = new Eth(transport)
 */

export default class Eth {
  transport: Transport;

  constructor(transport: Transport, scrambleKey = "w0w") {
    this.transport = transport;
    transport.decorateAppAPIMethods(
      this,
      [
        "getAddress",
        "provideERC20TokenInformation",
        "signTransaction",
        "signPersonalMessage",
        "getAppConfiguration",
        "signEIP712HashedMessage",
        "starkGetPublicKey",
        "starkSignOrder",
        "starkSignOrder_v2",
        "starkSignTransfer",
        "starkSignTransfer_v2",
        "starkProvideQuantum",
        "starkProvideQuantum_v2",
        "starkUnsafeSign",
        "eth2GetPublicKey",
        "eth2SetWithdrawalIndex",
        "setExternalPlugin",
      ],
      scrambleKey
    );
  }

  /**
   * get Ethereum address for a given BIP 32 path.
   * @param path a path in BIP 32 format
   * @option boolDisplay optionally enable or not the display
   * @option boolChaincode optionally enable or not the chaincode request
   * @return an object with a publicKey, address and (optionally) chainCode
   * @example
   * eth.getAddress("44'/60'/0'/0/0").then(o => o.address)
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
            "0x" +
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
   * This commands provides a trusted description of an ERC 20 token
   * to associate a contract address with a ticker and number of decimals.
   *
   * It shall be run immediately before performing a transaction involving a contract
   * calling this contract address to display the proper token information to the user if necessary.
   *
   * @param {*} info: a blob from "erc20.js" utilities that contains all token information.
   *
   * @example
   * import { byContractAddress } from "@ledgerhq/hw-app-eth/erc20"
   * const zrxInfo = byContractAddress("0xe41d2489571d322189246dafa5ebde1f4699f498")
   * if (zrxInfo) await appEth.provideERC20TokenInformation(zrxInfo)
   * const signed = await appEth.signTransaction(path, rawTxHex)
   */
  provideERC20TokenInformation({ data }: { data: Buffer }): Promise<boolean> {
    return provideERC20TokenInformation(this.transport, data);
  }

  /**
   * You can sign a transaction and retrieve v, r, s given the raw transaction and the BIP 32 path of the account to sign
   * @example
   eth.signTransaction("44'/60'/0'/0/0", "e8018504e3b292008252089428ee52a8f3d6e5d15f8b131996950d7f296c7952872bd72a2487400080").then(result => ...)
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
      const erc20Info = byContractAddress(address);
      if (erc20Info) {
        log(
          "ethereum",
          "loading erc20token info for " +
            erc20Info.contractAddress +
            " (" +
            erc20Info.ticker +
            ")"
        );
        await provideERC20TokenInformation(this.transport, erc20Info.data);
      }
    };

    if (decodedTx.data.length >= 10) {
      const selector = decodedTx.data.substring(0, 10);
      const infos = getInfosForContractMethod(decodedTx.to, selector);

      if (infos) {
        const { plugin, payload, signature, erc20OfInterest, abi } = infos;

        if (plugin) {
          log("ethereum", "loading plugin for " + selector);
          await setExternalPlugin(this.transport, payload, signature);
        }

        if (erc20OfInterest && erc20OfInterest.length && abi) {
          const contract = new ethers.utils.Interface(abi);
          const args = contract.parseTransaction(decodedTx).args;

          for (path of erc20OfInterest) {
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
        log("ethereum", "no infos for selector " + selector);
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
    erc20ProvisioningNecessary: number;
    starkEnabled: number;
    starkv2Supported: number;
    version: string;
  }> {
    return this.transport.send(0xe0, 0x06, 0x00, 0x00).then((response) => {
      return {
        arbitraryDataEnabled: response[0] & 0x01,
        erc20ProvisioningNecessary: response[0] & 0x02,
        starkEnabled: response[0] & 0x04,
        starkv2Supported: response[0] & 0x08,
        version: "" + response[1] + "." + response[2] + "." + response[3],
      };
    });
  }

  /**
  * You can sign a message according to eth_sign RPC call and retrieve v, r, s given the message and the BIP 32 path of the account to sign.
  * @example
  eth.signPersonalMessage("44'/60'/0'/0/0", Buffer.from("test").toString("hex")).then(result => {
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
  eth.signEIP712HashedMessage("44'/60'/0'/0/0", Buffer.from("0101010101010101010101010101010101010101010101010101010101010101").toString("hex"), Buffer.from("0202020202020202020202020202020202020202020202020202020202020202").toString("hex")).then(result => {
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
   * get Stark public key for a given BIP 32 path.
   * @param path a path in BIP 32 format
   * @option boolDisplay optionally enable or not the display
   * @return the Stark public key
   */
  starkGetPublicKey(path: string, boolDisplay?: boolean): Promise<Buffer> {
    const paths = splitPath(path);
    const buffer = Buffer.alloc(1 + paths.length * 4);
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    return this.transport
      .send(0xf0, 0x02, boolDisplay ? 0x01 : 0x00, 0x00, buffer)
      .then((response) => {
        return response.slice(0, response.length - 2);
      });
  }

  /**
   * sign a Stark order
   * @param path a path in BIP 32 format
   * @option sourceTokenAddress contract address of the source token (not present for ETH)
   * @param sourceQuantization quantization used for the source token
   * @option destinationTokenAddress contract address of the destination token (not present for ETH)
   * @param destinationQuantization quantization used for the destination token
   * @param sourceVault ID of the source vault
   * @param destinationVault ID of the destination vault
   * @param amountSell amount to sell
   * @param amountBuy amount to buy
   * @param nonce transaction nonce
   * @param timestamp transaction validity timestamp
   * @return the signature
   */
  starkSignOrder(
    path: string,
    sourceTokenAddress: string | undefined,
    sourceQuantization: BigNumber,
    destinationTokenAddress: string | undefined,
    destinationQuantization: BigNumber,
    sourceVault: number,
    destinationVault: number,
    amountSell: BigNumber,
    amountBuy: BigNumber,
    nonce: number,
    timestamp: number
  ): Promise<Buffer | { r: string; s: string }> {
    const sourceTokenAddressHex = maybeHexBuffer(sourceTokenAddress);
    const destinationTokenAddressHex = maybeHexBuffer(destinationTokenAddress);
    const paths = splitPath(path);
    const buffer = Buffer.alloc(
      1 + paths.length * 4 + 20 + 32 + 20 + 32 + 4 + 4 + 8 + 8 + 4 + 4,
      0
    );
    let offset = 0;
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    offset = 1 + 4 * paths.length;

    if (sourceTokenAddressHex) {
      sourceTokenAddressHex.copy(buffer, offset);
    }

    offset += 20;
    Buffer.from(sourceQuantization.toString(16).padStart(64, "0"), "hex").copy(
      buffer,
      offset
    );
    offset += 32;

    if (destinationTokenAddressHex) {
      destinationTokenAddressHex.copy(buffer, offset);
    }

    offset += 20;
    Buffer.from(
      destinationQuantization.toString(16).padStart(64, "0"),
      "hex"
    ).copy(buffer, offset);
    offset += 32;
    buffer.writeUInt32BE(sourceVault, offset);
    offset += 4;
    buffer.writeUInt32BE(destinationVault, offset);
    offset += 4;
    Buffer.from(amountSell.toString(16).padStart(16, "0"), "hex").copy(
      buffer,
      offset
    );
    offset += 8;
    Buffer.from(amountBuy.toString(16).padStart(16, "0"), "hex").copy(
      buffer,
      offset
    );
    offset += 8;
    buffer.writeUInt32BE(nonce, offset);
    offset += 4;
    buffer.writeUInt32BE(timestamp, offset);
    return this.transport
      .send(0xf0, 0x04, 0x01, 0x00, buffer)
      .then((response) => {
        const r = response.slice(1, 1 + 32).toString("hex");
        const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
        return {
          r,
          s,
        };
      });
  }

  /**
   * sign a Stark order using the Starkex V2 protocol
   * @param path a path in BIP 32 format
   * @option sourceTokenAddress contract address of the source token (not present for ETH)
   * @param sourceQuantizationType quantization type used for the source token
   * @option sourceQuantization quantization used for the source token (not present for erc 721 or mintable erc 721)
   * @option sourceMintableBlobOrTokenId mintable blob (mintable erc 20 / mintable erc 721) or token id (erc 721) associated to the source token
   * @option destinationTokenAddress contract address of the destination token (not present for ETH)
   * @param destinationQuantizationType quantization type used for the destination token
   * @option destinationQuantization quantization used for the destination token (not present for erc 721 or mintable erc 721)
   * @option destinationMintableBlobOrTokenId mintable blob (mintable erc 20 / mintable erc 721) or token id (erc 721) associated to the destination token
   * @param sourceVault ID of the source vault
   * @param destinationVault ID of the destination vault
   * @param amountSell amount to sell
   * @param amountBuy amount to buy
   * @param nonce transaction nonce
   * @param timestamp transaction validity timestamp
   * @return the signature
   */
  starkSignOrder_v2(
    path: string,
    sourceTokenAddress: string | undefined,
    sourceQuantizationType: StarkQuantizationType,
    sourceQuantization: BigNumber | undefined,
    sourceMintableBlobOrTokenId: BigNumber | undefined,
    destinationTokenAddress: string | undefined,
    destinationQuantizationType: StarkQuantizationType,
    destinationQuantization: BigNumber | undefined,
    destinationMintableBlobOrTokenId: BigNumber | undefined,
    sourceVault: number,
    destinationVault: number,
    amountSell: BigNumber,
    amountBuy: BigNumber,
    nonce: number,
    timestamp: number
  ): Promise<Buffer | { r: string; s: string }> {
    const sourceTokenAddressHex = maybeHexBuffer(sourceTokenAddress);
    const destinationTokenAddressHex = maybeHexBuffer(destinationTokenAddress);

    if (!(sourceQuantizationType in starkQuantizationTypeMap)) {
      throw new Error(
        "eth.starkSignOrderv2 invalid source quantization type=" +
          sourceQuantizationType
      );
    }

    if (!(destinationQuantizationType in starkQuantizationTypeMap)) {
      throw new Error(
        "eth.starkSignOrderv2 invalid destination quantization type=" +
          destinationQuantizationType
      );
    }

    const paths = splitPath(path);
    const buffer = Buffer.alloc(
      1 +
        paths.length * 4 +
        1 +
        20 +
        32 +
        32 +
        1 +
        20 +
        32 +
        32 +
        4 +
        4 +
        8 +
        8 +
        4 +
        4,
      0
    );
    let offset = 0;
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    offset = 1 + 4 * paths.length;
    buffer[offset] = starkQuantizationTypeMap[sourceQuantizationType];
    offset++;

    if (sourceTokenAddressHex) {
      sourceTokenAddressHex.copy(buffer, offset);
    }

    offset += 20;

    if (sourceQuantization) {
      Buffer.from(
        sourceQuantization.toString(16).padStart(64, "0"),
        "hex"
      ).copy(buffer, offset);
    }

    offset += 32;

    if (sourceMintableBlobOrTokenId) {
      Buffer.from(
        sourceMintableBlobOrTokenId.toString(16).padStart(64, "0"),
        "hex"
      ).copy(buffer, offset);
    }

    offset += 32;
    buffer[offset] = starkQuantizationTypeMap[destinationQuantizationType];
    offset++;

    if (destinationTokenAddressHex) {
      destinationTokenAddressHex.copy(buffer, offset);
    }

    offset += 20;

    if (destinationQuantization) {
      Buffer.from(
        destinationQuantization.toString(16).padStart(64, "0"),
        "hex"
      ).copy(buffer, offset);
    }

    offset += 32;

    if (destinationMintableBlobOrTokenId) {
      Buffer.from(
        destinationMintableBlobOrTokenId.toString(16).padStart(64, "0"),
        "hex"
      ).copy(buffer, offset);
    }

    offset += 32;
    buffer.writeUInt32BE(sourceVault, offset);
    offset += 4;
    buffer.writeUInt32BE(destinationVault, offset);
    offset += 4;
    Buffer.from(amountSell.toString(16).padStart(16, "0"), "hex").copy(
      buffer,
      offset
    );
    offset += 8;
    Buffer.from(amountBuy.toString(16).padStart(16, "0"), "hex").copy(
      buffer,
      offset
    );
    offset += 8;
    buffer.writeUInt32BE(nonce, offset);
    offset += 4;
    buffer.writeUInt32BE(timestamp, offset);
    return this.transport
      .send(0xf0, 0x04, 0x03, 0x00, buffer)
      .then((response) => {
        const r = response.slice(1, 1 + 32).toString("hex");
        const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
        return {
          r,
          s,
        };
      });
  }

  /**
   * sign a Stark transfer
   * @param path a path in BIP 32 format
   * @option transferTokenAddress contract address of the token to be transferred (not present for ETH)
   * @param transferQuantization quantization used for the token to be transferred
   * @param targetPublicKey target Stark public key
   * @param sourceVault ID of the source vault
   * @param destinationVault ID of the destination vault
   * @param amountTransfer amount to transfer
   * @param nonce transaction nonce
   * @param timestamp transaction validity timestamp
   * @return the signature
   */
  starkSignTransfer(
    path: string,
    transferTokenAddress: string | undefined,
    transferQuantization: BigNumber,
    targetPublicKey: string,
    sourceVault: number,
    destinationVault: number,
    amountTransfer: BigNumber,
    nonce: number,
    timestamp: number
  ): Promise<Buffer | { r: string; s: string }> {
    const transferTokenAddressHex = maybeHexBuffer(transferTokenAddress);
    const targetPublicKeyHex = hexBuffer(targetPublicKey);
    const paths = splitPath(path);
    const buffer = Buffer.alloc(
      1 + paths.length * 4 + 20 + 32 + 32 + 4 + 4 + 8 + 4 + 4,
      0
    );
    let offset = 0;
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    offset = 1 + 4 * paths.length;

    if (transferTokenAddressHex) {
      transferTokenAddressHex.copy(buffer, offset);
    }

    offset += 20;
    Buffer.from(
      transferQuantization.toString(16).padStart(64, "0"),
      "hex"
    ).copy(buffer, offset);
    offset += 32;
    targetPublicKeyHex.copy(buffer, offset);
    offset += 32;
    buffer.writeUInt32BE(sourceVault, offset);
    offset += 4;
    buffer.writeUInt32BE(destinationVault, offset);
    offset += 4;
    Buffer.from(amountTransfer.toString(16).padStart(16, "0"), "hex").copy(
      buffer,
      offset
    );
    offset += 8;
    buffer.writeUInt32BE(nonce, offset);
    offset += 4;
    buffer.writeUInt32BE(timestamp, offset);
    return this.transport
      .send(0xf0, 0x04, 0x02, 0x00, buffer)
      .then((response) => {
        const r = response.slice(1, 1 + 32).toString("hex");
        const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
        return {
          r,
          s,
        };
      });
  }

  /**
   * sign a Stark transfer or conditional transfer using the Starkex V2 protocol
   * @param path a path in BIP 32 format
   * @option transferTokenAddress contract address of the token to be transferred (not present for ETH)
   * @param transferQuantizationType quantization type used for the token to be transferred
   * @option transferQuantization quantization used for the token to be transferred (not present for erc 721 or mintable erc 721)
   * @option transferMintableBlobOrTokenId mintable blob (mintable erc 20 / mintable erc 721) or token id (erc 721) associated to the token to be transferred
   * @param targetPublicKey target Stark public key
   * @param sourceVault ID of the source vault
   * @param destinationVault ID of the destination vault
   * @param amountTransfer amount to transfer
   * @param nonce transaction nonce
   * @param timestamp transaction validity timestamp
   * @option conditionalTransferAddress onchain address of the condition for a conditional transfer
   * @option conditionalTransferFact fact associated to the condition for a conditional transfer
   * @return the signature
   */
  starkSignTransfer_v2(
    path: string,
    transferTokenAddress: string | undefined,
    transferQuantizationType: StarkQuantizationType,
    transferQuantization: BigNumber | undefined,
    transferMintableBlobOrTokenId: BigNumber | undefined,
    targetPublicKey: string,
    sourceVault: number,
    destinationVault: number,
    amountTransfer: BigNumber,
    nonce: number,
    timestamp: number,
    conditionalTransferAddress?: string,
    conditionalTransferFact?: BigNumber
  ): Promise<Buffer | { r: string; s: string }> {
    const transferTokenAddressHex = maybeHexBuffer(transferTokenAddress);
    const targetPublicKeyHex = hexBuffer(targetPublicKey);
    const conditionalTransferAddressHex = maybeHexBuffer(
      conditionalTransferAddress
    );

    if (!(transferQuantizationType in starkQuantizationTypeMap)) {
      throw new Error(
        "eth.starkSignTransferv2 invalid quantization type=" +
          transferQuantizationType
      );
    }

    const paths = splitPath(path);
    const buffer = Buffer.alloc(
      1 +
        paths.length * 4 +
        1 +
        20 +
        32 +
        32 +
        32 +
        4 +
        4 +
        8 +
        4 +
        4 +
        (conditionalTransferAddressHex ? 32 + 20 : 0),
      0
    );
    let offset = 0;
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    offset = 1 + 4 * paths.length;
    buffer[offset] = starkQuantizationTypeMap[transferQuantizationType];
    offset++;

    if (transferTokenAddressHex) {
      transferTokenAddressHex.copy(buffer, offset);
    }

    offset += 20;

    if (transferQuantization) {
      Buffer.from(
        transferQuantization.toString(16).padStart(64, "0"),
        "hex"
      ).copy(buffer, offset);
    }

    offset += 32;

    if (transferMintableBlobOrTokenId) {
      Buffer.from(
        transferMintableBlobOrTokenId.toString(16).padStart(64, "0"),
        "hex"
      ).copy(buffer, offset);
    }

    offset += 32;
    targetPublicKeyHex.copy(buffer, offset);
    offset += 32;
    buffer.writeUInt32BE(sourceVault, offset);
    offset += 4;
    buffer.writeUInt32BE(destinationVault, offset);
    offset += 4;
    Buffer.from(amountTransfer.toString(16).padStart(16, "0"), "hex").copy(
      buffer,
      offset
    );
    offset += 8;
    buffer.writeUInt32BE(nonce, offset);
    offset += 4;
    buffer.writeUInt32BE(timestamp, offset);

    if (conditionalTransferAddressHex && conditionalTransferFact) {
      offset += 4;
      Buffer.from(
        conditionalTransferFact.toString(16).padStart(64, "0"),
        "hex"
      ).copy(buffer, offset);
      offset += 32;
      conditionalTransferAddressHex.copy(buffer, offset);
    }

    return this.transport
      .send(
        0xf0,
        0x04,
        conditionalTransferAddressHex ? 0x05 : 0x04,
        0x00,
        buffer
      )
      .then((response) => {
        const r = response.slice(1, 1 + 32).toString("hex");
        const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
        return {
          r,
          s,
        };
      });
  }

  /**
   * provide quantization information before singing a deposit or withdrawal Stark powered contract call
   *
   * It shall be run following a provideERC20TokenInformation call for the given contract
   *
   * @param operationContract contract address of the token to be transferred (not present for ETH)
   * @param operationQuantization quantization used for the token to be transferred
   */
  starkProvideQuantum(
    operationContract: string | undefined,
    operationQuantization: BigNumber
  ): Promise<boolean> {
    const operationContractHex = maybeHexBuffer(operationContract);
    const buffer = Buffer.alloc(20 + 32, 0);

    if (operationContractHex) {
      operationContractHex.copy(buffer, 0);
    }

    Buffer.from(
      operationQuantization.toString(16).padStart(64, "0"),
      "hex"
    ).copy(buffer, 20);
    return this.transport.send(0xf0, 0x08, 0x00, 0x00, buffer).then(
      () => true,
      (e) => {
        if (e && e.statusCode === 0x6d00) {
          // this case happen for ETH application versions not supporting Stark extensions
          return false;
        }

        throw e;
      }
    );
  }

  /**
   * provide quantization information before singing a deposit or withdrawal Stark powered contract call using the Starkex V2 protocol
   *
   * It shall be run following a provideERC20TokenInformation call for the given contract
   *
   * @param operationContract contract address of the token to be transferred (not present for ETH)
   * @param operationQuantizationType quantization type of the token to be transferred
   * @option operationQuantization quantization used for the token to be transferred (not present for erc 721 or mintable erc 721)
   * @option operationMintableBlobOrTokenId mintable blob (mintable erc 20 / mintable erc 721) or token id (erc 721) of the token to be transferred
   */
  starkProvideQuantum_v2(
    operationContract: string | undefined,
    operationQuantizationType: StarkQuantizationType,
    operationQuantization?: BigNumber,
    operationMintableBlobOrTokenId?: BigNumber
  ): Promise<boolean> {
    const operationContractHex = maybeHexBuffer(operationContract);

    if (!(operationQuantizationType in starkQuantizationTypeMap)) {
      throw new Error(
        "eth.starkProvideQuantumV2 invalid quantization type=" +
          operationQuantizationType
      );
    }

    const buffer = Buffer.alloc(20 + 32 + 32, 0);
    let offset = 0;

    if (operationContractHex) {
      operationContractHex.copy(buffer, offset);
    }

    offset += 20;

    if (operationQuantization) {
      Buffer.from(
        operationQuantization.toString(16).padStart(64, "0"),
        "hex"
      ).copy(buffer, offset);
    }

    offset += 32;

    if (operationMintableBlobOrTokenId) {
      Buffer.from(
        operationMintableBlobOrTokenId.toString(16).padStart(64, "0"),
        "hex"
      ).copy(buffer, offset);
    }

    return this.transport
      .send(
        0xf0,
        0x08,
        starkQuantizationTypeMap[operationQuantizationType],
        0x00,
        buffer
      )
      .then(
        () => true,
        (e) => {
          if (e && e.statusCode === 0x6d00) {
            // this case happen for ETH application versions not supporting Stark extensions
            return false;
          }

          throw e;
        }
      );
  }

  /**
   * sign the given hash over the Stark curve
   * It is intended for speed of execution in case an unknown Stark model is pushed and should be avoided as much as possible.
   * @param path a path in BIP 32 format
   * @param hash hexadecimal hash to sign
   * @return the signature
   */
  starkUnsafeSign(
    path: string,
    hash: string
  ): Promise<Buffer | { r: string; s: string }> {
    const hashHex = hexBuffer(hash);
    const paths = splitPath(path);
    const buffer = Buffer.alloc(1 + paths.length * 4 + 32);
    let offset = 0;
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    offset = 1 + 4 * paths.length;
    hashHex.copy(buffer, offset);
    return this.transport
      .send(0xf0, 0x0a, 0x00, 0x00, buffer)
      .then((response) => {
        const r = response.slice(1, 1 + 32).toString("hex");
        const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
        return {
          r,
          s,
        };
      });
  }

  /**
   * get an Ethereum 2 BLS-12 381 public key for a given BIP 32 path.
   * @param path a path in BIP 32 format
   * @option boolDisplay optionally enable or not the display
   * @return an object with a publicKey
   * @example
   * eth.eth2GetPublicKey("12381/3600/0/0").then(o => o.publicKey)
   */
  eth2GetPublicKey(
    path: string,
    boolDisplay?: boolean
  ): Promise<{
    publicKey: string;
  }> {
    const paths = splitPath(path);
    const buffer = Buffer.alloc(1 + paths.length * 4);
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    return this.transport
      .send(0xe0, 0x0e, boolDisplay ? 0x01 : 0x00, 0x00, buffer)
      .then((response) => {
        return {
          publicKey: response.slice(0, -2).toString("hex"),
        };
      });
  }

  /**
   * Set the index of a Withdrawal key used as withdrawal credentials in an ETH 2 deposit contract call signature
   *
   * It shall be run before the ETH 2 deposit transaction is signed. If not called, the index is set to 0
   *
   * @param withdrawalIndex index path in the EIP 2334 path m/12381/3600/withdrawalIndex/0
   * @return True if the method was executed successfully
   */
  eth2SetWithdrawalIndex(withdrawalIndex: number): Promise<boolean> {
    const buffer = Buffer.alloc(4, 0);
    buffer.writeUInt32BE(withdrawalIndex, 0);
    return this.transport.send(0xe0, 0x10, 0x00, 0x00, buffer).then(
      () => true,
      (e) => {
        if (e && e.statusCode === 0x6d00) {
          // this case happen for ETH application versions not supporting ETH 2
          return false;
        }

        throw e;
      }
    );
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

function provideERC20TokenInformation(
  transport: Transport,
  data: Buffer
): Promise<boolean> {
  return transport.send(0xe0, 0x0a, 0x00, 0x00, data).then(
    () => true,
    (e) => {
      if (e && e.statusCode === 0x6d00) {
        // this case happen for older version of ETH app, since older app version had the ERC20 data hardcoded, it's fine to assume it worked.
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
