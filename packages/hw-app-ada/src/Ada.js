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

import utils, { Precondition, Assert } from "./utils";

const CLA = 0xd7;

const INS = {
  GET_VERSION: 0x00,

  GET_EXT_PUBLIC_KEY: 0x10,
  DERIVE_ADDRESS: 0x11,

  ATTEST_UTXO: 0x20,
  SIGN_TX: 0x21,

  RUN_TESTS: 0xf0
};

type BIP32Path = Array<number>;

type InputTypeUTxO = {|
  txDataHex: string,
  outputIndex: number,
  path: BIP32Path
|};

type OutputTypeAddress = {|
  amountStr: string,
  address58: string
|};

type OutputTypeChange = {|
  amountStr: string,
  path: BIP32Path
|};

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
      "signTransaction",
      "deriveAddress"
    ];
    this.transport.decorateAppAPIMethods(this, this.methods, scrambleKey);
  }

  /**
   * Returns an object containing the app version.
   *
   * @returns {Promise<{major:number, minor:number, patch:number}>} Result object containing the application version number.
   *
   * @example
   * const { major, minor, patch, flags } = await ada.getVersion();
   * console.log(`App version ${major}.${minor}.${patch}`);
   *
   */
  async getVersion(): Promise<{
    major: string,
    minor: string,
    patch: string
  }> {
    const _send = (p1, p2, data) =>
      this.transport
        .send(CLA, INS.GET_VERSION, p1, p2, data)
        .then(utils.stripRetcodeFromResponse);

    const P1_UNUSED = 0x00;
    const P2_UNUSED = 0x00;
    const response = await _send(P1_UNUSED, P2_UNUSED, utils.hex_to_buf(""));
    Assert.assert(response.length == 4);
    const [major, minor, patch, flags_value] = response;

    const FLAG_IS_DEBUG = 1;
    //const FLAG_IS_HEADLESS = 2;

    const flags = {
      isDebug: (flags_value & FLAG_IS_DEBUG) == FLAG_IS_DEBUG
    };
    return { major, minor, patch, flags };
  }

  /**
   * Runs unit tests on the device (DEVEL app build only)
   *
   * @returns {Promise<void>}
   */
  async runTests(): Promise<void> {
    await this.transport.send(CLA, INS.RUN_TESTS, 0x00, 0x00);
  }

  async _attestUtxo(
    txDataHex: string,
    outputIndex: number
  ): Promise<{
    txHashHex: string,
    outputIndex: number,
    amountStr: string,
    hmacHex: string,
    rawBuffer: Buffer
  }> {
    Precondition.checkIsHexString(txDataHex);
    Precondition.checkIsUint32(outputIndex);

    const _send = (p1, p2, data) =>
      this.transport
        .send(CLA, INS.ATTEST_UTXO, p1, p2, data)
        .then(utils.stripRetcodeFromResponse);

    const P1_INIT = 0x01;
    const P1_CONTINUE = 0x02;

    const P2_UNUSED = 0x00;

    const CHUNK_SIZE = 255;

    {
      // Initial request
      const data = utils.uint32_to_buf(outputIndex);
      const result = await _send(P1_INIT, P2_UNUSED, data);
      Assert.assert(result.length == 0);
    }

    const txData = utils.hex_to_buf(txDataHex);

    let i = 0;
    {
      // middle requests
      while (i + CHUNK_SIZE < txData.length) {
        const chunk = txData.slice(i, i + CHUNK_SIZE);
        const result = await _send(P1_CONTINUE, P2_UNUSED, chunk);
        Assert.assert(result.length == 0);
        i += CHUNK_SIZE;
      }
    }

    // final request
    {
      const chunk = txData.slice(i);
      const result = await _send(P1_CONTINUE, P2_UNUSED, chunk);

      const sum = arr => arr.reduce((x, y) => x + y, 0);

      const sizes = [32, 4, 8, 16];
      Assert.assert(result.length == sum(sizes));

      const [txHash, outputNumber, amount, hmac] = utils.chunkBy(result, sizes);

      return {
        rawBuffer: result,
        txHashHex: utils.buf_to_hex(txHash),
        outputIndex: utils.buf_to_uint32(outputNumber),
        amountStr: utils.buf_to_amount(amount),
        hmacHex: utils.buf_to_hex(hmac)
      };
    }
  }

  /**
   * @param string Raw transaction data (without witnesses) encoded as hex string
   * @param number Output indes
   *
   */
  async attestUtxo(
    txDataHex: string,
    outputIndex: number
  ): Promise<{
    txHashHex: string,
    outputIndex: number,
    amountStr: string,
    hmacHex: string,
    rawBuffer: Buffer
  }> {
    return this._attestUtxo(txDataHex, outputIndex);
  }

  /**
   * @description Get a public key from the specified BIP 32 path.
   *
   * @param {Array<number>} indexes The path indexes. Path must begin with `44'/1815'/n'`, and may be up to 10 indexes long.
   * @return {Promise<{ publicKey:string, chainCode:string }>} The public key with chaincode for the given path.
   *
   * @example
   * const { publicKey, chainCode } = await ada.getExtendedPublicKey([ HARDENED + 44, HARDENED + 1815, HARDENED + 1 ]);
   * console.log(publicKey);
   *
   */
  async getExtendedPublicKey(
    path: BIP32Path
  ): Promise<{ publicKeyHex: string, chainCodeHex: string }> {
    Precondition.checkIsValidPath(path);

    const _send = (p1, p2, data) =>
      this.transport
        .send(CLA, INS.GET_EXT_PUBLIC_KEY, p1, p2, data)
        .then(utils.stripRetcodeFromResponse);

    const P1_UNUSED = 0x00;
    const P2_UNUSED = 0x00;

    const data = utils.path_to_buf(path);

    const response = await _send(P1_UNUSED, P2_UNUSED, data);

    const [publicKey, chainCode, rest] = utils.chunkBy(response, [32, 32]);
    Assert.assert(rest.length == 0);

    return {
      publicKeyHex: publicKey.toString("hex"),
      chainCodeHex: chainCode.toString("hex")
    };
  }

  /**
   * @description Gets an address from the specified BIP 32 path.
   *
   * @param {Array<number>} indexes The path indexes. Path must begin with `44'/1815'/i'/(0 or 1)/j`, and may be up to 10 indexes long.
   * @return {Promise<{ address:string }>} The address for the given path.
   *
   * @throws 5001 - The path provided does not have the first 3 indexes hardened or 4th index is not 0 or 1
   * @throws 5002 - The path provided is less than 5 indexes
   * @throws 5003 - Some of the indexes is not a number
   *
   * @example
   * const { address } = await ada.deriveAddress([ HARDENED + 44, HARDENED + 1815, HARDENED + 1, 0, 5 ]);
   *
   */
  async deriveAddress(path: BIP32Path): Promise<{ address58: string }> {
    Precondition.checkIsValidPath(path);

    const _send = (p1, p2, data) =>
      this.transport
        .send(CLA, INS.DERIVE_ADDRESS, p1, p2, data)
        .then(utils.stripRetcodeFromResponse);

    const P1_RETURN = 0x01;
    const P2_UNUSED = 0x00;
    const data = utils.path_to_buf(path);
    const response = await _send(P1_RETURN, P2_UNUSED, data);

    return {
      address58: utils.base58_encode(response)
    };
  }

  async showAddress(path: BIP32Path): Promise<void> {
    Precondition.checkIsValidPath(path);

    const _send = (p1, p2, data) =>
      this.transport
        .send(CLA, INS.DERIVE_ADDRESS, p1, p2, data)
        .then(utils.stripRetcodeFromResponse);

    const P1_DISPLAY = 0x02;
    const P2_UNUSED = 0x00;
    const data = utils.path_to_buf(path);
    const response = await _send(P1_DISPLAY, P2_UNUSED, data);
    Assert.assert(response.length == 0);
  }

  async signTransaction(
    inputs: Array<InputTypeUTxO>,
    outputs: Array<OutputTypeAddress | OutputTypeChange>
  ) {
    //console.log("sign");

    const P1_STAGE_INIT = 0x01;
    const P1_STAGE_INPUTS = 0x02;
    const P1_STAGE_OUTPUTS = 0x03;
    const P1_STAGE_CONFIRM = 0x04;
    const P1_STAGE_WITNESSES = 0x05;
    const P2_UNUSED = 0x00;
    const SIGN_TX_INPUT_TYPE_ATTESTED_UTXO = 0x01;

    const _send = (p1, p2, data) =>
      this.transport
        .send(CLA, INS.SIGN_TX, p1, p2, data)
        .then(utils.stripRetcodeFromResponse);

    const signTx_init = async (
      numInputs: number,
      numOutputs: number
    ): Promise<void> => {
      const data = Buffer.concat([
        utils.uint32_to_buf(numInputs),
        utils.uint32_to_buf(numOutputs)
      ]);
      const response = await _send(P1_STAGE_INIT, P2_UNUSED, data);
      Assert.assert(response.length == 0);
    };

    const signTx_addInput = async (attestation): Promise<void> => {
      const data = Buffer.concat([
        utils.uint8_to_buf(SIGN_TX_INPUT_TYPE_ATTESTED_UTXO),
        attestation.rawBuffer
      ]);
      const response = await _send(P1_STAGE_INPUTS, P2_UNUSED, data);
      Assert.assert(response.length == 0);
    };

    const signTx_addAddressOutput = async (
      address58: string,
      amountStr: string
    ): Promise<void> => {
      const data = Buffer.concat([
        utils.amount_to_buf(amountStr),
        utils.uint8_to_buf(0x01),
        utils.base58_decode(address58)
      ]);
      const response = await _send(P1_STAGE_OUTPUTS, P2_UNUSED, data);
      Assert.assert(response.length == 0);
    };

    const signTx_addChangeOutput = async (
      path: BIP32Path,
      amountStr: string
    ): Promise<void> => {
      const data = Buffer.concat([
        utils.amount_to_buf(amountStr),
        utils.uint8_to_buf(0x02),
        utils.path_to_buf(path)
      ]);
      const response = await _send(P1_STAGE_OUTPUTS, P2_UNUSED, data);
      Assert.assert(response.length == 0);
    };

    const signTx_awaitConfirm = async (): Promise<{
      txHashHex: string
    }> => {
      const response = await _send(
        P1_STAGE_CONFIRM,
        P2_UNUSED,
        utils.hex_to_buf("")
      );
      return {
        txHashHex: response.toString("hex")
      };
    };

    const signTx_getWitness = async (
      path: BIP32Path
    ): Promise<{
      path: BIP32Path,
      witnessHex: string
    }> => {
      const data = Buffer.concat([utils.path_to_buf(path)]);
      const response = await _send(P1_STAGE_WITNESSES, P2_UNUSED, data);
      return {
        path: path,
        witnessHex: utils.buf_to_hex(response)
      };
    };

    //console.log("attest");
    const attestedInputs = [];
    // attest
    for (const { txDataHex, outputIndex } of inputs) {
      const attestation = await this._attestUtxo(txDataHex, outputIndex);
      attestedInputs.push(attestation);
    }

    // init
    //console.log("init");
    await signTx_init(attestedInputs.length, outputs.length);

    // inputs
    //console.log("inputs");
    for (const attestation of attestedInputs) {
      await signTx_addInput(attestation);
    }

    // outputs
    //console.log("outputs");
    for (const output of outputs) {
      if (output.address58) {
        await signTx_addAddressOutput(output.address58, output.amountStr);
      } else if (output.path) {
        await signTx_addChangeOutput(output.path, output.amountStr);
      } else {
        throw new Error("TODO");
      }
    }

    // confirm
    //console.log("confirm");
    const { txHashHex } = await signTx_awaitConfirm();

    //console.log("witnesses");
    const witnesses = [];
    for (const input of inputs) {
      const witness = await signTx_getWitness(input.path);
      witnesses.push(witness);
    }
    return {
      txHashHex,
      witnesses
    };
  }
}

export {
  utils // reexport
};
