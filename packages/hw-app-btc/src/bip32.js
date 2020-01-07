// @flow

import bippath from "bip32-path";

export function bip32asBuffer(path: string): Buffer {
  const paths = !path ? [] : bippath.fromString(path).toPathArray();
  let buffer = Buffer.alloc(1 + paths.length * 4);
  buffer[0] = paths.length;
  paths.forEach((element, index) => {
    buffer.writeUInt32BE(element, 1 + 4 * index);
  });
  return buffer;
}
