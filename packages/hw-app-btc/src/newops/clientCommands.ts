import Transport from "@ledgerhq/hw-transport";
import { BufferReader, BufferWriter } from "bitcoinjs-lib/types/bufferutils";
import { sha256 } from "bitcoinjs-lib/types/crypto";
import { createVarint } from "../varint";
import { MerkelizedPsbt } from "./merkelizedPsbt";
import { Merkle } from "./merkle";
import { WalletPolicy } from "./policy";

// export interface YieldHandler {
//   yield(result: Buffer): void;
// }

// export class SignPsbtHandler implements YieldHandler {
//   private psbt: MerkelizedPsbt;
//   private walletPolicy: WalletPolicy;
//   constructor(merkelizedPsbt: MerkelizedPsbt, walletPolicy: WalletPolicy) {
//     this.psbt = merkelizedPsbt;
//     this.walletPolicy = walletPolicy;
//   }

//   yield(clientCommand: Buffer): void {
//     // Insert signature into psbt    
//   }

//   createClientCommandInterpreter(transport: Transport): ClientCommandInterpreter {
//     const result = new ClientCommandInterpreter(transport, this);
//     result.addPreimage(this.walletPolicy.serialize());
//     // Prepare the ClientCommandInterpreter with necessary merkle trees
//     // and preimages.
//     return result;
//   }


// }




enum ClientCommandCode {
    YIELD = 0x10,
    GET_PREIMAGE = 0x40,
    GET_MERKLE_LEAF_PROOF = 0x41,
    GET_MERKLE_LEAF_INDEX = 0x42,
    GET_MORE_ELEMENTS = 0xA0,
}

abstract class ClientCommand {
  abstract code: ClientCommandCode;
  abstract execute(request: Buffer): Buffer;
}


export class YieldCommand extends ClientCommand {
  private results: Buffer[];

  code = ClientCommandCode.YIELD;

  constructor(results: Buffer[]) {
    super();
    this.results = results;
  }

  execute(request: Buffer): Buffer {
    this.results.push(Buffer.from(request.subarray(1)));
    return Buffer.from('');
  };
}


export class GetPreimageCommand extends ClientCommand {
  private known_preimages: Map<string, Buffer>;
  private queue: Buffer[];

  code = ClientCommandCode.GET_PREIMAGE;

  constructor(known_preimages: Map<string, Buffer>, queue: Buffer[]) {
    super();
    this.known_preimages = known_preimages;
    this.queue = queue;
  }

  execute(request: Buffer): Buffer {
    let req = new BufferReader(request.subarray(1));
  
    if (req.readUInt8() != 0) {
      throw new Error("Unsupported request, the first byte should be 0");
    }

    // read the hash
    const hash = Buffer.alloc(32);
    for (let i = 0; i < 32; i++) {
      hash[i] = req.readUInt8();
    }
    const req_hash_hex = hash.toString("hex");

    // we expect no more data to read
    if (req.buffer.length != req.offset) {
      throw new Error("Invalid request, unexpected trailing data");
    }

    for (let [known_hash_hex, known_preimage] of this.known_preimages) {
      if (req_hash_hex === known_hash_hex) {
        const preimage_len_varint = createVarint(known_preimage.length);

        // We can send at most 255 - len(preimage_len_out) - 1 bytes in a single message;
        // the rest will be stored in the queue for GET_MORE_ELEMENTS
        const max_payload_size = 255 - preimage_len_varint.length - 1;

        const payload_size = Math.min(max_payload_size, known_preimage.length);

        if (payload_size < known_preimage.length) {
          for (let i = payload_size; i < known_preimage.length; i++) {
            this.queue.push(Buffer.from([known_preimage[i]]))
          }
        }

        return Buffer.concat([
          preimage_len_varint,
          Buffer.from([payload_size]),
          known_preimage.subarray(0, payload_size)
        ]);
      }
    }

    throw Error(`Requested unknown preimage for: ${req_hash_hex}`)
  };
}


export class GetMerkleLeafProofCommand extends ClientCommand {
  private known_trees: Map<string, Merkle>;
  private queue: Buffer[];

  code = ClientCommandCode.GET_MERKLE_LEAF_PROOF;

  constructor(known_trees: Map<string, Merkle>, queue: Buffer[]) {
    super();
    this.known_trees = known_trees;
    this.queue = queue;
  }

  execute(request: Buffer): Buffer {
    const req = request.subarray(1);

    if (req.length != 32 + 4 + 4) {
      throw new Error("Invalid request, unexpected trailing data");
    }

    // read the hash
    const hash = Buffer.alloc(32);
    for (let i = 0; i < 32; i++) {
      hash[i] = req.readUInt8(i);
    }
    const hash_hex = hash.toString("hex");

    const tree_size = req.readUInt32BE(32)
    const leaf_index = req.readUInt32BE(32 + 4)

    const mt = this.known_trees.get(hash_hex);
    if (!mt) {
      throw Error(`Requested unknown preimage for: ${hash_hex}`);
    }

    if (leaf_index >= tree_size || mt.size() != tree_size) {
      throw Error("Invalid index or tree size.");
    }

    if (this.queue.length != 0) {
      throw Error("This command should not execute when the queue is not empty.")
    }

    const proof = mt.getProof(leaf_index);

    const n_response_elements = Math.min(Math.floor((255 - 32 - 1 - 1) / 32), proof.length)
    const n_leftover_elements = proof.length - n_response_elements;

    // Add to the queue any proof elements that do not fit the response
    this.queue.push(...proof.slice(-n_leftover_elements));

    return Buffer.concat([
      mt.getLeafHash(leaf_index),
      Buffer.from([proof.length]),
      Buffer.from([n_response_elements]),
      ...proof.slice(0, n_response_elements)
    ]);
  };
}

export class GetMerkleLeafIndexCommand extends ClientCommand {
  private known_trees: Map<string, Merkle>;

  code = ClientCommandCode.GET_MERKLE_LEAF_INDEX;

  constructor(known_trees: Map<string, Merkle>) {
    super();
    this.known_trees = known_trees;
  }

  execute(request: Buffer): Buffer {
    const req = request.subarray(1);

    if (req.length != 32 + 32) {
      throw new Error("Invalid request, unexpected trailing data");
    }

    // read the root hash
    const root_hash = Buffer.alloc(32);
    for (let i = 0; i < 32; i++) {
      root_hash[i] = req.readUInt8(i);
    }
    const root_hash_hex = root_hash.toString("hex");

    // read the leaf hash
    const leef_hash = Buffer.alloc(32);
    for (let i = 0; i < 32; i++) {
      leef_hash[i] = req.readUInt8(32 + i);
    }
    const leef_hash_hex = leef_hash.toString("hex");

    const mt = this.known_trees.get(root_hash_hex);
    if (!mt) {
      throw Error(`Requested unknown preimage for: ${root_hash_hex}`);
    }

    let leaf_index = 0;
    let found = 0;
    for (let i = 0; i < mt.size(); i++) {
      if (mt.getLeafHash(i).toString("hex") == leef_hash_hex) {
        found = 1;
        leaf_index = i;
        break;
      }
    }
    return Buffer.concat([
      Buffer.from([found]),
      createVarint(leaf_index)
    ]);
  };
}


export class GetMoreElementsCommand extends ClientCommand {
  queue: Buffer[];

  code = ClientCommandCode.GET_MORE_ELEMENTS;

  constructor(queue: Buffer[]) {
    super();
    this.queue = queue;
  }

  execute(request: Buffer): Buffer {
    if (request.length != 1) {
      throw new Error("Invalid request, unexpected trailing data");
    }

    if (this.queue.length === 0) {
      throw new Error("No elements to get");
    }

    // all elements should have the same length
    const element_len = this.queue[0].length;
    if (this.queue.some(el => el.length != element_len)) {
      throw new Error("The queue contains elements with different byte length, which is not expected");
    }

    const max_elements = Math.floor(253 / element_len);
    const n_returned_elements = Math.min(max_elements, this.queue.length);

    const returned_elements = this.queue.splice(0, n_returned_elements);

    return Buffer.concat([
      Buffer.from([n_returned_elements]),
      Buffer.from([element_len]),
      ...returned_elements
    ]);
  };
}

export class ClientCommandInterpreter {
  private roots: Map<string, Merkle> = new Map();
  private preimages: Map<string, Buffer> =  new Map();

  private yielded: Buffer[] = [];

  private queue: Buffer[] = [];

  private commands: Map<ClientCommandCode, ClientCommand> = new Map();

  constructor() {
    const commands = [
      new YieldCommand(this.yielded),
      new GetPreimageCommand(this.preimages, this.queue),
      new GetMerkleLeafIndexCommand(this.roots),
      new GetMerkleLeafProofCommand(this.roots, this.queue),
      new GetMoreElementsCommand(this.queue),
    ];

    for (let cmd of commands) {
      if (this.commands.has(cmd.code)) {
        throw new Error(`Multiple commands with code ${cmd.code}`);
      }
      this.commands[cmd.code] = cmd;
    }
  }

  addKnownPreimage(preimage: Buffer) {
    this.preimages[sha256(preimage).toString('hex')] = preimage;
  }

  addKnownList(list: Buffer[]) {
    // TODO
    throw new Error("Not Implemented");
  }

  addKnownMapping(keys: Buffer[], values: Buffer[]) {
    // TODO
    throw new Error("Not Implemented");
  }

  execute(request: Buffer): Buffer {
    if (request.length == 0) {
      throw new Error("Unexpected empty command")
    }

    const cmdCode = request[0];
    const cmd = this.commands.get(cmdCode); 
    if (!cmd) {
      throw new Error(`Unexpected command code ${cmdCode}`);
    }

    return cmd.execute(request)
  }
}

// export class ClientCommandInterpreter {
//   private roots: Map<string, Merkle> = new Map();
//   private preimages: Map<string, Buffer> =  new Map();
//   private transport: Transport;
//   private yieldHandler: YieldHandler;
//   constructor(transport: Transport, yieldHandler: YieldHandler) {
//     this.transport = transport;
//     this.yieldHandler = yieldHandler;
//   }

//   addPreimage(preimage: Buffer) {
//     this.preimages[sha256(preimage).toString('hex')] = preimage;
//   }

//   async execute(clientCommand: Buffer) {
//     while (true) {
//       const response = this.handleCommand(clientCommand);
//       const nextCommand = await this.send(response);
//       const command = nextCommand[0];
//       if (nextCommand[1] == 0x9000) {
//         return
//       }
//       clientCommand = nextCommand[0];
//     }
//   }

//   handleCommand(clientCommand: Buffer): Buffer {
//     const commandCode = clientCommand.readUInt8(0);
//     const command = clientCommand.slice(1);
//     switch (commandCode) {
//       case 0x10:
//         return this.handleYield(command);
//         break;
//       case 0x40:
//         return this.handleGetPreimage(command);
//         break;
//       case 0x41:
//         return this.handleMerkleLeafProof(command);
//         break;
//       case 0x42:
//         return this.handleMerkleLeafIndex(command);
//         break;
//       case 0xa0:
//         return this.handleMoreElements(command);
//         break;
//     }
//   }

//   private async send(buffer: Buffer): Promise<[Buffer, number]> {
//     const nextCommand = await this.transport.send(0xf8, 0x01, 0, 0, buffer, [0x9000, 0xe000]);
//     const nextCommandStatus = nextCommand.readUInt16LE(nextCommand.length - 2);
//     return [nextCommand.slice(0, -2), nextCommandStatus];
//   }

//   handleYield(buffer: Buffer): Buffer {
//     this.yieldHandler.yield(buffer);
//     return Buffer.of();
//   }

//   handleGetPreimage(buffer: Buffer): Buffer {
    
//   }
// }