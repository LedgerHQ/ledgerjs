import bippath from "bip32-path";
import Transport from "@ledgerhq/hw-transport";
import { pathElementsToBuffer } from "../bip32";
import { Psbt } from "bitcoinjs-lib";
import { PsbtV2 } from "./psbtv2";
import { MerkelizedPsbt } from "./merkelizedPsbt";
import { BufferWriter } from "bitcoinjs-lib/types/bufferutils";
import { ClientCommandInterpreter, SignPsbtClientCommandInterpreter, SignPsbtYieldHandler } from "./clientCommands";
import { WalletPolicy } from "./policy";

export type AddressType = 1/*legacy*/ |  2/*segwit*/ | 3/*nested_segwit*/; 
const zero = Buffer.alloc(32, 0);
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

  async signPsbt(psbt: PsbtV2, walletPolicy: WalletPolicy, walletHMAC: Buffer = zero) {
    const merkelizedPsbt = new MerkelizedPsbt(psbt);
    const buf = new BufferWriter(Buffer.alloc(6*32+3));
    buf.writeSlice(merkelizedPsbt.getGlobalKeysValuesRoot());
    buf.writeVarInt(merkelizedPsbt.getGlobalInputCount());
    buf.writeSlice(merkelizedPsbt.getInputMapsRoot());
    buf.writeVarInt(merkelizedPsbt.getGlobalOutputCount());
    buf.writeSlice(merkelizedPsbt.getOutputMapsRoot());    
    buf.writeSlice(walletPolicy.getWalletId());
    buf.writeSlice(walletHMAC);
    const clientCommand = await this.send(0x04, buf.buffer, [0xe000]);
    const interpreter = new ClientCommandInterpreter(this.transport, new SignPsbtYieldHandler(merkelizedPsbt, walletPolicy));
    const result = await interpreter.execute(clientCommand);
  }

  async getMasterFingerprint(): Promise<Buffer> {
    return this.send(0x05, Buffer.of());    
  }

  private async send(ins: number, buffer: Buffer, expecteStatuses: number[] = [0x9000]): Promise<Buffer> {
    const response = await this.transport.send(0xe1, ins, 0, 0, buffer, expecteStatuses);
    return response.slice(0, -2);

  }
}

