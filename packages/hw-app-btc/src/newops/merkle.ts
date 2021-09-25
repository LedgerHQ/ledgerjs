import { sha256 } from "bitcoinjs-lib/types/crypto";

export class Merkle {
    private leaves: Buffer[];
    constructor(leaves: Buffer[]) {
      this.leaves = leaves;
    }

    getRoot(): Buffer {
      return calculateRoot(this.leaves)
    }
}

function calculateRoot(leaves: Buffer[]): Buffer {
  const n = leaves.length;
  if (n == 0) {
    return Buffer.alloc(32, 0);
  }
  if (n == 1) {
    return hashLeaf(leaves[0]);
  }
  const leftCount = highestMultipleOf2LessThan(n)
  const leftBranch = calculateRoot(leaves.slice(0, leftCount));
  const rightBranch = calculateRoot(leaves.slice(leftCount));
  return hashNode(leftBranch, rightBranch);
}

function highestMultipleOf2LessThan(n: number) {
  if (n < 2) {
    throw Error("Expected n >= 2")
  }
  if (isPowerOf2(n)) {
    return n / 2
  }
  return 1 << Math.floor(Math.log2(n));
}

function isPowerOf2(n: number): boolean {
  return (n & (n - 1)) == 0;
}

function hashNode(left: Buffer, right: Buffer): Buffer {
  return h(Buffer.concat([Buffer.of(1), left, right]));
}
function hashLeaf(buf: Buffer): Buffer {
  return hashConcat(Buffer.of(0), buf);
}

function hashConcat(bufA: Buffer, bufB: Buffer): Buffer {
  return h(Buffer.concat([bufA, bufB]));
}

function h(buf: Buffer): Buffer {
  return sha256(buf)
}