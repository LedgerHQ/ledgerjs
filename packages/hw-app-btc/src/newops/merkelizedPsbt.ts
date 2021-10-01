import { Merkle } from "./merkle";
import { MerkleMap } from "./merkleMap";
import { PsbtV2 } from "./psbtv2";

export class MerkelizedPsbt extends PsbtV2 {   
  public globalMerkleMap: MerkleMap;
  public inputMerkleMaps = new Map<number, MerkleMap>();
  public outputMerkleMaps = new Map<number, MerkleMap>();
  public inputMapsCommitment: Merkle;
  public outputMapsCommitment: Merkle;
  constructor(psbt: PsbtV2) {
    super();
    psbt.copy(this);
    this.globalMerkleMap = this.createMerkleMap(this.globalMap);

    for (let i = 0; i < this.getGlobalInputCount(); i++) {
      this.inputMerkleMaps[i] = this.createMerkleMap(this.inputMaps[i]);
    }
    this.inputMapsCommitment = new Merkle([ ...this.inputMerkleMaps.values() ].map(v => v.commitment()));

    for (let i = 0; i < this.getGlobalOutputCount(); i++) {
      this.outputMerkleMaps[i] = this.createMerkleMap(this.outputMaps[i]);
    }
    this.outputMapsCommitment = new Merkle([ ...this.outputMerkleMaps.values() ].map(v => v.commitment()));
  }
  // These public functions are for MerkelizedPsbt.
  getGlobalSize(): number {
    return this.globalMap.size;
  }
  getGlobalKeysValuesRoot(): Buffer {
    return this.globalMerkleMap.commitment();
  }
  getInputsMapRoot(): Buffer {
    return this.inputMapsCommitment.getRoot();
  }
  getOutputsMapRoot(): Buffer {
    return this.outputMapsCommitment.getRoot();
  }

  private createMerkleMap(map: Map<string, Buffer>): MerkleMap {
    const sortedKeysStrings = this.sort([ ...map.keys() ]);
    const values = sortedKeysStrings.map(k => {
      return this.globalMap[k]
    })    
    const sortedKeys = sortedKeysStrings.map(k => Buffer.from(k, 'hex'));
    const merkleMap = new MerkleMap(sortedKeys, values);
    return merkleMap;
  }
  private sortedBuffers(strings: string[]): Buffer[] {
    return this.sort(strings).map(s => {
      return Buffer.from(s, 'hex')
    });
  }
  private sort(strings: string[]): string[] {
    // We don't check for a === b, because no two keys should
    // be equal.
    return strings.sort((a, b) => a > b ? 1 : -1)
  }
  private getInputSize(inputIndex: number): number {
    return this.inputMaps[inputIndex].size;
  }
  private getOutputSize(outputIndex: number): number {
    return this.outputMaps[outputIndex].size;
  }
}