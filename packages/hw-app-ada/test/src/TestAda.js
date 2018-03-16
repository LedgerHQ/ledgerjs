// @flow
import type Transport from "@ledgerhq/hw-transport";
import Ada from "@ledgerhq/hw-app-ada";

const CLA = 0x80;
const INS_BASE58_ENCODE_TEST = 0x08;
const OFFSET_CDATA = 8;

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
}
