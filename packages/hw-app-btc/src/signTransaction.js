// @flow
import type Transport from "@ledgerhq/hw-transport";
import bippath from "bip32-path";

export function signTransaction(
  transport: Transport<*>,
  path: string,
  lockTime: number,
  sigHashType: number,
  expiryHeight?: Buffer,
  additionals: Array<string> = []
): Promise<Buffer> {
  const isDecred = additionals.includes("decred");
  const paths = bippath.fromString(path).toPathArray();
  let offset = 0;
  const pathsBuffer = Buffer.alloc(paths.length * 4);
  paths.forEach(element => {
    pathsBuffer.writeUInt32BE(element, offset);
    offset += 4;
  });
  const lockTimeBuffer = Buffer.alloc(4);
  lockTimeBuffer.writeUInt32BE(lockTime, 0);
  let buffer = isDecred
    ? Buffer.concat([
        Buffer.from([paths.length]),
        pathsBuffer,
        lockTimeBuffer,
        expiryHeight || Buffer.from([0x00, 0x00, 0x00, 0x00]),
        Buffer.from([sigHashType])
      ])
    : Buffer.concat([
        Buffer.from([paths.length]),
        pathsBuffer,
        Buffer.from([0x00]),
        lockTimeBuffer,
        Buffer.from([sigHashType])
      ]);
  if (expiryHeight && !isDecred) {
    buffer = Buffer.concat([buffer, expiryHeight]);
  }
  return transport.send(0xe0, 0x48, 0x00, 0x00, buffer).then(result => {
    if (result.length > 0) {
      result[0] = 0x30;
      return result.slice(0, result.length - 2);
    }
    return result;
  });
}
