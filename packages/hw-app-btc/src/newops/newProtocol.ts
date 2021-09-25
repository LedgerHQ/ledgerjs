import bippath from "bip32-path";
import Transport from "@ledgerhq/hw-transport";
import { pathElementsToBuffer } from "../bip32";
import { Psbt } from "bitcoinjs-lib";
import { PsbtV2 } from "./psbtv2";

export type AddressType = 1 | /*legacy*/ 2 | /*segwit*/ 3; /*nested_segwit*/
const zero = "0000000000000000000000000000000000000000000000000000000000000000";
export class NewProtocol {
  transport: Transport;

  constructor(transport: Transport) {
    this.transport = transport;
  }

  async getPubkey(display: boolean, pathElements: number[]): Promise<string> {
    if (pathElements.length > 6) {
      throw new Error("Path too long. At most 6 levels allowed.");
    }
    const pathBuf = pathElementsToBuffer(pathElements);
    const buffer = Buffer.of(display ? 1 : 0, ...pathBuf);
    const response = await this.send(0x00, buffer);
    return response.toString("ascii");
  }

  async getAddress(
    display: boolean,
    addressType: AddressType,
    pathElements: number[]
  ): Promise<string> {
    if (pathElements.length > 6) {
      throw new Error("Path too long. At most 6 levels allowed.");
    }
    const pathBuf = pathElementsToBuffer(pathElements);
    const buffer = Buffer.of(display ? 1 : 0, addressType, ...pathBuf);
    const response = await this.send(0x01, buffer);

    return response.toString("ascii");
  }

  signPsbt(psbt: PsbtV2, walletId: Buffer, walletHMAC: Buffer = zero) {
    
  }

  async getMasterFingerprint(): Promise<Buffer> {
    return this.send(0x05, Buffer.of());
  }

  private async send(ins: number, buffer: Buffer): Promise<Buffer> {
    const response = await this.transport.send(0xe1, ins, 0, 0, buffer);
    return response.slice(0, -2);
  }
}
