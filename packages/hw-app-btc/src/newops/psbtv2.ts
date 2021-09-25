import { BigNumber } from 'bignumber.js'
import { BufferWriter } from 'bitcoinjs-lib/types/bufferutils';

const PSBT_GLOBAL_TX_VERSION = 0x02;
const PSBT_GLOBAL_FALLBACK_LOCKTIME = 0x03;
const PSBT_GLOBAL_INPUT_COUNT = 0x04;
const PSBT_GLOBAL_OUTPUT_COUNT = 0x05;
const PSBT_GLOBAL_VERSION = 0xfb;

const PSBT_IN_NON_WITNESS_UTXO = 0x00;
const PSBT_IN_WITNESS_UTXO = 0x01;
const PSBT_IN_REDEEM_SCRIPT = 0x04;
const PSBT_IN_BIP32_DERIVATION = 0x06;
const PSBT_IN_PREVIOUS_TXID = 0x0e;
const PSBT_IN_OUTPUT_INDEX = 0x0f;
const PSBT_IN_TAP_BIP32_DERIVATION = 0x16;

const PSBT_OUT_REDEEM_SCRIPT = 0x00;
const PSBT_OUT_BIP_32_DERIVATION = 0x02;
const PSBT_OUT_AMOUNT = 0x03;
const PSBT_OUT_SCRIPT = 0x04;
const PSBT_OUT_TAP_BIP32_DERIVATION = 0x07;

export class PsbtV2 {
  private globalMap: Map<string, KeyPair> = new Map();
  private inputMaps: Map<string, KeyPair>[] = [];
  private outputMaps: Map<string, KeyPair>[] = [];

  setGlobalTxVersion(version: number) {
    this.setGlobal(PSBT_GLOBAL_TX_VERSION, uint32LE(version));
  }
  setGlobalFallbackLocktime(locktime: number) {
    this.setGlobal(PSBT_GLOBAL_FALLBACK_LOCKTIME, uint32LE(locktime));
  }
  setGlobalInputCount(inputCount: number) {
    this.setGlobal(PSBT_GLOBAL_INPUT_COUNT, varint(inputCount));
  }
  setGlobalOutputCount(outputCount: number) {
    this.setGlobal(PSBT_GLOBAL_OUTPUT_COUNT, varint(outputCount));
  }
  setGlobalPsbtVersion(psbtVersion: number) {
    this.setGlobal(PSBT_GLOBAL_VERSION, uint32LE(psbtVersion));
  }

  setInputNonWitnessUtxo(inputIndex: number, transaction: Buffer) {
    this.setInput(inputIndex, PSBT_IN_NON_WITNESS_UTXO, b(), transaction)
  }
  setInputWitnessUtxo(inputIndex: number, amount: Buffer, scriptPubKey: Buffer) {
    const buf = new BufferWriter(Buffer.alloc(8));
    buf.writeSlice(amount);
    buf.writeSlice(scriptPubKey);
    this.setInput(inputIndex, PSBT_IN_WITNESS_UTXO, b(), buf.buffer);
  }
  setInputRedeemScript(inputIndex: number, redeemScript: Buffer) {
    this.setInput(inputIndex, PSBT_IN_REDEEM_SCRIPT, b(), redeemScript);
  }
  setInputBip32Derivation(inputIndex: number, pubkey: Buffer, masterFingerprint: Buffer, path: number[]) {
    this.setInput(inputIndex, PSBT_IN_BIP32_DERIVATION, pubkey, this.encodeBip32Derivation(masterFingerprint, path))
  }

  setInputPreviousTxId(inputIndex: number, txid: Buffer) {
    this.setInput(inputIndex, PSBT_IN_PREVIOUS_TXID, b(), txid);
  }
  setInputOutputIndex(inputIndex: number, outputIndex: number) {
    this.setInput(inputIndex, PSBT_IN_OUTPUT_INDEX, b(), uint32LE(outputIndex));
  }
  setInputTapBip32Derivation(inputIndex: number, pubkey: Buffer, hashes: Buffer[], fingerprint: Buffer, path: number[]) {
    const buf = this.encodeTapBip32Derivation(hashes, fingerprint, path);
    this.setInput(inputIndex, PSBT_IN_TAP_BIP32_DERIVATION, pubkey, buf);
  }


  setOutputRedeemScript(outputIndex: number, redeemScript: Buffer) {
    this.setOutput(outputIndex, PSBT_OUT_REDEEM_SCRIPT, b(), redeemScript);
  }
  setOutputBip32Derivation(outputIndex: number, pubkey: Buffer, masterFingerprint: Buffer, path: number[]) {
    this.setOutput(outputIndex, PSBT_OUT_BIP_32_DERIVATION, pubkey, this.encodeBip32Derivation(masterFingerprint, path));
  }
  setOutputAmount(outputIndex: number, amount: Buffer) {
    this.setOutput(outputIndex, PSBT_OUT_AMOUNT, b(), amount);
  }
  setOutputScript(outputIndex: number, scriptPubKey: Buffer) {
    this.setOutput(outputIndex, PSBT_OUT_SCRIPT, b(), scriptPubKey)
  }
  setOutputTapBip32Derivation(outputIndex: number, pubkey: Buffer, hashes: Buffer[], fingerprint: Buffer, path: number[]) {
    const buf = this.encodeTapBip32Derivation(hashes, fingerprint, path);
    this.setOutput(outputIndex, PSBT_OUT_TAP_BIP32_DERIVATION, pubkey, buf);
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
  private setInput(index: number, keyType: KeyType, keyData: Buffer, value: Buffer) {
    let map = this.inputMaps[index];
    if (!map) {
      this.inputMaps[index] = new Map();
    }
    set(map, keyType, keyData, value)
  }
  private setOutput(index: number, keyType: KeyType, keyData: Buffer, value: Buffer) {
    let map = this.outputMaps[index];
    if (!map) {
      this.outputMaps[index] = new Map();
    }
    set(map, keyType, keyData, value)
  }

  private encodeBip32Derivation(masterFingerprint: Buffer, path: number[]) {
    const buf = new BufferWriter(Buffer.alloc(4 * (path.length+1)));
    this.writeBip32Derivation(buf, masterFingerprint, path);
    return buf.buffer;
  }
  private writeBip32Derivation(buf: BufferWriter, masterFingerprint: Buffer, path: number[]) {
    buf.writeSlice(masterFingerprint);
    path.forEach(element => {
      buf.writeUInt32(element);
    });
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
    buf.writeSlice(this.value);
  }
}
function b(): Buffer {
  return Buffer.of();
}
function set(map: Map<string, KeyPair>, keyType: KeyType, keyData: Buffer, value: Buffer) {
  const key = new Key(keyType, keyData);
  const keyPair = new KeyPair(key, value);
  map[key.toString()] = keyPair;
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
function serializeMap(buf: BufferWriter, map: Map<string, KeyPair>) {
  for (let k in map.keys) {
    const keyPair = map[k];
    keyPair.serialize(buf)
  }
  buf.writeUInt8(0);
}
