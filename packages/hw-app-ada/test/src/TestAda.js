// @flow
import Int64 from "node-int64";
import type Transport from "@ledgerhq/hw-transport";
import Ada from "../..";

const CLA = 0x80;

const INS_BLAKE2B_TEST = 0x07;
const INS_BASE58_ENCODE_TEST = 0x08;
const INS_CBOR_DECODE_TEST = 0x09;

const P1_FIRST = 0x01;
const P1_NEXT = 0x02;
const P1_LAST = 0x03;

const P2_SINGLE_TX = 0x01;
const P2_MULTI_TX = 0x02;

const MAX_APDU_SIZE = 64;
const OFFSET_CDATA = 5;

export default class TestAda extends Ada {
  constructor(transport: Transport<*>) {
    super(transport);
    this.methods = [
      "testBase58Encode",
      "testCBORDecode",
      "testHashTransaction"
    ];
    this.transport.decorateAppAPIMethods(this, this.methods, "ADA");
  }

  get t(): Transport<*> {
    return this.transport;
  }

  set t(transport: Transport<*>) {
    this.transport = transport;
  }

  /**
   * Check Base58 encoding on the device. This is for testing purposes only and is not available in production.
   *
   * @param {String} txHex The hexadecimal address for encoding.
   * @returns {Promise<Object>} The response from the device.
   */
  async testBase58Encode(
    txHex: string
  ): Promise<{ addressLength: number, encodedAddress: string }> {
    const tx = Buffer.from(txHex, "hex");

    const response = await this.transport.send(
      CLA,
      INS_BASE58_ENCODE_TEST,
      0x00,
      0x00,
      tx
    );
    const [addressLength] = response;
    const encodedAddress = response.slice(1, 1 + addressLength).toString();

    return { addressLength, encodedAddress };
  }

  /**
   * Check CBOR decoding on the device. This is for testing purposes only and is not available in production.
   *
   * @param {String} txHex The hexadecimal address for encoding.
   * @returns {Promise<Object>} The response from the device.
   */
  async testCBORDecode(
    txHex: string
  ): Promise<{
    inputs?: number,
    outputs?: number,
    txs?: Array<{ checksum: string, amount: string }>
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

      const res = await this.transport.send(
        CLA,
        INS_CBOR_DECODE_TEST,
        p1,
        p2,
        chunk
      );

      if (res.length > 4) {
        const [inputs, outputs] = res;
        const txs = [];

        let position = 2;
        while (position < res.length - 2) {
          let checksum = res.readUInt32BE(position);
          let amount = new Int64(
            res.readUInt32LE(position + 9),
            res.readUInt32LE(position + 5)
          ).toOctetString();
          txs.push({ checksum, amount });
          position += 14;
        }

        response = { inputs, outputs, txs };
      }
    }

    return response;
  }

  /**
   * Check transaction hashing on the device. This is for testing purposes only and is not available in production.
   *
   * @param {String} txHex The hexadecimal address for hashing.
   * @returns {Promise<Object>} The response from the device.
   */
  async testHashTransaction(txHex: string): Promise<{ tx?: string }> {
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

      const res = await this.transport.send(
        CLA,
        INS_BLAKE2B_TEST,
        p1,
        p2,
        chunk
      );

      if (res.length > 4) {
        const tx = res.slice(1, res.length - 2).toString("hex");
        response = { tx };
      }
    }

    return response;
  }
}
