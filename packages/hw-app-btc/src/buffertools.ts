import varuint from "varuint-bitcoin"

export class BufferWriter {
  private bufs: Buffer[] = [];

  write(alloc: number, fn: (b: Buffer) => void) {
    const b = Buffer.alloc(alloc);
    fn(b)
    this.bufs.push(b);
  }

  writeUInt8(i: number): void {
    this.write(1, (b) => b.writeUInt8(i, 0));
  }

  writeInt32(i: number): void {
    this.write(4, (b) => b.writeInt32LE(i, 0));
  }

  writeUInt32(i: number): void {
    this.write(4, (b) => b.writeUInt32LE(i, 0));
  }

  writeVarInt(i: number): void {
    this.bufs.push(varuint.encode(i));
  }

  writeSlice(slice: Buffer): void {
    this.bufs.push(Buffer.from(slice));
  }

  writeVarSlice(slice: Buffer): void {    
    this.writeVarInt(slice.length);
    this.writeSlice(slice);
  }

  buffer(): Buffer {
    return Buffer.concat(this.bufs);
  }
}

export class BufferReader {
  constructor(public buffer: Buffer, public offset: number = 0) {
  }

  readUInt8(): number {
    const result = this.buffer.readUInt8(this.offset);
    this.offset++;
    return result;
  }

  readInt32(): number {
    const result = this.buffer.readInt32LE(this.offset);
    this.offset += 4;
    return result;
  }

  readUInt32(): number {
    const result = this.buffer.readUInt32LE(this.offset);
    this.offset += 4;
    return result;
  }

  readVarInt(): number {
    const vi = varuint.decode(this.buffer, this.offset);
    this.offset += varuint.decode.bytes;
    return vi;
  }

  readSlice(n: number): Buffer {
    if (this.buffer.length < this.offset + n) {
      throw new Error('Cannot read slice out of bounds');
    }
    const result = this.buffer.slice(this.offset, this.offset + n);
    this.offset += n;
    return result;
  }

  readVarSlice(): Buffer {
    return this.readSlice(this.readVarInt());
  }

  readVector(): Buffer[] {
    const count = this.readVarInt();
    const vector: Buffer[] = [];
    for (let i = 0; i < count; i++) vector.push(this.readVarSlice());
    return vector;
  }
}
