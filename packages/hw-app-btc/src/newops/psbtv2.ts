import { BigNumber } from 'bignumber.js'
import { BufferReader, BufferWriter } from 'bitcoinjs-lib/types/bufferutils';

const PSBT_GLOBAL_TX_VERSION = 0x02;
const PSBT_GLOBAL_FALLBACK_LOCKTIME = 0x03;
const PSBT_GLOBAL_INPUT_COUNT = 0x04;
const PSBT_GLOBAL_OUTPUT_COUNT = 0x05;
const PSBT_GLOBAL_VERSION = 0xfb;

const PSBT_IN_NON_WITNESS_UTXO = 0x00;
const PSBT_IN_WITNESS_UTXO = 0x01;
const PSBT_IN_PARTIAL_SIG = 0x02;
const PSBT_IN_REDEEM_SCRIPT = 0x04;
const PSBT_IN_BIP32_DERIVATION = 0x06;
const PSBT_IN_PREVIOUS_TXID = 0x0e;
const PSBT_IN_OUTPUT_INDEX = 0x0f;
const PSBT_IN_TAP_KEY_SIG = 0x13;
const PSBT_IN_TAP_BIP32_DERIVATION = 0x16;

const PSBT_OUT_REDEEM_SCRIPT = 0x00;
const PSBT_OUT_BIP_32_DERIVATION = 0x02;
const PSBT_OUT_AMOUNT = 0x03;
const PSBT_OUT_SCRIPT = 0x04;
const PSBT_OUT_TAP_BIP32_DERIVATION = 0x07;

export class PsbtV2 {
  protected globalMap: Map<string, Buffer> = new Map();
  protected inputMaps: Map<string, Buffer>[] = [];
  protected outputMaps: Map<string, Buffer>[] = [];

  setGlobalTxVersion(version: number) {
    this.setGlobal(PSBT_GLOBAL_TX_VERSION, uint32LE(version));
  }
  getGlobalTxVersion(): number {
    return this.getGlobal(PSBT_GLOBAL_TX_VERSION).readUInt32LE(0);
  }
  setGlobalFallbackLocktime(locktime: number) {
    this.setGlobal(PSBT_GLOBAL_FALLBACK_LOCKTIME, uint32LE(locktime));
  }
  getGlobalFallbackLocktime(): number {
    return this.getGlobal(PSBT_GLOBAL_FALLBACK_LOCKTIME).readUInt32LE(0);
  }
  setGlobalInputCount(inputCount: number) {
    this.setGlobal(PSBT_GLOBAL_INPUT_COUNT, varint(inputCount));
  }
  getGlobalInputCount(): number {
    return fromVarint(this.getGlobal(PSBT_GLOBAL_INPUT_COUNT));
  }
  setGlobalOutputCount(outputCount: number) {
    this.setGlobal(PSBT_GLOBAL_OUTPUT_COUNT, varint(outputCount));
  }
  getGlobalOutputCount(): number {
    return fromVarint(this.getGlobal(PSBT_GLOBAL_OUTPUT_COUNT));
  }
  setGlobalPsbtVersion(psbtVersion: number) {
    this.setGlobal(PSBT_GLOBAL_VERSION, uint32LE(psbtVersion));
  }
  getGlobalPsbtVersion(): number {
    return this.getGlobal(PSBT_GLOBAL_VERSION).readUInt32LE(0);
  }

  setInputNonWitnessUtxo(inputIndex: number, transaction: Buffer) {
    this.setInput(inputIndex, PSBT_IN_NON_WITNESS_UTXO, b(), transaction)
  }
  getInputNonWitnessUtxo(inputIndex: number): Buffer {
    return this.getInput(inputIndex, PSBT_IN_NON_WITNESS_UTXO, b());
  }
  setInputWitnessUtxo(inputIndex: number, amount: Buffer, scriptPubKey: Buffer) {
    const buf = new BufferWriter(Buffer.alloc(8));
    buf.writeSlice(amount);
    buf.writeVarSlice(scriptPubKey);
    this.setInput(inputIndex, PSBT_IN_WITNESS_UTXO, b(), buf.buffer);
  }
  getInputWitnessUtxo(inputIndex: number, amount: Buffer, scriptPubKey: Buffer): {amount: Buffer, scriptPubKey: Buffer} {
    const buf = new BufferReader(this.getInput(inputIndex, PSBT_IN_WITNESS_UTXO, b()));    
    return {amount: buf.readSlice(8), scriptPubKey: buf.readVarSlice()};
  }
  setInputPartialSig(inputIndex: number, signature: Buffer) {
    this.setInput(inputIndex, PSBT_IN_PARTIAL_SIG, b(), signature);
  }
  getInputPartialSig(inputIndex: number): Buffer {
    return this.getInput(inputIndex, PSBT_IN_PARTIAL_SIG, b());
  }
  setInputRedeemScript(inputIndex: number, redeemScript: Buffer) {
    this.setInput(inputIndex, PSBT_IN_REDEEM_SCRIPT, b(), redeemScript);
  }
  getInputRedeemScript(inputIndex: number): Buffer {
    return this.getInput(inputIndex, PSBT_IN_REDEEM_SCRIPT, b());
  }
  setInputBip32Derivation(inputIndex: number, pubkey: Buffer, masterFingerprint: Buffer, path: number[]) {
    this.setInput(inputIndex, PSBT_IN_BIP32_DERIVATION, pubkey, this.encodeBip32Derivation(masterFingerprint, path))
  }
  getInputBip32Derivation(inputIndex: number, pubkey: Buffer, masterFingerprint: Buffer, path: number[]): {masterFingerprint: Buffer, path: number[]} {
    const buf = this.getInput(inputIndex, PSBT_IN_BIP32_DERIVATION, pubkey);      
    return this.decodeBip32Derivation(buf);
  }
  setInputPreviousTxId(inputIndex: number, txid: Buffer) {
    this.setInput(inputIndex, PSBT_IN_PREVIOUS_TXID, b(), txid);
  }
  getInputPreviousTxId(inputIndex: number): Buffer {
    return this.getInput(inputIndex, PSBT_IN_PREVIOUS_TXID, b());
  }
  setInputOutputIndex(inputIndex: number, outputIndex: number) {
    this.setInput(inputIndex, PSBT_IN_OUTPUT_INDEX, b(), uint32LE(outputIndex));
  }
  getInputOutputIndex(inputIndex: number) {
    this.getInput(inputIndex, PSBT_IN_OUTPUT_INDEX, b()).readUInt32LE(0);
  }
  setInputTapKeySig(inputIndex: number, sig: Buffer) {
    this.setInput(inputIndex, PSBT_IN_TAP_KEY_SIG, b(), sig);
  }
  getInputTapKeySig(inputIndex: number): Buffer {
    return this.getInput(inputIndex, PSBT_IN_TAP_KEY_SIG, b());
  }
  setInputTapBip32Derivation(inputIndex: number, pubkey: Buffer, hashes: Buffer[], masterFingerprint: Buffer, path: number[]) {
    const buf = this.encodeTapBip32Derivation(hashes, masterFingerprint, path);
    this.setInput(inputIndex, PSBT_IN_TAP_BIP32_DERIVATION, pubkey, buf);
  }
  getInputTapBip32Derivation(inputIndex: number, pubkey: Buffer): {hashes: Buffer[], masterFingerprint: Buffer, path: number[]} {
    const buf = this.getInput(inputIndex, PSBT_IN_TAP_BIP32_DERIVATION, pubkey);
    return this.decodeTapBip32Derivation(buf);
  }

  setOutputRedeemScript(outputIndex: number, redeemScript: Buffer) {
    this.setOutput(outputIndex, PSBT_OUT_REDEEM_SCRIPT, b(), redeemScript);
  }
  getOutputRedeemScript(outputIndex: number): Buffer {
    return this.getOutput(outputIndex, PSBT_OUT_REDEEM_SCRIPT, b());
  }
  setOutputBip32Derivation(outputIndex: number, pubkey: Buffer, masterFingerprint: Buffer, path: number[]) {
    this.setOutput(outputIndex, PSBT_OUT_BIP_32_DERIVATION, pubkey, this.encodeBip32Derivation(masterFingerprint, path));
  }
  getOutputBip32Derivation(outputIndex: number, pubkey: Buffer): {masterFingerprint: Buffer, path: number[]} {
    const buf = this.getOutput(outputIndex, PSBT_OUT_BIP_32_DERIVATION, pubkey);
    return this.decodeBip32Derivation(buf);
  }
  setOutputAmount(outputIndex: number, amount: Buffer) {
    this.setOutput(outputIndex, PSBT_OUT_AMOUNT, b(), amount);
  }
  getOutputAmount(outputIndex: number): Buffer {
    return this.getOutput(outputIndex, PSBT_OUT_AMOUNT, b());
  }
  setOutputScript(outputIndex: number, scriptPubKey: Buffer) {
    this.setOutput(outputIndex, PSBT_OUT_SCRIPT, b(), scriptPubKey)
  }
  getOutputScript(outputIndex: number): Buffer {
    return this.getOutput(outputIndex, PSBT_OUT_SCRIPT, b());
  }
  setOutputTapBip32Derivation(outputIndex: number, pubkey: Buffer, hashes: Buffer[], fingerprint: Buffer, path: number[]) {
    const buf = this.encodeTapBip32Derivation(hashes, fingerprint, path);
    this.setOutput(outputIndex, PSBT_OUT_TAP_BIP32_DERIVATION, pubkey, buf);
  }
  getOutputTapBip32Derivation(outputIndex: number, pubkey: Buffer): {hashes: Buffer[], masterFingerprint: Buffer, path: number[]} {
    const buf = this.getOutput(outputIndex, PSBT_OUT_TAP_BIP32_DERIVATION, pubkey);
    return this.decodeTapBip32Derivation(buf);
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
    const buf = new BufferWriter(Buffer.alloc(4 * (path.length+1)));
    this.writeBip32Derivation(buf, masterFingerprint, path);
    return buf.buffer;
  }
  private decodeBip32Derivation(buffer: Buffer): {masterFingerprint: Buffer, path: number[]} {
    const buf = new BufferReader(buffer);
    return this.readBip32Derivation(buf);
  }
  private writeBip32Derivation(buf: BufferWriter, masterFingerprint: Buffer, path: number[]) {
    buf.writeSlice(masterFingerprint);
    path.forEach(element => {
      buf.writeUInt32(element);
    });
  }
  private readBip32Derivation(buf: BufferReader): {masterFingerprint: Buffer, path: number[]} {
    const masterFingerprint = buf.readSlice(4);    
    const path: number[] = [];
    while (buf.offset < buf.buffer.length) {
      path.push(buf.readUInt32());
    }
    return {masterFingerprint, path}
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
  private decodeTapBip32Derivation(buffer: Buffer): {hashes: Buffer[], masterFingerprint: Buffer, path: number[]} {
    const buf = new BufferReader(buffer);
    const hashCount = buf.readVarInt();
    const hashes: Buffer[] = [];
    for (let i = 0; i < hashCount; i++) {
      hashes.push(buf.readSlice(32));
    }
    const deriv = this.readBip32Derivation(buf);
    return {hashes, ...deriv};
  }
}
function get(map: Map<string, Buffer>, keyType: KeyType, keyData: Buffer): Buffer {
  if (map) throw Error("No such map");
  const key = new Key(keyType, keyData);
  return map[Key.toString()];
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