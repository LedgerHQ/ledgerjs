import { BufferWriter } from "bitcoinjs-lib/types/bufferutils";
import { Merkle } from "./merkle";

export class MerkleMap {
  keys: Merkle;
  values: Merkle;
  /**
   * @param keys Sorted list of keys
   * @param values values, in corresponding order as the keys, and of equal length
   */
  constructor(keys: Buffer[], values: Buffer[]) {    
    this.keys = new Merkle(keys);
    this.values = new Merkle(values);    
  }

  commitment(): Buffer {
    const buf = new BufferWriter(Buffer.alloc(65));
    buf.writeVarInt(this.keys.size());
    buf.writeSlice(this.keys.getRoot());
    buf.writeSlice(this.values.getRoot());
    return buf.buffer;
  }
}

