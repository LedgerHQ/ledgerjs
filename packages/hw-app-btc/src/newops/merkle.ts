import { crypto } from "bitcoinjs-lib";

export class Merkle {
  private leaves: Buffer[];
  private rootNode: Node;    
  private leafNodes: Node[];
  private h: (buf: Buffer) => Buffer;
  constructor(leaves: Buffer[], hasher: (buf: Buffer) => Buffer = crypto.sha256) {
    this.leaves = leaves;
    this.h = hasher;
    const nodes = this.calculateRoot(leaves);
    this.rootNode = nodes.root;
    this.leafNodes = nodes.leaves;
  }
  getRoot(): Buffer {
    return this.rootNode.hash;
  }
  size(): number {
    return this.leaves.length;
  }
  getLeaves(): Buffer[] {
    return this.leaves;
  }
  getLeafHash(index: number): Buffer {
    return this.leafNodes[index].hash;
  }
  getProof(index: number): Buffer[] {
    if (index >= this.leaves.length) throw Error("Index out of bounds");
    return proveNode(this.leafNodes[index]);
  }

  calculateRoot(leaves: Buffer[]): {root: Node, leaves: Node[]} {
    const n = leaves.length;
    if (n == 0) {    
      return {root: new Node(undefined, undefined, Buffer.alloc(32, 0)), leaves: []};
    }
    if (n == 1) {
      const newNode = new Node(undefined, undefined, leaves[0])
      return {root: newNode, leaves: [newNode]};
    }
    const leftCount = highestPowerOf2LessThan(n)
    const leftBranch = this.calculateRoot(leaves.slice(0, leftCount));
    const rightBranch = this.calculateRoot(leaves.slice(leftCount));
    const leftChild = leftBranch.root;
    const rightChild = rightBranch.root;
    const hash = this.hashNode(leftChild.hash, rightChild.hash);
    const node = new Node(leftChild, rightChild, hash);
    leftChild.parent = node;
    rightChild.parent = node;
    return {root: node, leaves: leftBranch.leaves.concat(rightBranch.leaves)};
  }
  
  hashNode(left: Buffer, right: Buffer): Buffer {
    return this.h(Buffer.concat([Buffer.of(1), left, right]));
  }
}

export function hashLeaf(buf: Buffer, hashFunction: (buf: Buffer) => Buffer = crypto.sha256): Buffer {
  return hashConcat(Buffer.of(0), buf, hashFunction);
}

function hashConcat(bufA: Buffer, bufB: Buffer, hashFunction: (buf: Buffer) => Buffer): Buffer {
  return hashFunction(Buffer.concat([bufA, bufB]));
}

class Node {
  leftChild?: Node;
  rightChild?: Node;
  parent?: Node;
  hash: Buffer;
  constructor(left: Node | undefined, right: Node | undefined, hash: Buffer) {
    this.leftChild = left;
    this.rightChild = right;
    this.hash = hash;
  }
  isLeaf(): boolean {
    return this.leftChild == undefined;
  }  
}

function proveNode(node: Node): Buffer[] {
  if (!node.parent) {
    return [];
  }
  if (node.parent.leftChild == node) {
    return [node.parent.rightChild!.hash, ...proveNode(node.parent)];
  } else {
    return [node.parent.leftChild!.hash, ...proveNode(node.parent)];
  }
}

function highestPowerOf2LessThan(n: number) {
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