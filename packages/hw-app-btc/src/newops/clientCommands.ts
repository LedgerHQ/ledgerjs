import { crypto } from "bitcoinjs-lib";
import { createVarint } from "../varint";
import { hashLeaf, Merkle } from "./merkle";
import { MerkleMap } from "./merkleMap";


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
    let req = request.subarray(1);

    // we expect no more data to read
    if (req.length != 1 + 32) {
      throw new Error("Invalid request, unexpected trailing data");
    }

    if (req[0] != 0) {
      throw new Error("Unsupported request, the first byte should be 0");
    }

    // read the hash
    const hash = Buffer.alloc(32);
    for (let i = 0; i < 32; i++) {
      hash[i] = req[1 + i];
    }
    const req_hash_hex = hash.toString("hex");

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
    if (n_leftover_elements > 0) {
      this.queue.push(...proof.slice(-n_leftover_elements));
    }

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
      this.commands.set(cmd.code, cmd);
    }
  }

  getYielded(): Buffer[] {
    return this.yielded;
  }

  addKnownPreimage(preimage: Buffer) {
    this.preimages.set(crypto.sha256(preimage).toString('hex'), preimage);
  }

  addKnownList(elements: Buffer[]) {
    for (let el of elements) {
      const preimage = Buffer.concat([Buffer.from([0]), el]);
      this.addKnownPreimage(preimage);
    }
    const mt = new Merkle(elements.map(el => hashLeaf(el)));
    this.roots.set(mt.getRoot().toString("hex"), mt);
  }

  addKnownMapping(mm: MerkleMap) {
    this.addKnownList(mm.keys.getLeaves());
    this.addKnownList(mm.values.getLeaves());
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

    return cmd.execute(request); 
  }
}
