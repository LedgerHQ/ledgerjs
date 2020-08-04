function dataLengthError(actual, required) {
    throw new Error(`Invalid data length! Required: ${required}, actual: ${actual}`);
}

function assertDataLength(actual, required) {
  if (actual !== required) {
    dataLengthError(actual, required);
  }
}

function assertArrayBuffer(reader, padTo) {
  if (typeof reader === "string") {
	  reader = reader.replace(/^0x/,"")
	  if(reader.length % 2 == 1) reader = reader.padStart(reader.length+1, "0");
	  if(padTo !== undefined) reader = reader.padEnd(padTo*2, "0");
	  reader = Buffer.from(reader, 'hex');
	  reader = reader.buffer.slice(reader.byteOffset,reader.byteOffset+reader.byteLength);
  }
  if (reader instanceof Object && reader.toArrayBuffer instanceof Function) {
    reader = reader.toArrayBuffer();
  }
  if (!(reader instanceof ArrayBuffer)) {
    throw new Error("Provided value must be an ArrayBuffer or can be transformed into ArrayBuffer!");
  }
  return reader;
}

function verifyAndExtractOffsets(view, expectedFieldCount, compatible) {
  if (view.byteLength < 4) {
    dataLengthError(view.byteLength, ">4");
  }
  const requiredByteLength = view.getUint32(0, true);
  assertDataLength(view.byteLength, requiredByteLength);
  if (requiredByteLength === 4) {
    return [requiredByteLength];
  }
  if (requiredByteLength < 8) {
    dataLengthError(view.byteLength, ">8");
  }
  const firstOffset = view.getUint32(4, true);
  if (firstOffset % 4 !== 0 || firstOffset < 8) {
    throw new Error(`Invalid first offset: ${firstOffset}`);
  }
  const itemCount = firstOffset / 4 - 1;
  if (itemCount < expectedFieldCount) {
    throw new Error(`Item count not enough! Required: ${expectedFieldCount}, actual: ${itemCount}`);
  } else if ((!compatible) && itemCount > expectedFieldCount) {
    throw new Error(`Item count is more than required! Required: ${expectedFieldCount}, actual: ${itemCount}`);
  }
  if (requiredByteLength < firstOffset) {
    throw new Error(`First offset is larger than byte length: ${firstOffset}`);
  }
  const offsets = [];
  for (let i = 0; i < itemCount; i++) {
    const start = 4 + i * 4;
    offsets.push(view.getUint32(start, true));
  }
  offsets.push(requiredByteLength);
  for (let i = 0; i < offsets.length - 1; i++) {
    if (offsets[i] > offsets[i + 1]) {
      throw new Error(`Offset index ${i}: ${offsets[i]} is larger than offset index ${i + 1}: ${offsets[i + 1]}`);
    }
  }
  return offsets;
}

function fromStringEnum(val) {
  switch(typeof val) {
  case "string":
    switch(val.toLowerCase()) {
    case "code":
    case "data":
      return 0;
    case "dep_group":
    case "type":
      return 1;
    default:
    throw new Error("Not a valid byte representation: "+val);
    }
  case "number":
    return val;
  default:
    throw new Error("Not a valid byte representation: "+val);
  }
}

function serializeTable(buffers) {
  const itemCount = buffers.length;
  let totalSize = 4 * (itemCount + 1);
  const offsets = [];

  for (let i = 0; i < itemCount; i++) {
    offsets.push(totalSize);
    totalSize += buffers[i].byteLength;
  }

  const buffer = new ArrayBuffer(totalSize);
  const array = new Uint8Array(buffer);
  const view = new DataView(buffer);

  view.setUint32(0, totalSize, true);
  for (let i = 0; i < itemCount; i++) {
    view.setUint32(4 + i * 4, offsets[i], true);
    array.set(new Uint8Array(buffers[i]), offsets[i]);
  }
  return buffer;
}
type byteJSON = number;



export class AnnotatedCellInput {
  constructor(reader, { validate = true } = {}) {
    this.view = new DataView(assertArrayBuffer(reader));
    if (validate) {
      this.validate();
    }
  }

  validate(compatible = false) {
    const offsets = verifyAndExtractOffsets(this.view, 0, true);
    new CellInput(this.view.buffer.slice(offsets[0], offsets[1]), { validate: false }).validate();
    new RawTransaction(this.view.buffer.slice(offsets[1], offsets[2]), { validate: false }).validate();
  }

  getInput() {
    const start = 4;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.getUint32(start + 4, true);
    return new CellInput(this.view.buffer.slice(offset, offset_end), { validate: false });
  }

  getSource() {
    const start = 8;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.byteLength;
    return new RawTransaction(this.view.buffer.slice(offset, offset_end), { validate: false });
  }
  toObject() {
    let obj={};
    obj["input"]=this.getInput().toObject();
    obj["source"]=this.getSource().toObject();
    return obj;
  }
}

export function SerializeAnnotatedCellInput(value) {
  if(typeof value === "object" && value !== null && "view" in value) return value.view.buffer;
  const buffers = [];
  buffers.push(SerializeCellInput(value.input));
  buffers.push(SerializeRawTransaction(value.source));
  return serializeTable(buffers);
}


export class AnnotatedCellInputVec {
  constructor(reader, { validate = true } = {}) {
    this.view = new DataView(assertArrayBuffer(reader));
    if (validate) {
      this.validate();
    }
  }

  validate(compatible = false) {
    const offsets = verifyAndExtractOffsets(this.view, 0, true);
    for (let i = 0; i < offsets.length - 1; i++) {
      new AnnotatedCellInput(this.view.buffer.slice(offsets[i], offsets[i + 1]), { validate: false }).validate();
    }
  }

  length() {
    if (this.view.byteLength < 8) {
      return 0;
    } else {
      return this.view.getUint32(4, true) / 4 - 1;
    }
  }

  indexAt(i) {
    const start = 4 + i * 4;
    const offset = this.view.getUint32(start, true);
    let offset_end = this.view.byteLength;
    if (i + 1 < this.length()) {
      offset_end = this.view.getUint32(start + 4, true);
    }
    return new AnnotatedCellInput(this.view.buffer.slice(offset, offset_end), { validate: false });
  }
  toObject() {
    const len=this.length();
    var rv=[];
    for(var i=0;i<len;i++) {
      rv.push(this.indexAt(i).toObject());
    }
    return rv;
  }
}

export function SerializeAnnotatedCellInputVec(value) {
  if(typeof value === "object" && value !== null && "view" in value) return value.view.buffer;
  return serializeTable(value.map(item => SerializeAnnotatedCellInput(item)));
}


export class AnnotatedRawTransaction {
  constructor(reader, { validate = true } = {}) {
    this.view = new DataView(assertArrayBuffer(reader));
    if (validate) {
      this.validate();
    }
  }

  validate(compatible = false) {
    const offsets = verifyAndExtractOffsets(this.view, 0, true);
    new Uint32(this.view.buffer.slice(offsets[0], offsets[1]), { validate: false }).validate();
    new CellDepVec(this.view.buffer.slice(offsets[1], offsets[2]), { validate: false }).validate();
    new Byte32Vec(this.view.buffer.slice(offsets[2], offsets[3]), { validate: false }).validate();
    new AnnotatedCellInputVec(this.view.buffer.slice(offsets[3], offsets[4]), { validate: false }).validate();
    new CellOutputVec(this.view.buffer.slice(offsets[4], offsets[5]), { validate: false }).validate();
    new BytesVec(this.view.buffer.slice(offsets[5], offsets[6]), { validate: false }).validate();
  }

  getVersion() {
    const start = 4;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.getUint32(start + 4, true);
    return new Uint32(this.view.buffer.slice(offset, offset_end), { validate: false });
  }

  getCellDeps() {
    const start = 8;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.getUint32(start + 4, true);
    return new CellDepVec(this.view.buffer.slice(offset, offset_end), { validate: false });
  }

  getHeaderDeps() {
    const start = 12;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.getUint32(start + 4, true);
    return new Byte32Vec(this.view.buffer.slice(offset, offset_end), { validate: false });
  }

  getInputs() {
    const start = 16;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.getUint32(start + 4, true);
    return new AnnotatedCellInputVec(this.view.buffer.slice(offset, offset_end), { validate: false });
  }

  getOutputs() {
    const start = 20;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.getUint32(start + 4, true);
    return new CellOutputVec(this.view.buffer.slice(offset, offset_end), { validate: false });
  }

  getOutputsData() {
    const start = 24;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.byteLength;
    return new BytesVec(this.view.buffer.slice(offset, offset_end), { validate: false });
  }
  toObject() {
    let obj={};
    obj["version"]=this.getVersion().toObject();
    obj["cell_deps"]=this.getCellDeps().toObject();
    obj["header_deps"]=this.getHeaderDeps().toObject();
    obj["inputs"]=this.getInputs().toObject();
    obj["outputs"]=this.getOutputs().toObject();
    obj["outputs_data"]=this.getOutputsData().toObject();
    return obj;
  }
}

export function SerializeAnnotatedRawTransaction(value) {
  if(typeof value === "object" && value !== null && "view" in value) return value.view.buffer;
  const buffers = [];
  buffers.push(SerializeUint32(value.version));
  buffers.push(SerializeCellDepVec(value.cell_deps));
  buffers.push(SerializeByte32Vec(value.header_deps));
  buffers.push(SerializeAnnotatedCellInputVec(value.inputs));
  buffers.push(SerializeCellOutputVec(value.outputs));
  buffers.push(SerializeBytesVec(value.outputs_data));
  return serializeTable(buffers);
}


export class Bip32 {
  constructor(reader, { validate = true } = {}) {
    this.view = new DataView(assertArrayBuffer(reader));
    if (validate) {
      this.validate();
    }
  }

  validate(compatible = false) {
    if (this.view.byteLength < 4) {
      dataLengthError(this.view.byteLength, ">4");
    }
    const requiredByteLength = this.length() * Uint32.size() + 4;
    assertDataLength(this.view.byteLength, requiredByteLength);
    for (let i = 0; i < 0; i++) {
      const item = this.indexAt(i);
      item.validate(compatible);
    }
  }

  indexAt(i) {
    return new Uint32(this.view.buffer.slice(4 + i * Uint32.size(), 4 + (i + 1) * Uint32.size()), { validate: false });
  }

  toObject() {
    const len=this.length();
    var rv=[];
    for(var i=0;i<len;i++) {
      rv.push(this.indexAt(i).toObject());
    }
    return rv;
  }
  length() {
    return this.view.getUint32(0, true);
  }
}

export function SerializeBip32(value) {
  if(typeof value === "object" && value !== null && "view" in value) return value.view.buffer;
  const array = new Uint8Array(4 + Uint32.size() * value.length);
  (new DataView(array.buffer)).setUint32(0, value.length, true);
  for (let i = 0; i < value.length; i++) {
    const itemBuffer = SerializeUint32(value[i]);
    array.set(new Uint8Array(itemBuffer), 4 + i * Uint32.size());
  }
  return array.buffer;
}


export class AnnotatedTransaction {
  constructor(reader, { validate = true } = {}) {
    this.view = new DataView(assertArrayBuffer(reader));
    if (validate) {
      this.validate();
    }
  }

  validate(compatible = false) {
    const offsets = verifyAndExtractOffsets(this.view, 0, true);
    new Bip32(this.view.buffer.slice(offsets[0], offsets[1]), { validate: false }).validate();
    new Bip32(this.view.buffer.slice(offsets[1], offsets[2]), { validate: false }).validate();
    new Uint32(this.view.buffer.slice(offsets[2], offsets[3]), { validate: false }).validate();
    new AnnotatedRawTransaction(this.view.buffer.slice(offsets[3], offsets[4]), { validate: false }).validate();
    new BytesVec(this.view.buffer.slice(offsets[4], offsets[5]), { validate: false }).validate();
  }

  getSignPath() {
    const start = 4;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.getUint32(start + 4, true);
    return new Bip32(this.view.buffer.slice(offset, offset_end), { validate: false });
  }

  getChangePath() {
    const start = 8;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.getUint32(start + 4, true);
    return new Bip32(this.view.buffer.slice(offset, offset_end), { validate: false });
  }

  getInputCount() {
    const start = 12;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.getUint32(start + 4, true);
    return new Uint32(this.view.buffer.slice(offset, offset_end), { validate: false });
  }

  getRaw() {
    const start = 16;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.getUint32(start + 4, true);
    return new AnnotatedRawTransaction(this.view.buffer.slice(offset, offset_end), { validate: false });
  }

  getWitnesses() {
    const start = 20;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.byteLength;
    return new BytesVec(this.view.buffer.slice(offset, offset_end), { validate: false });
  }
  toObject() {
    let obj={};
    obj["signPath"]=this.getSignPath().toObject();
    obj["changePath"]=this.getChangePath().toObject();
    obj["inputCount"]=this.getInputCount().toObject();
    obj["raw"]=this.getRaw().toObject();
    obj["witnesses"]=this.getWitnesses().toObject();
    return obj;
  }
}

export function SerializeAnnotatedTransaction(value) {
  if(typeof value === "object" && value !== null && "view" in value) return value.view.buffer;
  const buffers = [];
  buffers.push(SerializeBip32(value.signPath));
  buffers.push(SerializeBip32(value.changePath));
  buffers.push(SerializeUint32(value.inputCount));
  buffers.push(SerializeAnnotatedRawTransaction(value.raw));
  buffers.push(SerializeBytesVec(value.witnesses));
  return serializeTable(buffers);
}


export class Uint32 {
  constructor(reader, { validate = true } = {}) {
    this.view = new DataView(assertArrayBuffer(reader));
    if (validate) {
      this.validate();
    }
  }

  validate(compatible = false) {
    assertDataLength(this.view.byteLength, 4);
  }

  indexAt(i) {
    return this.view.getUint8(i);
  }

  raw() {
    return this.view.buffer;
  }

  toBigEndianUint32() {
    return this.view.getUint32(0, false);
  }

  toLittleEndianUint32() {
    return this.view.getUint32(0, true);
  }

  toObject() {
    return this.toLittleEndianUint32();
  }

  static size() {
    return 4;
  }
}

export function SerializeUint32(value) {
  if(typeof value === "object" && value !== null && "view" in value) return value.view.buffer;
  switch(typeof value) {
  case "number":
    var tmp = new ArrayBuffer(4);
    var tmpDV = new DataView(tmp);
    tmpDV.setInt32(0, value, true);
    return tmp;
    break;
  default:
    const buffer = assertArrayBuffer(value, 4);
    assertDataLength(buffer.byteLength, 4);
    return buffer;
  }
}


export class Uint64 {
  constructor(reader, { validate = true } = {}) {
    this.view = new DataView(assertArrayBuffer(reader));
    if (validate) {
      this.validate();
    }
  }

  validate(compatible = false) {
    assertDataLength(this.view.byteLength, 8);
  }

  indexAt(i) {
    return this.view.getUint8(i);
  }

  raw() {
    return this.view.buffer;
  }

  toObject() {
    return Buffer.from(this.raw()).toString('hex');
  }
  static size() {
    return 8;
  }
}

export function SerializeUint64(value) {
  if(typeof value === "object" && value !== null && "view" in value) return value.view.buffer;
  switch(typeof value) {
  case "number":
    var tmp = new ArrayBuffer(8);
    var tmpDV = new DataView(tmp);
    throw new Error("Can't accept numbers for unusual byte arrays");
    return tmp;
    break;
  default:
    const buffer = assertArrayBuffer(value);
    assertDataLength(buffer.byteLength, 8);
    return buffer;
  }
}


export class Uint128 {
  constructor(reader, { validate = true } = {}) {
    this.view = new DataView(assertArrayBuffer(reader));
    if (validate) {
      this.validate();
    }
  }

  validate(compatible = false) {
    assertDataLength(this.view.byteLength, 16);
  }

  indexAt(i) {
    return this.view.getUint8(i);
  }

  raw() {
    return this.view.buffer;
  }

  toObject() {
    return Buffer.from(this.raw()).toString('hex');
  }
  static size() {
    return 16;
  }
}

export function SerializeUint128(value) {
  if(typeof value === "object" && value !== null && "view" in value) return value.view.buffer;
  switch(typeof value) {
  case "number":
    var tmp = new ArrayBuffer(16);
    var tmpDV = new DataView(tmp);
    throw new Error("Can't accept numbers for unusual byte arrays");
    return tmp;
    break;
  default:
    const buffer = assertArrayBuffer(value);
    assertDataLength(buffer.byteLength, 16);
    return buffer;
  }
}


export class Byte32 {
  constructor(reader, { validate = true } = {}) {
    this.view = new DataView(assertArrayBuffer(reader));
    if (validate) {
      this.validate();
    }
  }

  validate(compatible = false) {
    assertDataLength(this.view.byteLength, 32);
  }

  indexAt(i) {
    return this.view.getUint8(i);
  }

  raw() {
    return this.view.buffer;
  }

  toObject() {
    return Buffer.from(this.raw()).toString('hex');
  }
  static size() {
    return 32;
  }
}

export function SerializeByte32(value) {
  if(typeof value === "object" && value !== null && "view" in value) return value.view.buffer;
  switch(typeof value) {
  case "number":
    var tmp = new ArrayBuffer(32);
    var tmpDV = new DataView(tmp);
    throw new Error("Can't accept numbers for unusual byte arrays");
    return tmp;
    break;
  default:
    const buffer = assertArrayBuffer(value);
    assertDataLength(buffer.byteLength, 32);
    return buffer;
  }
}


export class Uint256 {
  constructor(reader, { validate = true } = {}) {
    this.view = new DataView(assertArrayBuffer(reader));
    if (validate) {
      this.validate();
    }
  }

  validate(compatible = false) {
    assertDataLength(this.view.byteLength, 32);
  }

  indexAt(i) {
    return this.view.getUint8(i);
  }

  raw() {
    return this.view.buffer;
  }

  toObject() {
    return Buffer.from(this.raw()).toString('hex');
  }
  static size() {
    return 32;
  }
}

export function SerializeUint256(value) {
  if(typeof value === "object" && value !== null && "view" in value) return value.view.buffer;
  switch(typeof value) {
  case "number":
    var tmp = new ArrayBuffer(32);
    var tmpDV = new DataView(tmp);
    throw new Error("Can't accept numbers for unusual byte arrays");
    return tmp;
    break;
  default:
    const buffer = assertArrayBuffer(value);
    assertDataLength(buffer.byteLength, 32);
    return buffer;
  }
}


export class Bytes {
  constructor(reader, { validate = true } = {}) {
    this.view = new DataView(assertArrayBuffer(reader));
    if (validate) {
      this.validate();
    }
  }

  validate(compatible = false) {
    if (this.view.byteLength < 4) {
      dataLengthError(this.view.byteLength, ">4")
    }
    const requiredByteLength = this.length() + 4;
    assertDataLength(this.view.byteLength, requiredByteLength);
  }

  raw() {
    return this.view.buffer.slice(4);
  }

  indexAt(i) {
    return this.view.getUint8(4 + i);
  }

  toObject() {
    return Buffer.from(this.raw()).toString('hex');
  }
  length() {
    return this.view.getUint32(0, true);
  }
}

export function SerializeBytes(value) {
  if(typeof value === "object" && value !== null && "view" in value) return value.view.buffer;
  const item = assertArrayBuffer(value);
  const array = new Uint8Array(4 + item.byteLength);
  (new DataView(array.buffer)).setUint32(0, item.byteLength, true);
  array.set(new Uint8Array(item), 4);
  return array.buffer;
}


export class BytesOpt {
  constructor(reader, { validate = true } = {}) {
    this.view = new DataView(assertArrayBuffer(reader));
    if (validate) {
      this.validate();
    }
  }

  validate(compatible = false) {
    if (this.hasValue()) {
      this.value().validate(compatible);
    }
  }

  value() {
    return new Bytes(this.view.buffer, { validate: false });
  }

  toObject() {
    if(this.hasValue()) return this.value().toObject();
    return null;
  }
  hasValue() {
    return this.view.byteLength > 0;
  }
}

export function SerializeBytesOpt(value) {
  if(typeof value === "object" && value !== null && "view" in value) return value.view.buffer;
  if (value) {
    return SerializeBytes(value);
  } else {
    return new ArrayBuffer(0);
  }
}


export class BytesVec {
  constructor(reader, { validate = true } = {}) {
    this.view = new DataView(assertArrayBuffer(reader));
    if (validate) {
      this.validate();
    }
  }

  validate(compatible = false) {
    const offsets = verifyAndExtractOffsets(this.view, 0, true);
    for (let i = 0; i < offsets.length - 1; i++) {
      new Bytes(this.view.buffer.slice(offsets[i], offsets[i + 1]), { validate: false }).validate();
    }
  }

  length() {
    if (this.view.byteLength < 8) {
      return 0;
    } else {
      return this.view.getUint32(4, true) / 4 - 1;
    }
  }

  indexAt(i) {
    const start = 4 + i * 4;
    const offset = this.view.getUint32(start, true);
    let offset_end = this.view.byteLength;
    if (i + 1 < this.length()) {
      offset_end = this.view.getUint32(start + 4, true);
    }
    return new Bytes(this.view.buffer.slice(offset, offset_end), { validate: false });
  }
  toObject() {
    const len=this.length();
    var rv=[];
    for(var i=0;i<len;i++) {
      rv.push(this.indexAt(i).toObject());
    }
    return rv;
  }
}

export function SerializeBytesVec(value) {
  if(typeof value === "object" && value !== null && "view" in value) return value.view.buffer;
  return serializeTable(value.map(item => SerializeBytes(item)));
}


export class Byte32Vec {
  constructor(reader, { validate = true } = {}) {
    this.view = new DataView(assertArrayBuffer(reader));
    if (validate) {
      this.validate();
    }
  }

  validate(compatible = false) {
    if (this.view.byteLength < 4) {
      dataLengthError(this.view.byteLength, ">4");
    }
    const requiredByteLength = this.length() * Byte32.size() + 4;
    assertDataLength(this.view.byteLength, requiredByteLength);
    for (let i = 0; i < 0; i++) {
      const item = this.indexAt(i);
      item.validate(compatible);
    }
  }

  indexAt(i) {
    return new Byte32(this.view.buffer.slice(4 + i * Byte32.size(), 4 + (i + 1) * Byte32.size()), { validate: false });
  }

  toObject() {
    const len=this.length();
    var rv=[];
    for(var i=0;i<len;i++) {
      rv.push(this.indexAt(i).toObject());
    }
    return rv;
  }
  length() {
    return this.view.getUint32(0, true);
  }
}

export function SerializeByte32Vec(value) {
  if(typeof value === "object" && value !== null && "view" in value) return value.view.buffer;
  const array = new Uint8Array(4 + Byte32.size() * value.length);
  (new DataView(array.buffer)).setUint32(0, value.length, true);
  for (let i = 0; i < value.length; i++) {
    const itemBuffer = SerializeByte32(value[i]);
    array.set(new Uint8Array(itemBuffer), 4 + i * Byte32.size());
  }
  return array.buffer;
}


export class Script {
  constructor(reader, { validate = true } = {}) {
    this.view = new DataView(assertArrayBuffer(reader));
    if (validate) {
      this.validate();
    }
  }

  validate(compatible = false) {
    const offsets = verifyAndExtractOffsets(this.view, 0, true);
    new Byte32(this.view.buffer.slice(offsets[0], offsets[1]), { validate: false }).validate();
    if (offsets[2] - offsets[1] !== 1) {
      throw new Error(`Invalid offset for hash_type: ${offsets[1]} - ${offsets[2]}`)
    }
    new Bytes(this.view.buffer.slice(offsets[2], offsets[3]), { validate: false }).validate();
  }

  getCodeHash() {
    const start = 4;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.getUint32(start + 4, true);
    return new Byte32(this.view.buffer.slice(offset, offset_end), { validate: false });
  }

  getHashType() {
    const start = 8;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.getUint32(start + 4, true);
    return new DataView(this.view.buffer.slice(offset, offset_end)).getUint8(0);
  }

  getArgs() {
    const start = 12;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.byteLength;
    return new Bytes(this.view.buffer.slice(offset, offset_end), { validate: false });
  }
  toObject() {
    let obj={};
    obj["code_hash"]=this.getCodeHash().toObject();
    obj["hash_type"]=this.getHashType();
    obj["args"]=this.getArgs().toObject();
    return obj;
  }
}

export function SerializeScript(value) {
  if(typeof value === "object" && value !== null && "view" in value) return value.view.buffer;
  const buffers = [];
  buffers.push(SerializeByte32(value.code_hash));
  const hashTypeView = new DataView(new ArrayBuffer(1));
  hashTypeView.setUint8(0, fromStringEnum(value.hash_type));
  buffers.push(hashTypeView.buffer)
  buffers.push(SerializeBytes(value.args));
  return serializeTable(buffers);
}


export class ScriptOpt {
  constructor(reader, { validate = true } = {}) {
    this.view = new DataView(assertArrayBuffer(reader));
    if (validate) {
      this.validate();
    }
  }

  validate(compatible = false) {
    if (this.hasValue()) {
      this.value().validate(compatible);
    }
  }

  value() {
    return new Script(this.view.buffer, { validate: false });
  }

  toObject() {
    if(this.hasValue()) return this.value().toObject();
    return null;
  }
  hasValue() {
    return this.view.byteLength > 0;
  }
}

export function SerializeScriptOpt(value) {
  if(typeof value === "object" && value !== null && "view" in value) return value.view.buffer;
  if (value) {
    return SerializeScript(value);
  } else {
    return new ArrayBuffer(0);
  }
}


export class OutPoint {
  constructor(reader, { validate = true } = {}) {
    this.view = new DataView(assertArrayBuffer(reader));
    if (validate) {
      this.validate();
    }
  }

  getTxHash() {
    return new Byte32(this.view.buffer.slice(0, 0 + Byte32.size()), { validate: false });
  }

  getIndex() {
    return new Uint32(this.view.buffer.slice(0 + Byte32.size(), 0 + Byte32.size() + Uint32.size()), { validate: false });
  }

  validate(compatible = false) {
    assertDataLength(this.view.byteLength, OutPoint.size());
    this.getTxHash().validate(compatible);
    this.getIndex().validate(compatible);
  }
  static size() {
    return 0 + Byte32.size() + Uint32.size();
  }
  toObject() {
    let obj={};
    obj["tx_hash"]=this.getTxHash().toObject();
    obj["index"]=this.getIndex().toObject();
    return obj;
  }
}

export function SerializeOutPoint(value) {
  if(typeof value === "object" && value !== null && "view" in value) return value.view.buffer;
  const array = new Uint8Array(0 + Byte32.size() + Uint32.size());
  const view = new DataView(array.buffer);
  array.set(new Uint8Array(SerializeByte32(value.tx_hash)), 0);
  array.set(new Uint8Array(SerializeUint32(value.index)), 0 + Byte32.size());
  return array.buffer;
}


export class CellInput {
  constructor(reader, { validate = true } = {}) {
    this.view = new DataView(assertArrayBuffer(reader));
    if (validate) {
      this.validate();
    }
  }

  getSince() {
    return new Uint64(this.view.buffer.slice(0, 0 + Uint64.size()), { validate: false });
  }

  getPreviousOutput() {
    return new OutPoint(this.view.buffer.slice(0 + Uint64.size(), 0 + Uint64.size() + OutPoint.size()), { validate: false });
  }

  validate(compatible = false) {
    assertDataLength(this.view.byteLength, CellInput.size());
    this.getSince().validate(compatible);
    this.getPreviousOutput().validate(compatible);
  }
  static size() {
    return 0 + Uint64.size() + OutPoint.size();
  }
  toObject() {
    let obj={};
    obj["since"]=this.getSince().toObject();
    obj["previous_output"]=this.getPreviousOutput().toObject();
    return obj;
  }
}

export function SerializeCellInput(value) {
  if(typeof value === "object" && value !== null && "view" in value) return value.view.buffer;
  const array = new Uint8Array(0 + Uint64.size() + OutPoint.size());
  const view = new DataView(array.buffer);
  array.set(new Uint8Array(SerializeUint64(value.since)), 0);
  array.set(new Uint8Array(SerializeOutPoint(value.previous_output)), 0 + Uint64.size());
  return array.buffer;
}


export class CellInputVec {
  constructor(reader, { validate = true } = {}) {
    this.view = new DataView(assertArrayBuffer(reader));
    if (validate) {
      this.validate();
    }
  }

  validate(compatible = false) {
    if (this.view.byteLength < 4) {
      dataLengthError(this.view.byteLength, ">4");
    }
    const requiredByteLength = this.length() * CellInput.size() + 4;
    assertDataLength(this.view.byteLength, requiredByteLength);
    for (let i = 0; i < 0; i++) {
      const item = this.indexAt(i);
      item.validate(compatible);
    }
  }

  indexAt(i) {
    return new CellInput(this.view.buffer.slice(4 + i * CellInput.size(), 4 + (i + 1) * CellInput.size()), { validate: false });
  }

  toObject() {
    const len=this.length();
    var rv=[];
    for(var i=0;i<len;i++) {
      rv.push(this.indexAt(i).toObject());
    }
    return rv;
  }
  length() {
    return this.view.getUint32(0, true);
  }
}

export function SerializeCellInputVec(value) {
  if(typeof value === "object" && value !== null && "view" in value) return value.view.buffer;
  const array = new Uint8Array(4 + CellInput.size() * value.length);
  (new DataView(array.buffer)).setUint32(0, value.length, true);
  for (let i = 0; i < value.length; i++) {
    const itemBuffer = SerializeCellInput(value[i]);
    array.set(new Uint8Array(itemBuffer), 4 + i * CellInput.size());
  }
  return array.buffer;
}


export class CellOutput {
  constructor(reader, { validate = true } = {}) {
    this.view = new DataView(assertArrayBuffer(reader));
    if (validate) {
      this.validate();
    }
  }

  validate(compatible = false) {
    const offsets = verifyAndExtractOffsets(this.view, 0, true);
    new Uint64(this.view.buffer.slice(offsets[0], offsets[1]), { validate: false }).validate();
    new Script(this.view.buffer.slice(offsets[1], offsets[2]), { validate: false }).validate();
    new ScriptOpt(this.view.buffer.slice(offsets[2], offsets[3]), { validate: false }).validate();
  }

  getCapacity() {
    const start = 4;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.getUint32(start + 4, true);
    return new Uint64(this.view.buffer.slice(offset, offset_end), { validate: false });
  }

  getLock() {
    const start = 8;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.getUint32(start + 4, true);
    return new Script(this.view.buffer.slice(offset, offset_end), { validate: false });
  }

  getType() {
    const start = 12;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.byteLength;
    return new ScriptOpt(this.view.buffer.slice(offset, offset_end), { validate: false });
  }
  toObject() {
    let obj={};
    obj["capacity"]=this.getCapacity().toObject();
    obj["lock"]=this.getLock().toObject();
    obj["type_"]=this.getType().toObject();
    return obj;
  }
}

export function SerializeCellOutput(value) {
  if(typeof value === "object" && value !== null && "view" in value) return value.view.buffer;
  const buffers = [];
  buffers.push(SerializeUint64(value.capacity));
  buffers.push(SerializeScript(value.lock));
  buffers.push(SerializeScriptOpt(value.type_));
  return serializeTable(buffers);
}


export class CellOutputVec {
  constructor(reader, { validate = true } = {}) {
    this.view = new DataView(assertArrayBuffer(reader));
    if (validate) {
      this.validate();
    }
  }

  validate(compatible = false) {
    const offsets = verifyAndExtractOffsets(this.view, 0, true);
    for (let i = 0; i < offsets.length - 1; i++) {
      new CellOutput(this.view.buffer.slice(offsets[i], offsets[i + 1]), { validate: false }).validate();
    }
  }

  length() {
    if (this.view.byteLength < 8) {
      return 0;
    } else {
      return this.view.getUint32(4, true) / 4 - 1;
    }
  }

  indexAt(i) {
    const start = 4 + i * 4;
    const offset = this.view.getUint32(start, true);
    let offset_end = this.view.byteLength;
    if (i + 1 < this.length()) {
      offset_end = this.view.getUint32(start + 4, true);
    }
    return new CellOutput(this.view.buffer.slice(offset, offset_end), { validate: false });
  }
  toObject() {
    const len=this.length();
    var rv=[];
    for(var i=0;i<len;i++) {
      rv.push(this.indexAt(i).toObject());
    }
    return rv;
  }
}

export function SerializeCellOutputVec(value) {
  if(typeof value === "object" && value !== null && "view" in value) return value.view.buffer;
  return serializeTable(value.map(item => SerializeCellOutput(item)));
}


export class CellDep {
  constructor(reader, { validate = true } = {}) {
    this.view = new DataView(assertArrayBuffer(reader));
    if (validate) {
      this.validate();
    }
  }

  getOutPoint() {
    return new OutPoint(this.view.buffer.slice(0, 0 + OutPoint.size()), { validate: false });
  }

  getDepType() {
    return this.view.getUint8(0 + OutPoint.size());
  }

  validate(compatible = false) {
    assertDataLength(this.view.byteLength, CellDep.size());
    this.getOutPoint().validate(compatible);
  }
  static size() {
    return 0 + OutPoint.size() + 1;
  }
  toObject() {
    let obj={};
    obj["out_point"]=this.getOutPoint().toObject();
    obj["dep_type"]=this.getDepType();
    return obj;
  }
}

export function SerializeCellDep(value) {
  if(typeof value === "object" && value !== null && "view" in value) return value.view.buffer;
  const array = new Uint8Array(0 + OutPoint.size() + 1);
  const view = new DataView(array.buffer);
  array.set(new Uint8Array(SerializeOutPoint(value.out_point)), 0);
  view.setUint8(0 + OutPoint.size(), fromStringEnum(value.dep_type));
  return array.buffer;
}


export class CellDepVec {
  constructor(reader, { validate = true } = {}) {
    this.view = new DataView(assertArrayBuffer(reader));
    if (validate) {
      this.validate();
    }
  }

  validate(compatible = false) {
    if (this.view.byteLength < 4) {
      dataLengthError(this.view.byteLength, ">4");
    }
    const requiredByteLength = this.length() * CellDep.size() + 4;
    assertDataLength(this.view.byteLength, requiredByteLength);
    for (let i = 0; i < 0; i++) {
      const item = this.indexAt(i);
      item.validate(compatible);
    }
  }

  indexAt(i) {
    return new CellDep(this.view.buffer.slice(4 + i * CellDep.size(), 4 + (i + 1) * CellDep.size()), { validate: false });
  }

  toObject() {
    const len=this.length();
    var rv=[];
    for(var i=0;i<len;i++) {
      rv.push(this.indexAt(i).toObject());
    }
    return rv;
  }
  length() {
    return this.view.getUint32(0, true);
  }
}

export function SerializeCellDepVec(value) {
  if(typeof value === "object" && value !== null && "view" in value) return value.view.buffer;
  const array = new Uint8Array(4 + CellDep.size() * value.length);
  (new DataView(array.buffer)).setUint32(0, value.length, true);
  for (let i = 0; i < value.length; i++) {
    const itemBuffer = SerializeCellDep(value[i]);
    array.set(new Uint8Array(itemBuffer), 4 + i * CellDep.size());
  }
  return array.buffer;
}


export class RawTransaction {
  constructor(reader, { validate = true } = {}) {
    this.view = new DataView(assertArrayBuffer(reader));
    if (validate) {
      this.validate();
    }
  }

  validate(compatible = false) {
    const offsets = verifyAndExtractOffsets(this.view, 0, true);
    new Uint32(this.view.buffer.slice(offsets[0], offsets[1]), { validate: false }).validate();
    new CellDepVec(this.view.buffer.slice(offsets[1], offsets[2]), { validate: false }).validate();
    new Byte32Vec(this.view.buffer.slice(offsets[2], offsets[3]), { validate: false }).validate();
    new CellInputVec(this.view.buffer.slice(offsets[3], offsets[4]), { validate: false }).validate();
    new CellOutputVec(this.view.buffer.slice(offsets[4], offsets[5]), { validate: false }).validate();
    new BytesVec(this.view.buffer.slice(offsets[5], offsets[6]), { validate: false }).validate();
  }

  getVersion() {
    const start = 4;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.getUint32(start + 4, true);
    return new Uint32(this.view.buffer.slice(offset, offset_end), { validate: false });
  }

  getCellDeps() {
    const start = 8;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.getUint32(start + 4, true);
    return new CellDepVec(this.view.buffer.slice(offset, offset_end), { validate: false });
  }

  getHeaderDeps() {
    const start = 12;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.getUint32(start + 4, true);
    return new Byte32Vec(this.view.buffer.slice(offset, offset_end), { validate: false });
  }

  getInputs() {
    const start = 16;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.getUint32(start + 4, true);
    return new CellInputVec(this.view.buffer.slice(offset, offset_end), { validate: false });
  }

  getOutputs() {
    const start = 20;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.getUint32(start + 4, true);
    return new CellOutputVec(this.view.buffer.slice(offset, offset_end), { validate: false });
  }

  getOutputsData() {
    const start = 24;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.byteLength;
    return new BytesVec(this.view.buffer.slice(offset, offset_end), { validate: false });
  }
  toObject() {
    let obj={};
    obj["version"]=this.getVersion().toObject();
    obj["cell_deps"]=this.getCellDeps().toObject();
    obj["header_deps"]=this.getHeaderDeps().toObject();
    obj["inputs"]=this.getInputs().toObject();
    obj["outputs"]=this.getOutputs().toObject();
    obj["outputs_data"]=this.getOutputsData().toObject();
    return obj;
  }
}

export function SerializeRawTransaction(value) {
  if(typeof value === "object" && value !== null && "view" in value) return value.view.buffer;
  const buffers = [];
  buffers.push(SerializeUint32(value.version));
  buffers.push(SerializeCellDepVec(value.cell_deps));
  buffers.push(SerializeByte32Vec(value.header_deps));
  buffers.push(SerializeCellInputVec(value.inputs));
  buffers.push(SerializeCellOutputVec(value.outputs));
  buffers.push(SerializeBytesVec(value.outputs_data));
  return serializeTable(buffers);
}


export class Transaction {
  constructor(reader, { validate = true } = {}) {
    this.view = new DataView(assertArrayBuffer(reader));
    if (validate) {
      this.validate();
    }
  }

  validate(compatible = false) {
    const offsets = verifyAndExtractOffsets(this.view, 0, true);
    new RawTransaction(this.view.buffer.slice(offsets[0], offsets[1]), { validate: false }).validate();
    new BytesVec(this.view.buffer.slice(offsets[1], offsets[2]), { validate: false }).validate();
  }

  getRaw() {
    const start = 4;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.getUint32(start + 4, true);
    return new RawTransaction(this.view.buffer.slice(offset, offset_end), { validate: false });
  }

  getWitnesses() {
    const start = 8;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.byteLength;
    return new BytesVec(this.view.buffer.slice(offset, offset_end), { validate: false });
  }
  toObject() {
    let obj={};
    obj["raw"]=this.getRaw().toObject();
    obj["witnesses"]=this.getWitnesses().toObject();
    return obj;
  }
}

export function SerializeTransaction(value) {
  if(typeof value === "object" && value !== null && "view" in value) return value.view.buffer;
  const buffers = [];
  buffers.push(SerializeRawTransaction(value.raw));
  buffers.push(SerializeBytesVec(value.witnesses));
  return serializeTable(buffers);
}


export class WitnessArgs {
  constructor(reader, { validate = true } = {}) {
    this.view = new DataView(assertArrayBuffer(reader));
    if (validate) {
      this.validate();
    }
  }

  validate(compatible = false) {
    const offsets = verifyAndExtractOffsets(this.view, 0, true);
    new BytesOpt(this.view.buffer.slice(offsets[0], offsets[1]), { validate: false }).validate();
    new BytesOpt(this.view.buffer.slice(offsets[1], offsets[2]), { validate: false }).validate();
    new BytesOpt(this.view.buffer.slice(offsets[2], offsets[3]), { validate: false }).validate();
  }

  getLock() {
    const start = 4;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.getUint32(start + 4, true);
    return new BytesOpt(this.view.buffer.slice(offset, offset_end), { validate: false });
  }

  getInputType() {
    const start = 8;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.getUint32(start + 4, true);
    return new BytesOpt(this.view.buffer.slice(offset, offset_end), { validate: false });
  }

  getOutputType() {
    const start = 12;
    const offset = this.view.getUint32(start, true);
    const offset_end = this.view.byteLength;
    return new BytesOpt(this.view.buffer.slice(offset, offset_end), { validate: false });
  }
  toObject() {
    let obj={};
    obj["lock"]=this.getLock().toObject();
    obj["input_type"]=this.getInputType().toObject();
    obj["output_type"]=this.getOutputType().toObject();
    return obj;
  }
}

export function SerializeWitnessArgs(value) {
  if(typeof value === "object" && value !== null && "view" in value) return value.view.buffer;
  const buffers = [];
  buffers.push(SerializeBytesOpt(value.lock));
  buffers.push(SerializeBytesOpt(value.input_type));
  buffers.push(SerializeBytesOpt(value.output_type));
  return serializeTable(buffers);
}

