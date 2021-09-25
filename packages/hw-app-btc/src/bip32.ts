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
  const pathElements = !path ? [] : bippath.fromString(path).toPathArray();
  return pathElementsToBuffer(pathElements);
}

export function pubkeyFromXpub(xpub: string): Buffer {
  const xpubBuf = bs58check.decode(xpub);
  return xpubBuf.slice(xpubBuf.length-33)
}
