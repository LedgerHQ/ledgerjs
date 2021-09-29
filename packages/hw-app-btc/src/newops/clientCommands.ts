import Transport from "@ledgerhq/hw-transport";
import { sha256 } from "bitcoinjs-lib/types/crypto";
import { MerkelizedPsbt } from "./merkelizedPsbt";
import { Merkle } from "./merkle";
import { WalletPolicy } from "./policy";

export interface YieldHandler {
  yield(result: Buffer): void;
}

export class SignPsbtHandler implements YieldHandler {
  private psbt: MerkelizedPsbt;
  private walletPolicy: WalletPolicy;
  constructor(merkelizedPsbt: MerkelizedPsbt, walletPolicy: WalletPolicy) {
    this.psbt = merkelizedPsbt;
    this.walletPolicy = walletPolicy;
  }

  yield(clientCommand: Buffer): void {
    // Insert signature into psbt    
  }

  createClientCommandInterpreter(transport: Transport): ClientCommandInterpreter {
    const result = new ClientCommandInterpreter(transport, this);
    result.addPreimage(this.walletPolicy.serialize());
    // Prepare the ClientCommandInterpreter with necessary merkle trees
    // and preimages.
    return result;
  }


}

export class ClientCommandInterpreter {
  private roots: Map<string, Merkle> = new Map();
  private premiages: Map<string, Buffer> =  new Map();
  private transport: Transport;
  private yieldHandler: YieldHandler;
  constructor(transport: Transport, yieldHandler: YieldHandler) {
    this.transport = transport;
    this.yieldHandler = yieldHandler;
  }

  addPreimage(preimage: Buffer) {
    this.premiages[sha256(preimage).toString('hex')] = preimage;
  }

  async execute(clientCommand: Buffer) {
    while (true) {
      const response = this.handleCommand(clientCommand);
      const nextCommand = await this.send(response);
      const command = nextCommand[0];
      if (nextCommand[1] == 0x9000) {
        return
      }
      clientCommand = nextCommand[0];
    }
  }

  handleCommand(clientCommand: Buffer): Buffer {
    const commandCode = clientCommand.readUInt8(0);
    const command = clientCommand.slice(1);
    switch (commandCode) {
      case 0x10:
        return this.handleYield(command);
        break;
      case 0x40:
        return this.handleGetPreimage(command);
        break;
      case 0x41:
        return this.handleMerkleLeafProof(command);
        break;
      case 0x42:
        return this.handleMerkleLeafIndex(command);
        break;
      case 0xa0:
        return this.handleMoreElements(command);
        break;
    }
  }

  private async send(buffer: Buffer): Promise<[Buffer, number]> {
    const nextCommand = await this.transport.send(0xf8, 0x01, 0, 0, buffer, [0x9000, 0xe000]);
    const nextCommandStatus = nextCommand.readUInt16LE(nextCommand.length - 2);
    return [nextCommand.slice(0, -2), nextCommandStatus];
  }

  handleYield(buffer: Buffer): Buffer {
    this.yieldHandler.yield(buffer);
    return Buffer.of();
  }

  handleGetPreimage(buffer: Buffer): Buffer {
    
  }
}