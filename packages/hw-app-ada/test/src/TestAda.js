// @flow
import type Transport from "@ledgerhq/hw-transport";
import Ada from "@ledgerhq/hw-app-ada";

const CLA = 0x80;

const INS_BASE58_ENCODE_TEST = 0x08;
const INS_BLAKE2B_TEST = 0x07;

const MAX_APDU_SIZE = 64;
const OFFSET_CDATA = 5;

export default class TestAda extends Ada {

  constructor(transport: Transport<*>) {
    super(transport);
    this.methods = this.methods.concat([ "testBase58Encode", "testCBORDecode", "testHashTransaction" ]);
    this.transport.decorateAppAPIMethods(this, this.methods, "ADA");
  }
  
  get t() : Transport<*> {
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
  async testBase58Encode(txHex: string): Promise<{ addressLength: number, encodedAddress: string }> {
    const tx = Buffer.from(txHex, "hex");

    const response = await this.transport.send(CLA, INS_BASE58_ENCODE_TEST, 0x00, 0x00, tx);
    const [ addressLength ] = response;
    const encodedAddress = response.slice(1, 1 + addressLength).toString();

    return { addressLength, encodedAddress };
  }

  /**
   * Check transaction hashing on the device. This is for testing purposes only and is not available in production.
   *
   * @param {String} txHex The hexadecimal address for hashing.
   * @returns {Promise<Object>} The response from the device.
   */
  async testHashTransaction(txHex: string) : Promise<{ tx?: string }> {
    const rawTx = Buffer.from(txHex, "hex");
    const chunkSize = MAX_APDU_SIZE - OFFSET_CDATA;
    let response = {};

    for (let i = 0; i < rawTx.length; i += chunkSize) {
      const chunk = rawTx.slice(i, i + chunkSize);
      const p1 = i == 0 ? 0x01 : 0x02;
      const p2 = rawTx.length < chunkSize ? 0x01 : 0x02;

      const data = Buffer.concat([
        Buffer.from([CLA, INS_BLAKE2B_TEST, p1, p2]),
        Buffer.from([i == 0 ? rawTx.length : rawTx.length - i]),
        chunk,
      ]);

      const res = await this.transport.exchange(data);

      if (res.length > 4) {
        const tx = res.slice(1, res.length - 2).toString('hex');
        response = { tx };
      }
    }

    return response;
  }
}
