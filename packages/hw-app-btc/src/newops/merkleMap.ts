import { BufferWriter } from "bitcoinjs-lib/types/bufferutils";
import { createVarint } from "../varint";
import { Merkle } from "./merkle";

export class MerkleMap {
  keys: Merkle;
  values: Merkle;
  /**
   * @param keys Sorted list of keys
   * @param values values, in corresponding order as the keys, and of equal length
   */
  constructor(keys: Buffer[], values: Buffer[]) {    
    if (keys.length != values.length) {
      throw new Error("keys and values should have the same length")
    }

    // TODO: might want to check that keys are sorted and with no repeats

    this.keys = new Merkle(keys);
    this.values = new Merkle(values);    
  }

  commitment(): Buffer {
    // returns a buffer between 65 and 73 (included) bytes long
    return Buffer.concat([
      createVarint(this.keys.size()),
      this.keys.getRoot(),
      this.values.getRoot()
    ]);
  }
}

