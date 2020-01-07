// @flow
import Transport from "@ledgerhq/hw-transport";
import { bip32asBuffer } from "./bip32";
import { MAX_SCRIPT_BLOCK } from "./constants";

export function provideOutputFullChangePath(
  transport: Transport<*>,
  path: string
): Promise<string> {
  let buffer = bip32asBuffer(path);
  return transport.send(0xe0, 0x4a, 0xff, 0x00, buffer);
}

export async function hashOutputFull(
  transport: Transport<*>,
  outputScript: Buffer,
  additionals: Array<string> = []
): Promise<void> {
  let offset = 0;
  let p1 = 0x80;
  const isDecred = additionals.includes("decred");
  ///WARNING: Decred works only with one call (without chunking)
  //TODO: test without this for Decred
  if (isDecred) {
    return transport.send(0xe0, 0x4a, p1, 0x00, outputScript);
  }

  while (offset < outputScript.length) {
    let blockSize =
      offset + MAX_SCRIPT_BLOCK >= outputScript.length
        ? outputScript.length - offset
        : MAX_SCRIPT_BLOCK;
    let p1 = offset + blockSize === outputScript.length ? 0x80 : 0x00;
    let data = outputScript.slice(offset, offset + blockSize);
    await transport.send(0xe0, 0x4a, p1, 0x00, data);
    offset += blockSize;
  }
}
