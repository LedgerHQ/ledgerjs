import { Merkle } from "./merkle";

export type DefaultDescriptorTemplate = "pkh(@0)" | "sh(pkh(@0))" | "wpkh(@0)" | "tr(@0)";

export class WalletPolicy {
  descriptorTemplate: string;
  keys: string[];
  /**
   * For now, we only support default descriptor templates.
   */
  constructor(descriptorTemplate: DefaultDescriptorTemplate, key: string) {
    this.descriptorTemplate = descriptorTemplate;
    this.keys = [key];
  }

  getWalletId(): Buffer {
    // wallet_id (sha256 of the wallet serialization), 
    const keyBuffers = this.keys.map(k => {
      return Buffer.from(k, 'ascii');
    });
    const m = new Merkle(keyBuffers);

    const buf = new BufferWriter(Buffer.of());
    buf.writeUInt8(0);
    buf.writeVarSlice(Buffer.from(this.descriptorTemplate, 'ascii'));
    buf.writeSlice(m.getRoot());
    return buf.buffer;
  }
}

export function createKey(masterFingerprint: Buffer, path: number[], xpub: string) {
  // Limitation: bippath can't handle and empty path. It shouldn't affect us
  // right now, but might in the future.
  // TODO: Fix support for empty path.
  const accountPath = bippath.fromPathArray(path).toString(true);
  return `[${masterFingerprint.toString('hex')}/${accountPath}]${xpub}/**`;
}