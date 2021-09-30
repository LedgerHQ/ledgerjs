import { BigNumber } from 'bignumber.js'
import { script } from 'bitcoinjs-lib';
import { BufferReader, BufferWriter } from 'bitcoinjs-lib/types/bufferutils';

export enum psbtGlobal {
  TX_VERSION = 0x02,
  FALLBACK_LOCKTIME = 0x03,
  INPUT_COUNT = 0x04,
  OUTPUT_COUNT = 0x05,
  TX_MODIFIABLE = 0x06,
  VERSION = 0xfb,
}
export enum psbtIn {
  NON_WITNESS_UTXO = 0x00,
  WITNESS_UTXO = 0x01,
  PARTIAL_SIG = 0x02,
  REDEEM_SCRIPT = 0x04,
  BIP32_DERIVATION = 0x06,
  FINAL_SCRIPTSIG = 0x07,
  FINAL_SCRIPTWITNESS = 0x08,
  PREVIOUS_TXID = 0x0e,
  OUTPUT_INDEX = 0x0f,
  TAP_KEY_SIG = 0x13,
  TAP_BIP32_DERIVATION = 0x16,
}
export enum psbtOut {
  REDEEM_SCRIPT = 0x00,
  BIP_32_DERIVATION = 0x02,
  AMOUNT = 0x03,
  SCRIPT = 0x04,
  TAP_BIP32_DERIVATION = 0x07,
}

export class NoSuchEntry extends Error { }

export class PsbtV2 {
  protected globalMap: Map<string, Buffer> = new Map();
  protected inputMaps: Map<string, Buffer>[] = [];
  protected outputMaps: Map<string, Buffer>[] = [];

  setGlobalTxVersion(version: number) {
    this.setGlobal(psbtGlobal.TX_VERSION, uint32LE(version));
  }
  getGlobalTxVersion(): number {
    return this.getGlobal(psbtGlobal.TX_VERSION).readUInt32LE(0);
  }
  setGlobalFallbackLocktime(locktime: number) {
    this.setGlobal(psbtGlobal.FALLBACK_LOCKTIME, uint32LE(locktime));
  }
  getGlobalFallbackLocktime(): number {
    return this.getGlobal(psbtGlobal.FALLBACK_LOCKTIME).readUInt32LE(0);
  }
  setGlobalInputCount(inputCount: number) {
    this.setGlobal(psbtGlobal.INPUT_COUNT, varint(inputCount));
  }
  getGlobalInputCount(): number {
    return fromVarint(this.getGlobal(psbtGlobal.INPUT_COUNT));
  }
  setGlobalOutputCount(outputCount: number) {
    this.setGlobal(psbtGlobal.OUTPUT_COUNT, varint(outputCount));
  }
  getGlobalOutputCount(): number {
    return fromVarint(this.getGlobal(psbtGlobal.OUTPUT_COUNT));
  }
  setGlobalTxModifiable(byte: Buffer) {
    this.setGlobal(psbtGlobal.TX_MODIFIABLE, byte);
  }
  getGlobalTxModifiable(): Buffer {
    return this.getGlobal(psbtGlobal.TX_MODIFIABLE);
  }
  setGlobalPsbtVersion(psbtVersion: number) {
    this.setGlobal(psbtGlobal.VERSION, uint32LE(psbtVersion));
  }
  getGlobalPsbtVersion(): number {
    return this.getGlobal(psbtGlobal.VERSION).readUInt32LE(0);
  }

  setInputNonWitnessUtxo(inputIndex: number, transaction: Buffer) {
    this.setInput(inputIndex, psbtIn.NON_WITNESS_UTXO, b(), transaction)
  }
  getInputNonWitnessUtxo(inputIndex: number): Buffer {
    return this.getInput(inputIndex, psbtIn.NON_WITNESS_UTXO, b());
  }
  setInputWitnessUtxo(inputIndex: number, amount: Buffer, scriptPubKey: Buffer) {
    const buf = new BufferWriter(Buffer.alloc(8));
    buf.writeSlice(amount);
    buf.writeVarSlice(scriptPubKey);
    this.setInput(inputIndex, psbtIn.WITNESS_UTXO, b(), buf.buffer);
  }
  getInputWitnessUtxo(inputIndex: number): { amount: Buffer, scriptPubKey: Buffer } {
    const buf = new BufferReader(this.getInput(inputIndex, psbtIn.WITNESS_UTXO, b()));
    return { amount: buf.readSlice(8), scriptPubKey: buf.readVarSlice() };
  }
  setInputPartialSig(inputIndex: number, pubkey: Buffer, signature: Buffer) {
    this.setInput(inputIndex, psbtIn.PARTIAL_SIG, pubkey, signature);
  }
  getInputPartialSig(inputIndex: number, pubkey: Buffer): Buffer {
    return this.getInput(inputIndex, psbtIn.PARTIAL_SIG, pubkey);
  }
  setInputRedeemScript(inputIndex: number, redeemScript: Buffer) {
    this.setInput(inputIndex, psbtIn.REDEEM_SCRIPT, b(), redeemScript);
  }
  getInputRedeemScript(inputIndex: number): Buffer {
    return this.getInput(inputIndex, psbtIn.REDEEM_SCRIPT, b());
  }
  setInputBip32Derivation(inputIndex: number, pubkey: Buffer, masterFingerprint: Buffer, path: number[]) {
    this.setInput(inputIndex, psbtIn.BIP32_DERIVATION, pubkey, this.encodeBip32Derivation(masterFingerprint, path))
  }
  getInputBip32Derivation(inputIndex: number, pubkey: Buffer, masterFingerprint: Buffer, path: number[]): { masterFingerprint: Buffer, path: number[] } {
    const buf = this.getInput(inputIndex, psbtIn.BIP32_DERIVATION, pubkey);
    return this.decodeBip32Derivation(buf);
  }
  setInputFinalScriptsig(inputIndex: number, scriptSig: Buffer) {
    this.setInput(inputIndex, psbtIn.FINAL_SCRIPTSIG, b(), scriptSig);
  }
  getInputFinalScriptsig(inputIndex: number): Buffer {
    return this.getInput(inputIndex, psbtIn.FINAL_SCRIPTSIG, b());
  }
  setInputFinalScriptwitness(inputIndex: number, scriptWitness: Buffer) {
    this.setInput(inputIndex, psbtIn.FINAL_SCRIPTWITNESS, b(), scriptWitness);
  }
  getInputFinalScriptwitness(inputIndex: number): Buffer {
    return this.getInput(inputIndex, psbtIn.FINAL_SCRIPTWITNESS, b());
  }
  setInputPreviousTxId(inputIndex: number, txid: Buffer) {
    this.setInput(inputIndex, psbtIn.PREVIOUS_TXID, b(), txid);
  }
  getInputPreviousTxId(inputIndex: number): Buffer {
    return this.getInput(inputIndex, psbtIn.PREVIOUS_TXID, b());
  }
  setInputOutputIndex(inputIndex: number, outputIndex: number) {
    this.setInput(inputIndex, psbtIn.OUTPUT_INDEX, b(), uint32LE(outputIndex));
  }
  getInputOutputIndex(inputIndex: number) {
    this.getInput(inputIndex, psbtIn.OUTPUT_INDEX, b()).readUInt32LE(0);
  }
  setInputTapKeySig(inputIndex: number, sig: Buffer) {
    this.setInput(inputIndex, psbtIn.TAP_KEY_SIG, b(), sig);
  }
  getInputTapKeySig(inputIndex: number): Buffer {
    return this.getInput(inputIndex, psbtIn.TAP_KEY_SIG, b());
  }
  setInputTapBip32Derivation(inputIndex: number, pubkey: Buffer, hashes: Buffer[], masterFingerprint: Buffer, path: number[]) {
    const buf = this.encodeTapBip32Derivation(hashes, masterFingerprint, path);
    this.setInput(inputIndex, psbtIn.TAP_BIP32_DERIVATION, pubkey, buf);
  }
  getInputTapBip32Derivation(inputIndex: number, pubkey: Buffer): { hashes: Buffer[], masterFingerprint: Buffer, path: number[] } {
    const buf = this.getInput(inputIndex, psbtIn.TAP_BIP32_DERIVATION, pubkey);
    return this.decodeTapBip32Derivation(buf);
  }
  getInputKeyDatas(inputIndex: number, keyType: KeyType): Buffer[] {
    return this.getKeyDatas(this.inputMaps[inputIndex], keyType);
  }

  setOutputRedeemScript(outputIndex: number, redeemScript: Buffer) {
    this.setOutput(outputIndex, psbtOut.REDEEM_SCRIPT, b(), redeemScript);
  }
  getOutputRedeemScript(outputIndex: number): Buffer {
    return this.getOutput(outputIndex, psbtOut.REDEEM_SCRIPT, b());
  }
  setOutputBip32Derivation(outputIndex: number, pubkey: Buffer, masterFingerprint: Buffer, path: number[]) {
    this.setOutput(outputIndex, psbtOut.BIP_32_DERIVATION, pubkey, this.encodeBip32Derivation(masterFingerprint, path));
  }
  getOutputBip32Derivation(outputIndex: number, pubkey: Buffer): { masterFingerprint: Buffer, path: number[] } {
    const buf = this.getOutput(outputIndex, psbtOut.BIP_32_DERIVATION, pubkey);
    return this.decodeBip32Derivation(buf);
  }
  setOutputAmount(outputIndex: number, amount: Buffer) {
    this.setOutput(outputIndex, psbtOut.AMOUNT, b(), amount);
  }
  getOutputAmount(outputIndex: number): Buffer {
    return this.getOutput(outputIndex, psbtOut.AMOUNT, b());
  }
  setOutputScript(outputIndex: number, scriptPubKey: Buffer) {
    this.setOutput(outputIndex, psbtOut.SCRIPT, b(), scriptPubKey)
  }
  getOutputScript(outputIndex: number): Buffer {
    return this.getOutput(outputIndex, psbtOut.SCRIPT, b());
  }
  setOutputTapBip32Derivation(outputIndex: number, pubkey: Buffer, hashes: Buffer[], fingerprint: Buffer, path: number[]) {
    const buf = this.encodeTapBip32Derivation(hashes, fingerprint, path);
    this.setOutput(outputIndex, psbtOut.TAP_BIP32_DERIVATION, pubkey, buf);
  }
  getOutputTapBip32Derivation(outputIndex: number, pubkey: Buffer): { hashes: Buffer[], masterFingerprint: Buffer, path: number[] } {
    const buf = this.getOutput(outputIndex, psbtOut.TAP_BIP32_DERIVATION, pubkey);
    return this.decodeTapBip32Derivation(buf);
  }

  isInputAvailable(inputIndex: number, keyType: KeyType, keyData: Buffer): boolean {
    try {
      this.getInput(inputIndex, keyType, keyData);
      return true;
    } catch (e) {
      if (e! instanceof NoSuchEntry) {
        throw e;
      }
      return false;
    }
  }

  deleteInputEntries(inputIndex: number, keyTypes: psbtIn[]) {
    const map = this.inputMaps[inputIndex]
    map.forEach((_v, k, m) => {
      if (this.isKeyType(k, keyTypes)) {
        m.delete(k)
      }
    })
  }

  copy(to: PsbtV2) {
    this.copyMap(this.globalMap, to.globalMap);
    this.copyMaps(this.inputMaps, to.inputMaps);
    this.copyMaps(this.outputMaps, to.outputMaps);
  }
  copyMaps(from: Map<string, Buffer>[], to: Map<string, Buffer>[]) {
    from.forEach((m, index) => {
      if (m === undefined) {
        return;
      }
      const to = new Map();
      this.copyMap(m, to);
      to[index] = to;
    });
  }
  copyMap(from: Map<string, Buffer>, to: Map<string, Buffer>) {
    from.forEach((v, k) => to[k] = Buffer.from(v))
  }
  serialize(): Buffer {
    const buf = new BufferWriter(Buffer.of());
    buf.writeSlice(Buffer.of(0x70, 0x73, 0x62, 0x74, 0xFF))
    serializeMap(buf, this.globalMap);
    this.inputMaps.forEach(map => {
      serializeMap(buf, map);
    })
    this.outputMaps.forEach(map => {
      serializeMap(buf, map);
    })
    return buf.buffer
  }

  private getKeyDatas(map: Map<string, Buffer>, keyType: KeyType): Buffer[] {
    const result: Buffer[] = [];
    map.forEach((_v, k) => {
      if (this.isKeyType(k, [keyType])) {
        result.push(Buffer.from(k.substring(2), 'hex'));
      }
    })
    return result;
  }
  private isKeyType(hexKey: string, keyTypes: KeyType[]): boolean {
    const keyType = Buffer.from(hexKey.substring(0, 2), 'hex').readUInt8(0);
    return keyType in keyTypes;
  }
  private setGlobal(keyType: KeyType, value: Buffer) {
    const key = new Key(keyType, Buffer.of());
    this.globalMap[key.toString()] = new KeyPair(key, value);
  }
  private getGlobal(keyType: KeyType): Buffer {
    return get(this.globalMap, keyType, b());
  }
  private setInput(index: number, keyType: KeyType, keyData: Buffer, value: Buffer) {
    let map = this.inputMaps[index];
    if (!map) {
      this.inputMaps[index] = new Map();
    }
    set(map, keyType, keyData, value)
  }
  private getInput(index: number, keyType: KeyType, keyData: Buffer): Buffer {
    return get(this.inputMaps[index], keyType, keyData);
  }
  private setOutput(index: number, keyType: KeyType, keyData: Buffer, value: Buffer) {
    let map = this.outputMaps[index];
    if (!map) {
      this.outputMaps[index] = new Map();
    }
    set(map, keyType, keyData, value)
  }
  private getOutput(index: number, keyType: KeyType, keyData: Buffer): Buffer {
    return get(this.outputMaps[index], keyType, keyData);
  }
  private encodeBip32Derivation(masterFingerprint: Buffer, path: number[]) {
    const buf = new BufferWriter(Buffer.alloc(4 * (path.length + 1)));
    this.writeBip32Derivation(buf, masterFingerprint, path);
    return buf.buffer;
  }
  private decodeBip32Derivation(buffer: Buffer): { masterFingerprint: Buffer, path: number[] } {
    const buf = new BufferReader(buffer);
    return this.readBip32Derivation(buf);
  }
  private writeBip32Derivation(buf: BufferWriter, masterFingerprint: Buffer, path: number[]) {
    buf.writeSlice(masterFingerprint);
    path.forEach(element => {
      buf.writeUInt32(element);
    });
  }
  private readBip32Derivation(buf: BufferReader): { masterFingerprint: Buffer, path: number[] } {
    const masterFingerprint = buf.readSlice(4);
    const path: number[] = [];
    while (buf.offset < buf.buffer.length) {
      path.push(buf.readUInt32());
    }
    return { masterFingerprint, path }
  }
  private encodeTapBip32Derivation(hashes: Buffer[], masterFingerprint: Buffer, path: number[]): Buffer {
    const buf = new BufferWriter(Buffer.of());
    buf.writeVarInt(hashes.length);
    hashes.forEach(h => {
      buf.writeSlice(h);
    });
    this.writeBip32Derivation(buf, masterFingerprint, path);
    return buf.buffer;
  }
  private decodeTapBip32Derivation(buffer: Buffer): { hashes: Buffer[], masterFingerprint: Buffer, path: number[] } {
    const buf = new BufferReader(buffer);
    const hashCount = buf.readVarInt();
    const hashes: Buffer[] = [];
    for (let i = 0; i < hashCount; i++) {
      hashes.push(buf.readSlice(32));
    }
    const deriv = this.readBip32Derivation(buf);
    return { hashes, ...deriv };
  }
}
function get(map: Map<string, Buffer>, keyType: KeyType, keyData: Buffer): Buffer {
  if (map) throw Error("No such map");
  const key = new Key(keyType, keyData);
  const value: Buffer = map[Key.toString()];
  if (!value) {
    const e = new Error("");
    throw new NoSuchEntry(key.toString());
  }
  // Make sure to return a copy, to protect the underlying data.
  return Buffer.from(value);
}
type KeyType = number;

class Key {
  keyType: KeyType
  keyData: Buffer
  constructor(keyType: KeyType, keyData: Buffer) {
    this.keyType = keyType;
    this.keyData = keyData;
  }
  toString(): string {
    const buf = new BufferWriter(Buffer.of());
    this.toBuffer(buf);
    return buf.buffer.toString('hex');
  }
  serialize(buf: BufferWriter) {
    buf.writeVarInt(1 + this.keyData.length);
    this.toBuffer(buf);
  }
  private toBuffer(buf: BufferWriter) {
    buf.writeUInt8(this.keyType);
    buf.writeSlice(this.keyData);
  }
}
class KeyPair {
  key: Key;
  value: Buffer;
  constructor(key: Key, value: Buffer) {
    this.key = key;
    this.value = value;
  }
  serialize(buf: BufferWriter) {
    this.key.serialize(buf);
    buf.writeVarSlice(this.value);
  }
}
function createKey(buf: Buffer): Key {
  return new Key(buf.readUInt8(0), buf.slice(1));
}
function serializeMap(buf: BufferWriter, map: Map<String, Buffer>) {
  for (let k in map.keys) {
    const value = map[k];
    const keyPair = new KeyPair(createKey(Buffer.from(k, 'hex')), value)
    keyPair.serialize(buf)
  }
  buf.writeUInt8(0);
}

function b(): Buffer {
  return Buffer.of();
}
function set(map: Map<String, Buffer>, keyType: KeyType, keyData: Buffer, value: Buffer) {
  const key = new Key(keyType, keyData);
  map[key.toString()] = value;
}
function uint32LE(n: number): Buffer {
  const b = Buffer.alloc(4)
  b.writeUInt32LE(n, 0);
  return b;
}
function varint(n: number): Buffer {
  const b = new BufferWriter(Buffer.alloc(1));
  b.writeVarInt(n)
  return b.buffer;
}
function fromVarint(buf: Buffer): number {
  return new BufferReader(buf).readVarInt();
}