//@flow

export default class RecordStore {
  cache: { [_: string]: string } = {};

  recordExchange(apdu: Buffer, out: Buffer) {
    const { cache } = this;
    const apduHex = apdu.toString("hex");
    const outHex = out.toString("hex");
    if (apduHex in cache && cache[apduHex] !== outHex) {
      console.warn(
        "Found 2 same APDUs with different result. this can lead to mock issues.\nAPDU=" +
          apduHex
      );
    }
    cache[apduHex] = outHex;
  }

  reverseExchange(apdu: Buffer): Buffer {
    const { cache } = this;
    const apduHex = apdu.toString("hex");
    if (!(apduHex in cache)) {
      throw new Error("RecordStore missing cache for apdu=" + apduHex);
    }
    return Buffer.from(cache[apduHex], "hex");
  }

  toObject(): Object {
    const { cache } = this;
    return { cache };
  }

  static fromObject(obj: Object): RecordStore {
    const recordStore = new RecordStore();
    if (!obj.cache) {
      throw new Error("invalid json provided to RecordStore");
    }
    recordStore.cache = obj.cache;
    return recordStore;
  }
}
