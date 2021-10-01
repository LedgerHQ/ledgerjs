import { pathArrayToString } from "../bip32";
import { BufferWriter } from "../buffertools";
import { crypto } from "bitcoinjs-lib";
import { Merkle } from "./merkle";
import { createVarint } from "../varint";

export type DefaultDescriptorTemplate = "pkh(@0)" | "sh(wpkh(@0))" | "wpkh(@0)" | "tr(@0)";

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
    return crypto.sha256(this.serialize());
  }

  serialize(): Buffer {
    const keyBuffers = this.keys.map(k => {
      return Buffer.from(k, 'ascii');
    });
    const m = new Merkle(keyBuffers);

    const buf = new BufferWriter();
    buf.writeUInt8(0);
    buf.writeVarSlice(Buffer.from(this.descriptorTemplate, 'ascii'));
    buf.writeSlice(m.getRoot());
    return buf.buffer();
  }
}

export function createKey(masterFingerprint: Buffer, path: number[], xpub: string) {  
  const accountPath = pathArrayToString(path);
  return `[${masterFingerprint.toString('hex')}/${accountPath}]${xpub}/**`;
}