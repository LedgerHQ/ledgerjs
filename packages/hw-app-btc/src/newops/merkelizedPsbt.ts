import { hashLeaf, Merkle } from "./merkle";
import { MerkleMap } from "./merkleMap";
import { PsbtV2 } from "./psbtv2";

export class MerkelizedPsbt extends PsbtV2 {   
  public globalMerkleMap: MerkleMap;
  public inputMerkleMaps: MerkleMap[] = [];
  public outputMerkleMaps: MerkleMap[] = [];
  public inputMapCommitments: Buffer[];
  public outputMapCommitments: Buffer[];
  constructor(psbt: PsbtV2) {
    super();
    psbt.copy(this);
    this.globalMerkleMap = MerkelizedPsbt.createMerkleMap(this.globalMap);

    for (let i = 0; i < this.getGlobalInputCount(); i++) {
      this.inputMerkleMaps.push(MerkelizedPsbt.createMerkleMap(this.inputMaps[i]));
    }
    this.inputMapCommitments = [ ...this.inputMerkleMaps.values() ].map(v => v.commitment());

    for (let i = 0; i < this.getGlobalOutputCount(); i++) {
      this.outputMerkleMaps.push(MerkelizedPsbt.createMerkleMap(this.outputMaps[i]));
    }
    this.outputMapCommitments = [ ...this.outputMerkleMaps.values() ].map(v => v.commitment());
  }
  // These public functions are for MerkelizedPsbt.
  getGlobalSize(): number {
    return this.globalMap.size;
  }
  getGlobalKeysValuesRoot(): Buffer {
    return this.globalMerkleMap.commitment();
  }

  private static createMerkleMap(map: Map<string, Buffer>): MerkleMap {
    const sortedKeysStrings = [...map.keys()].sort();
    const values = sortedKeysStrings.map(k => map.get(k)!);
    const sortedKeys = sortedKeysStrings.map(k => Buffer.from(k, 'hex'));

    const merkleMap = new MerkleMap(sortedKeys, values);
    return merkleMap;
  }
}