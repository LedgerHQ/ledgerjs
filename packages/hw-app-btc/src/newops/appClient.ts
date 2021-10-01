import bippath from "bip32-path";
import Transport from "@ledgerhq/hw-transport";
import { pathElementsToBuffer } from "../bip32";
import { Psbt } from "bitcoinjs-lib";
import { PsbtV2 } from "./psbtv2";
import { MerkelizedPsbt } from "./merkelizedPsbt";
import { ClientCommandInterpreter } from "./clientCommands";
import { WalletPolicy } from "./policy";
import { createVarint } from "../varint";

export type AddressType = 1/*legacy*/ |  2/*segwit*/ | 3/*nested_segwit*/; 

const zero = Buffer.alloc(32, 0);

const CLA_BTC = 0xE1;

const CLA_FRAMEWORK = 0xF0;

enum BitcoinIns {
  GET_PUBKEY = 0x00,
  // GET_ADDRESS = 0x01,
  REGISTER_WALLET = 0x02,
  GET_WALLET_ADDRESS = 0x03,
  SIGN_PSBT = 0x04,
  GET_MASTER_FINGERPRINT = 0x05,
}

enum FrameworkIns {
  CONTINUE_INTERRUPTED = 0x01,
}


export class AppClient {
  transport: Transport;

  constructor(transport: Transport) {
    this.transport = transport;
  }

  private async makeRequest(ins: BitcoinIns, data: Buffer, cci?: ClientCommandInterpreter): Promise<Buffer> {
    let response: Buffer = await this.transport.send(CLA_BTC, ins, 0, 0, data, [0x9000, 0xE000])
    while (response.readUInt16BE(response.length - 2) === 0xE000) {
      if (!cci) {
        throw new Error("Unexpected SW_INTERRUPTED_EXECUTION");
      }

      const hwRequest = response.slice(0, -2);
      const commandResponse = cci.execute(hwRequest);

      response = await this.transport.send(CLA_FRAMEWORK, FrameworkIns.CONTINUE_INTERRUPTED, 0, 0, commandResponse, [0x9000, 0xE000]);
    }
    return response;
  }

  async getPubkey(display: boolean, pathElements: number[]): Promise<string> {
    if (pathElements.length > 6) {
      throw new Error("Path too long. At most 6 levels allowed.");
    }
    const response = await this.makeRequest(BitcoinIns.GET_PUBKEY, Buffer.concat([
      Buffer.of(display ? 1 : 0),
      pathElementsToBuffer(pathElements),
    ]));
    return response.toString("ascii");
  }

  // async getAddress(
  //   display: boolean,
  //   addressType: AddressType,
  //   pathElements: number[]
  // ): Promise<string> {
  //   if (pathElements.length > 6) {
  //     throw new Error("Path too long. At most 6 levels allowed.");
  //   }
  //   const pathBuf = pathElementsToBuffer(pathElements);
  //   const buffer = Buffer.of(display ? 1 : 0, addressType, ...pathBuf);
  //   const response = await this.send(0x01, buffer);

  //   return response.toString("ascii");
  // }

  async signPsbt(psbt: PsbtV2, walletPolicy: WalletPolicy, walletHMAC: Buffer = zero): Promise<Map<number, Buffer>> {
    const merkelizedPsbt = new MerkelizedPsbt(psbt);

    const clientCommandInterpreter = new ClientCommandInterpreter();

    // TODO: prepare ClientCommandInterpreter

    this.makeRequest(BitcoinIns.SIGN_PSBT, Buffer.concat([
      merkelizedPsbt.getGlobalKeysValuesRoot(),
      createVarint(merkelizedPsbt.getGlobalInputCount()),
      merkelizedPsbt.getInputMapsRoot(),
      createVarint(merkelizedPsbt.getGlobalOutputCount()),
      merkelizedPsbt.getOutputMapsRoot(),    
      walletPolicy.getWalletId(),
      walletHMAC,
    ]), clientCommandInterpreter);

    const yielded = clientCommandInterpreter.getYielded();

    const ret: Map<number, Buffer> = new Map();
    for (let inputAndSig of yielded) {
      ret[inputAndSig[0]] = inputAndSig.slice(1);
    }
    return ret;
  }

  async getMasterFingerprint(): Promise<Buffer> {
    return this.makeRequest(BitcoinIns.GET_MASTER_FINGERPRINT, Buffer.of());
  }
}

