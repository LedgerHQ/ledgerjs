import { crypto } from "bitcoinjs-lib";
import { BufferWriter } from "../buffertools";
import {
  OP_DUP,
  OP_HASH160,
  HASH_SIZE,
  OP_EQUALVERIFY,
  OP_CHECKSIG,
  OP_EQUAL,
} from "../constants";
import { hashPublicKey } from "../hashPublicKey";
import { TransactionOutput } from "../types";
import { DefaultDescriptorTemplate } from "./policy";
import { PsbtV2 } from "./psbtv2";
import { pointAddScalar } from "tiny-secp256k1";

type DescriptorTemplate = string;
export type SpendingCondition = { scriptPubKey: Buffer; redeemScript?: Buffer };
export interface AccountType {

  /**
   * Generates a scriptPubKey (output script) from a list of public keys. If
   * a redeemScript is needed it will be set on the returned SpendingCondition
   * too.
   *
   * If accountType is p2tr, the public key must be a 32 byte x-only taproot
   * pubkey, otherwise it's expected to be a 33 byte ecdsa compressed pubkey.
   */
  spendingCondition(pubkeys: Buffer[]): SpendingCondition;

  setInput(
    i: number,
    inputTx: Buffer | undefined,
    spentOutput: TransactionOutput,
    pubkeys: Buffer[],
    pathElems: number[][]
  ): void;

  setOwnOutput(i: number, cond: SpendingCondition, pubkeys: Buffer[], changePaths: number[][]): void;

  getDescriptorTemplate(): DefaultDescriptorTemplate;
}

interface BaseAccount extends AccountType { }

abstract class BaseAccount implements AccountType {
  constructor(protected psbt: PsbtV2, protected masterFp: Buffer) { }
}

abstract class SingleKeyAccount extends BaseAccount {
  /**
   * Generates a single signature scriptPubKey (output script) from a public key.
   * This is done differently depending on account type.
   *
   * It's expected to be a 33 byte ecdsa compressed pubkey.
   * 
   * If wrapped segwit, the returned SpendingCondition have its redeem script set
   * accordingly.
   */
  spendingCondition(
    pubkeys: Buffer[]
  ): SpendingCondition {
    if (pubkeys.length != 1) {
      throw new Error("Expected single key, got " + pubkeys.length);
    }
    return this.singleKeyCondition(pubkeys[0]);
  }
  abstract singleKeyCondition(pubkey: Buffer): SpendingCondition;

  setInput(
    i: number,
    inputTx: Buffer | undefined,
    spentOutput: TransactionOutput,
    pubkeys: Buffer[],
    pathElems: number[][]
  ) {
    if (pubkeys.length != 1) {
      throw new Error("Expected single key, got " + pubkeys.length);
    }
    if (pathElems.length != 1) {
      throw new Error("Expected single path, got " + pathElems.length);
    }
    this.setSingleKeyInput(i, inputTx, spentOutput, pubkeys[0], pathElems[0])
  }
  abstract setSingleKeyInput(i: number, inputTx: Buffer | undefined, spentOutput: TransactionOutput, pubkey: Buffer, path: number[]);
  
  setOwnOutput(i: number, cond: SpendingCondition, pubkeys: Buffer[], changePaths: number[][]) {
    if (pubkeys.length != 1) {
      throw new Error("Expected single key, got " + pubkeys.length);
    }
    if (changePaths.length != 1) {
      throw new Error("Expected single path, got " + changePaths.length);
    }
    this.setSingleKeyOutput(i, cond, pubkeys[0], changePaths[0])
  }
  abstract setSingleKeyOutput(i: number, cond: SpendingCondition, pubkey: Buffer, path: number[])
}

export class p2pkh extends SingleKeyAccount {
  singleKeyCondition(pubkey: Buffer): SpendingCondition {
    const buf = new BufferWriter();
    const pubkeyHash = hashPublicKey(pubkey);
    buf.writeSlice(Buffer.of(OP_DUP, OP_HASH160, HASH_SIZE));
    buf.writeSlice(pubkeyHash);
    buf.writeSlice(Buffer.of(OP_EQUALVERIFY, OP_CHECKSIG));
    return { scriptPubKey: buf.buffer() };
  }

  setSingleKeyInput(
    i: number,
    inputTx: Buffer | undefined,
    spentOutput: TransactionOutput,
    pubkey: Buffer,
    path: number[]
  ) {
    if (!inputTx) {
      throw new Error("Full input base transaction required");
    }
    this.psbt.setInputNonWitnessUtxo(i, inputTx);
    this.psbt.setInputBip32Derivation(i, pubkey, this.masterFp, path);
  }

  setSingleKeyOutput(i: number, cond: SpendingCondition, pubkey: Buffer, path: number[]) {
    this.psbt.setOutputBip32Derivation(i, pubkey, this.masterFp, path);
  }

  getDescriptorTemplate(): DefaultDescriptorTemplate {
    return "pkh(@0)";
  }
}

export class p2tr extends SingleKeyAccount {
  singleKeyCondition(pubkey: Buffer): SpendingCondition {
    const xonlyPubkey = pubkey.slice(1); // x-only pubkey
    const buf = new BufferWriter();
    const outputKey = this.getTaprootOutputKey(xonlyPubkey);
    buf.writeSlice(Buffer.of(0x51, 32)); // push1, pubkeylen
    buf.writeSlice(outputKey);
    return { scriptPubKey: buf.buffer() };
  }

  setSingleKeyInput(
    i: number,
    _inputTx: Buffer | undefined,
    spentOutput: TransactionOutput,
    pubkey: Buffer,
    path: number[]
  ) {
    const xonly = pubkey.slice(1);
    this.psbt.setInputTapBip32Derivation(i, xonly, [], this.masterFp, path);
    this.psbt.setInputWitnessUtxo(i, spentOutput.amount, spentOutput.script);
  }

  setSingleKeyOutput(i: number, cond: SpendingCondition, pubkey: Buffer, path: number[]) {
    this.psbt.setOutputTapBip32Derivation(i, pubkey, [], this.masterFp, path);
  }

  getDescriptorTemplate(): DefaultDescriptorTemplate {
    return "tr(@0)";
  }

  /*
  The following two functions are copied from wallet-btc and adapted.
  They should be moved to a library to avoid code reuse.
  */
  private hashTapTweak(x: Buffer): Buffer {
    // hash_tag(x) = SHA256(SHA256(tag) || SHA256(tag) || x), see BIP340
    // See https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki#specification
    const h = crypto.sha256(Buffer.from("TapTweak", "utf-8"));
    return crypto.sha256(Buffer.concat([h, h, x]));
  }

  /**
   * Calculates a taproot output key from an internal key. This output key will be
   * used as witness program in a taproot output. The internal key is tweaked
   * according to recommendation in BIP341:
   * https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki#cite_ref-22-0
   *
   * @param internalPubkey A 32 byte x-only taproot internal key
   * @returns The output key
   */
  private getTaprootOutputKey(internalPubkey: Buffer): Buffer {
    if (internalPubkey.length != 32) {
      throw new Error("Expected 32 byte pubkey. Got " + internalPubkey.length);
    }
    // A BIP32 derived key can be converted to a schnorr pubkey by dropping
    // the first byte, which represent the oddness/evenness. In schnorr all
    // pubkeys are even.
    // https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki#public-key-conversion
    const evenEcdsaPubkey = Buffer.concat([Buffer.of(0x02), internalPubkey]);
    const tweak = this.hashTapTweak(internalPubkey);

    // Q = P + int(hash_TapTweak(bytes(P)))G
    const outputEcdsaKey = Buffer.from(pointAddScalar(evenEcdsaPubkey, tweak));
    // Convert to schnorr.
    const outputSchnorrKey = outputEcdsaKey.slice(1);
    // Create address
    return outputSchnorrKey;
  }

}

export class p2wpkhWrapped extends SingleKeyAccount {
  singleKeyCondition(pubkey: Buffer): SpendingCondition {
    const buf = new BufferWriter();
    const redeemScript = this.createRedeemScript(pubkey);
    const scriptHash = hashPublicKey(redeemScript);
    buf.writeSlice(Buffer.of(OP_HASH160, HASH_SIZE));
    buf.writeSlice(scriptHash);
    buf.writeUInt8(OP_EQUAL);
    return { scriptPubKey: buf.buffer(), redeemScript: redeemScript};
  }

  setSingleKeyInput(
    i: number,
    inputTx: Buffer | undefined,
    spentOutput: TransactionOutput,
    pubkey: Buffer,
    path: number[]
  ) {
    if (!inputTx) {
      throw new Error("Full input base transaction required");
    }
    this.psbt.setInputNonWitnessUtxo(i, inputTx);
    this.psbt.setInputBip32Derivation(i, pubkey, this.masterFp, path);
    // if (!redeemScript) {
    //   throw new Error("Missing redeemScript for p2wpkhWrapped input");
    // }
    const expectedRedeemScript = this.createRedeemScript(pubkey);
    // if (redeemScript != expectedRedeemScript.toString("hex")) {
    //   throw new Error("Unexpected redeemScript");
    // }
    this.psbt.setInputRedeemScript(i, expectedRedeemScript);
    this.psbt.setInputWitnessUtxo(i, spentOutput.amount, spentOutput.script);
  }

  setSingleKeyOutput(i: number, cond: SpendingCondition, pubkey: Buffer, path: number[]) {
    this.psbt.setOutputRedeemScript(i, cond.redeemScript!);
    this.psbt.setOutputBip32Derivation(i, pubkey, this.masterFp, path);
  }

  getDescriptorTemplate(): DefaultDescriptorTemplate {
    return "sh(wpkh(@0))";
  }

  private createRedeemScript(pubkey: Buffer): Buffer {
    const pubkeyHash = hashPublicKey(pubkey);
    return Buffer.concat([Buffer.from("0014", "hex"), pubkeyHash]);
  }  
}

export class p2wpkh extends SingleKeyAccount {
  singleKeyCondition(pubkey: Buffer): SpendingCondition {
    const buf = new BufferWriter();
    const pubkeyHash = hashPublicKey(pubkey)
    buf.writeSlice(Buffer.of(0, HASH_SIZE));
    buf.writeSlice(pubkeyHash);
    return { scriptPubKey: buf.buffer() };
  }

  setSingleKeyInput(
    i: number,
    inputTx: Buffer | undefined,
    spentOutput: TransactionOutput,
    pubkey: Buffer,
    path: number[]
  ) {
    if (!inputTx) {
      throw new Error("Full input base transaction required");
    }
    this.psbt.setInputNonWitnessUtxo(i, inputTx);
    this.psbt.setInputBip32Derivation(i, pubkey, this.masterFp, path);
    this.psbt.setInputWitnessUtxo(i, spentOutput.amount, spentOutput.script);
  }

  setSingleKeyOutput(i: number, cond: SpendingCondition, pubkey: Buffer, path: number[]) {
    this.psbt.setOutputBip32Derivation(i, pubkey, this.masterFp, path);
  }

  getDescriptorTemplate(): DefaultDescriptorTemplate {
    return "wpkh(@0)";
  }
}
