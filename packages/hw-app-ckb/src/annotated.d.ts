// @flow
/* istanbul ignore file */
type byteJSON = number;
export interface CastToArrayBuffer {
  toArrayBuffer(): ArrayBuffer;
}

export type CanCastToArrayBuffer = ArrayBuffer | CastToArrayBuffer | string;

export interface CreateOptions {
  validate?: boolean;
}

export interface UnionType<T> {
  type: string;
  value: T;
}

export interface AnnotatedCellInputJSON {
  input: CellInputJSON;
  source: RawTransactionJSON;
}
export function SerializeAnnotatedCellInput(
  value: AnnotatedCellInputJSON
): ArrayBuffer;
export class AnnotatedCellInput {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  getInput(): CellInput;
  getSource(): RawTransaction;
  toObject(): AnnotatedCellInputJSON;
}
type AnnotatedCellInputVecJSON = AnnotatedCellInputJSON[];
export function SerializeAnnotatedCellInputVec(
  value: Array<AnnotatedCellInputJSON>
): ArrayBuffer;
export class AnnotatedCellInputVec {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  indexAt(i: number): AnnotatedCellInput;
  length(): number;
  toObject(): AnnotatedCellInputVecJSON;
}
export interface AnnotatedRawTransactionJSON {
  version: Uint32JSON;
  cellDeps: CellDepVecJSON;
  headerDeps: Byte32VecJSON;
  inputs: AnnotatedCellInputVecJSON;
  outputs: CellOutputVecJSON;
  outputsData: BytesVecJSON;
}
export function SerializeAnnotatedRawTransaction(
  value: AnnotatedRawTransactionJSON
): ArrayBuffer;
export class AnnotatedRawTransaction {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  getVersion(): Uint32;
  getCellDeps(): CellDepVec;
  getHeaderDeps(): Byte32Vec;
  getInputs(): AnnotatedCellInputVec;
  getOutputs(): CellOutputVec;
  getOutputsData(): BytesVec;
  toObject(): AnnotatedRawTransactionJSON;
}
type Bip32JSON = Uint32JSON[];
export function SerializeBip32(value: Array<CanCastToArrayBuffer>): ArrayBuffer;
export class Bip32 {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  indexAt(i: number): Uint32;
  length(): number;
  toObject(): Bip32JSON;
}
export interface AnnotatedTransactionJSON {
  signPath: Bip32JSON;
  changePath: Bip32JSON;
  inputCount: Uint32JSON;
  raw: AnnotatedRawTransactionJSON;
  witnesses: BytesVecJSON;
}
export function SerializeAnnotatedTransaction(
  value: AnnotatedTransactionJSON
): ArrayBuffer;
export class AnnotatedTransaction {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  getSignPath(): Bip32;
  getChangePath(): Bip32;
  getInputCount(): Uint32;
  getRaw(): AnnotatedRawTransaction;
  getWitnesses(): BytesVec;
  toObject(): AnnotatedTransactionJSON;
}
type Uint32JSON = number;
export function SerializeUint32(value: CanCastToArrayBuffer): ArrayBuffer;
export class Uint32 {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  indexAt(i: number): number;
  raw(): ArrayBuffer;
  toBigEndianUint32(): number;
  toLittleEndianUint32(): number;
  static size(): number;
  toObject(): Uint32JSON;
}
type Uint64JSON = string;
export function SerializeUint64(value: CanCastToArrayBuffer): ArrayBuffer;
export class Uint64 {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  indexAt(i: number): number;
  raw(): ArrayBuffer;
  static size(): number;
  toObject(): Uint64JSON;
}
type Uint128JSON = string;
export function SerializeUint128(value: CanCastToArrayBuffer): ArrayBuffer;
export class Uint128 {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  indexAt(i: number): number;
  raw(): ArrayBuffer;
  static size(): number;
  toObject(): Uint128JSON;
}
type Byte32JSON = string;
export function SerializeByte32(value: CanCastToArrayBuffer): ArrayBuffer;
export class Byte32 {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  indexAt(i: number): number;
  raw(): ArrayBuffer;
  static size(): number;
  toObject(): Byte32JSON;
}
type Uint256JSON = string;
export function SerializeUint256(value: CanCastToArrayBuffer): ArrayBuffer;
export class Uint256 {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  indexAt(i: number): number;
  raw(): ArrayBuffer;
  static size(): number;
  toObject(): Uint256JSON;
}
type BytesJSON = string;
export function SerializeBytes(value: CanCastToArrayBuffer): ArrayBuffer;
export class Bytes {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  indexAt(i: number): number;
  raw(): ArrayBuffer;
  length(): number;
  toObject(): BytesJSON;
}
type BytesOptJSON = BytesJSON | undefined;
export function SerializeBytesOpt(value: CanCastToArrayBuffer): ArrayBuffer;
export class BytesOpt {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  value(): Bytes;
  hasValue(): boolean;
  toObject(): BytesOptJSON;
}
type BytesVecJSON = BytesJSON[];
export function SerializeBytesVec(
  value: Array<CanCastToArrayBuffer>
): ArrayBuffer;
export class BytesVec {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  indexAt(i: number): Bytes;
  length(): number;
  toObject(): BytesVecJSON;
}
type Byte32VecJSON = Byte32JSON[];
export function SerializeByte32Vec(
  value: Array<CanCastToArrayBuffer>
): ArrayBuffer;
export class Byte32Vec {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  indexAt(i: number): Byte32;
  length(): number;
  toObject(): Byte32VecJSON;
}
export interface ScriptJSON {
  codeHash: Byte32JSON;
  hashType: byteJSON;
  args: BytesJSON;
}
export function SerializeScript(value: ScriptJSON): ArrayBuffer;
export class Script {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  getCodeHash(): Byte32;
  getHashType(): number;
  getArgs(): Bytes;
  toObject(): ScriptJSON;
}
type ScriptOptJSON = ScriptJSON | undefined;
export function SerializeScriptOpt(value: ScriptJSON): ArrayBuffer;
export class ScriptOpt {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  value(): Script;
  hasValue(): boolean;
  toObject(): ScriptOptJSON;
}
export interface OutPointJSON {
  txHash: Byte32JSON;
  index: Uint32JSON;
}
export function SerializeOutPoint(value: OutPointJSON): ArrayBuffer;
export class OutPoint {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  static size(): number;
  getTxHash(): Byte32;
  getIndex(): Uint32;
  toObject(): OutPointJSON;
}
export interface CellInputJSON {
  since: Uint64JSON;
  previousOutput: OutPointJSON;
}
export function SerializeCellInput(value: CellInputJSON): ArrayBuffer;
export class CellInput {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  static size(): number;
  getSince(): Uint64;
  getPreviousOutput(): OutPoint;
  toObject(): CellInputJSON;
}
type CellInputVecJSON = CellInputJSON[];
export function SerializeCellInputVec(value: Array<CellInputJSON>): ArrayBuffer;
export class CellInputVec {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  indexAt(i: number): CellInput;
  length(): number;
  toObject(): CellInputVecJSON;
}
export interface CellOutputJSON {
  capacity: Uint64JSON;
  lock: ScriptJSON;
  type: ScriptOptJSON;
}
export function SerializeCellOutput(value: CellOutputJSON): ArrayBuffer;
export class CellOutput {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  getCapacity(): Uint64;
  getLock(): Script;
  getType(): ScriptOpt;
  toObject(): CellOutputJSON;
}
type CellOutputVecJSON = CellOutputJSON[];
export function SerializeCellOutputVec(
  value: Array<CellOutputJSON>
): ArrayBuffer;
export class CellOutputVec {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  indexAt(i: number): CellOutput;
  length(): number;
  toObject(): CellOutputVecJSON;
}
export interface CellDepJSON {
  outPoint: OutPointJSON;
  depType: byteJSON;
}
export function SerializeCellDep(value: CellDepJSON): ArrayBuffer;
export class CellDep {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  static size(): number;
  getOutPoint(): OutPoint;
  getDepType(): number;
  toObject(): CellDepJSON;
}
type CellDepVecJSON = CellDepJSON[];
export function SerializeCellDepVec(value: Array<CellDepJSON>): ArrayBuffer;
export class CellDepVec {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  indexAt(i: number): CellDep;
  length(): number;
  toObject(): CellDepVecJSON;
}
export interface RawTransactionJSON {
  version: Uint32JSON;
  cellDeps: CellDepVecJSON;
  headerDeps: Byte32VecJSON;
  inputs: CellInputVecJSON;
  outputs: CellOutputVecJSON;
  outputsData: BytesVecJSON;
}
export function SerializeRawTransaction(value: RawTransactionJSON): ArrayBuffer;
export class RawTransaction {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  getVersion(): Uint32;
  getCellDeps(): CellDepVec;
  getHeaderDeps(): Byte32Vec;
  getInputs(): CellInputVec;
  getOutputs(): CellOutputVec;
  getOutputsData(): BytesVec;
  toObject(): RawTransactionJSON;
}
export interface TransactionJSON {
  raw: RawTransactionJSON;
  witnesses: BytesVecJSON;
}
export function SerializeTransaction(value: TransactionJSON): ArrayBuffer;
export class Transaction {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  getRaw(): RawTransaction;
  getWitnesses(): BytesVec;
  toObject(): TransactionJSON;
}
export interface WitnessArgsJSON {
  lock: BytesOptJSON;
  inputType: BytesOptJSON;
  outputType: BytesOptJSON;
}
export function SerializeWitnessArgs(value: WitnessArgsJSON): ArrayBuffer;
export class WitnessArgs {
  constructor(reader: CanCastToArrayBuffer, options?: CreateOptions);
  validate(compatible?: boolean): void;
  getLock(): BytesOpt;
  getInputType(): BytesOpt;
  getOutputType(): BytesOpt;
  toObject(): WitnessArgsJSON;
}
