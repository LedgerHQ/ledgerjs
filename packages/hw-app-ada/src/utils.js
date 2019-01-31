//@flow
import basex from "base-x";

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const bs58 = basex(BASE58_ALPHABET);

const HARDENED = 0x80000000;

// We use bs10 as an easy way to parse/encode amount strings
const bs10 = basex("0123456789");

// Max supply in lovelace
const MAX_LOVELACE_SUPPLY_STR = ["45", "000", "000", "000", "000000"].join("");

export const Precondition = {
  // Generic check
  check: (cond: boolean) => {
    if (!cond) throw new Error("Precondition failed");
  },
  // Basic types
  checkIsString: (data: any) => {
    Precondition.check(typeof data === "string");
  },
  checkIsInteger: (data: any) => {
    Precondition.check(Number.isInteger(data));
  },
  checkIsArray: (data: any) => {
    Precondition.check(Array.isArray(data));
  },
  checkIsBuffer: (data: any) => {
    Precondition.check(Buffer.isBuffer(data));
  },

  // Extended checks
  checkIsUint32: (data: any) => {
    Precondition.checkIsInteger(data);
    Precondition.check(data >= 0);
    Precondition.check(data <= 4294967295);
  },
  checkIsUint8: (data: any) => {
    Precondition.checkIsInteger(data);
    Precondition.check(data >= 0);
    Precondition.check(data <= 255);
  },

  checkIsHexString: (data: any) => {
    Precondition.checkIsString(data);
    Precondition.check(data.length % 2 == 0);
    Precondition.check(/^[0-9a-fA-F]*$/.test(data));
  },
  checkIsValidPath: (path: Array<number>) => {
    Precondition.checkIsArray(path);
    for (const x of path) {
      Precondition.checkIsUint32(x);
    }
  },
  checkIsValidAmount: (amount: string) => {
    Precondition.checkIsString(amount);
    Precondition.check(/^[0-9]*$/.test(amount));
    // Length checks
    Precondition.check(amount.length > 0);
    Precondition.check(amount.length <= MAX_LOVELACE_SUPPLY_STR.length);
    // Leading zeros
    if (amount.length > 1) {
      Precondition.check(amount[0] != "0");
    }
    // less than max supply
    if (amount.length == MAX_LOVELACE_SUPPLY_STR.length) {
      // Note: this is string comparison!
      Precondition.check(amount <= MAX_LOVELACE_SUPPLY_STR);
    }
  },
  checkIsValidBase58: (data: string) => {
    Precondition.checkIsString(data);
    for (const c of data) {
      Precondition.check(BASE58_ALPHABET.includes(c));
    }
  }
};

export const Assert = {
  assert: (cond: boolean) => {
    if (!cond) throw new Error("Assertion failed");
  }
};

export function uint32_to_buf(value: number): Buffer {
  Precondition.checkIsUint32(value);

  const data = Buffer.alloc(4);
  data.writeUInt32BE(value, 0);
  return data;
}

export function buf_to_uint32(data: Buffer): number {
  Precondition.check(data.length == 4);

  return data.readUIntBE(0, 4);
}

export function uint8_to_buf(value: number): Buffer {
  Precondition.checkIsUint8(value);

  const data = Buffer.alloc(1);
  data.writeUInt8(value, 0);
  return data;
}

export function hex_to_buf(data: string): Buffer {
  Precondition.checkIsHexString(data);
  return Buffer.from(data, "hex");
}

export function buf_to_hex(data: Buffer): string {
  return data.toString("hex");
}

// no buf_to_uint8

export function path_to_buf(path: Array<number>): Buffer {
  Precondition.checkIsValidPath(path);

  const data = Buffer.alloc(1 + 4 * path.length);
  data.writeUInt8(path.length, 0);

  for (let i = 0; i < path.length; i++) {
    data.writeUInt32BE(path[i], 1 + i * 4);
  }
  return data;
}

const sum = (arr: Array<number>) => arr.reduce((x, y) => x + y, 0);

export function chunkBy(data: Buffer, chunkLengths: Array<number>) {
  Precondition.checkIsBuffer(data);
  Precondition.checkIsArray(chunkLengths);
  for (const len of chunkLengths) {
    Precondition.checkIsInteger(len);
    Precondition.check(len > 0);
  }
  Precondition.check(data.length <= sum(chunkLengths));

  let offset = 0;
  const result = [];

  const restLength = data.length - sum(chunkLengths);

  for (let c of [...chunkLengths, restLength]) {
    result.push(data.slice(offset, offset + c));

    offset += c;
  }

  return result;
}

export function stripRetcodeFromResponse(response: Buffer): Buffer {
  Precondition.checkIsBuffer(response);
  Precondition.check(response.length >= 2);

  const L = response.length - 2;
  const retcode = response.slice(L, L + 2);

  if (retcode.toString("hex") != "9000")
    throw new Error(`Invalid retcode ${retcode.toString("hex")}`);
  return response.slice(0, L);
}

export function buf_to_amount(data: Buffer): string {
  Precondition.checkIsBuffer(data);
  Precondition.check(data.length == 8);

  const encoded = bs10.encode(data);
  // Strip leading zeros
  return encoded.replace(/^0*(.)/, "$1");
}

export function amount_to_buf(amount: string): Buffer {
  Precondition.checkIsValidAmount(amount);

  const data = bs10.decode(amount);
  // Amount should fit uin64_t
  Assert.assert(data.length <= 8);

  const padding = Buffer.alloc(8 - data.length);
  return Buffer.concat([padding, data]);
}

export function base58_encode(data: Buffer): string {
  Precondition.checkIsBuffer(data);

  return bs58.encode(data);
}

export function base58_decode(data: string): Buffer {
  Precondition.checkIsValidBase58(data);

  return bs58.decode(data);
}

function safe_parseInt(str: string): number {
  Precondition.checkIsString(str);
  const i = parseInt(str);
  // Check that we parsed everything
  Precondition.check("" + i == str);
  // Could be invalid
  Precondition.check(!isNaN(i));
  // Could still be float
  Precondition.checkIsInteger(i);
  return i;
}

function parseBIP32Index(str: string): number {
  let base = 0;
  if (str.endsWith("'")) {
    str = str.slice(0, -1);
    base = HARDENED;
  }
  const i = safe_parseInt(str);
  Precondition.check(i >= 0);
  Precondition.check(i < HARDENED);
  return base + i;
}

export function str_to_path(data: string): Array<number> {
  Precondition.checkIsString(data);
  Precondition.check(data.length > 0);

  return data.split("/").map(parseBIP32Index);
}

export default {
  HARDENED,

  hex_to_buf,
  buf_to_hex,

  uint32_to_buf,
  buf_to_uint32,

  // no pair for now
  uint8_to_buf,

  // no pair for now
  path_to_buf,

  amount_to_buf,
  buf_to_amount,

  base58_encode,
  base58_decode,

  chunkBy,
  stripRetcodeFromResponse,

  str_to_path
};
