import bippath from "bip32-path";
import { bip32 } from "bitcoinjs-lib";
import bs58check from "bs58check";

export function pathElementsToBuffer(paths) {
  const buffer = Buffer.alloc(1 + paths.length * 4);
  buffer[0] = paths.length;
  paths.forEach((element, index) => {
    buffer.writeUInt32BE(element, 1 + 4 * index);
  });
  return buffer;
}

export function bip32asBuffer(path: string): Buffer {
  const pathElements = !path ? [] : pathStringToArray(path);
  return pathElementsToBuffer(pathElements);
}

/*
bippath.fromPathArray([0x8000002c, 1, 1, 0]).toString() // m/44'/1/1/0

bippath.fromString("m/44'/0'/0'").toString(false, true) // m/44h/0h/0h

bippath.fromString("m/44h/0h/0'").toString(true) // 44'/0'/0'

bippath.fromString("m/44'/0'/0'").toPathArray() // [ 0x8000002c, 0x80000000, 0x80000000 ]
 */
export function pathArrayToString(pathElements: number[]): string {
  // Limitation: bippath can't handle and empty path. It shouldn't affect us
  // right now, but might in the future.
  // TODO: Fix support for empty path.
  return bippath.fromPathArray(pathElements).toString();
}

export function pathStringToArray(path: string): number[] {
  return bippath.fromString(path).toPathArray();
}

export function pubkeyFromXpub(xpub: string): Buffer {
  const xpubBuf = bs58check.decode(xpub);
  return xpubBuf.slice(xpubBuf.length-33)
}

export function getXpubComponents(xpub: string): {chaincode: Buffer, pubkey: Buffer} {
  const xpubBuf = bs58check.decode(xpub);
  return {chaincode: xpubBuf.slice(13, 13+32), pubkey: xpubBuf.slice(xpubBuf.length-33)}
}