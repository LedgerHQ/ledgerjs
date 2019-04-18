//@flow

export function RecordStoreInvalidSynthax(message: string) {
  this.name = "RecordStoreInvalidSynthax";
  this.message = message;
  this.stack = new Error().stack;
}
//$FlowFixMe
RecordStoreInvalidSynthax.prototype = new Error();

export function RecordStoreQueueEmpty() {
  this.name = "RecordStoreQueueEmpty";
  this.message = "EOF: no more APDU to replay";
  this.stack = new Error().stack;
}
//$FlowFixMe
RecordStoreQueueEmpty.prototype = new Error();

export function RecordStoreWrongAPDU(expected: string, got: string) {
  this.name = "RecordStoreWrongAPDU";
  this.message = `wrong apdu to replay. Expected ${expected}, Got ${got}`;
  this.expectedAPDU = expected;
  this.gotAPDU = got;
  this.stack = new Error().stack;
}
//$FlowFixMe
RecordStoreWrongAPDU.prototype = new Error();

export function RecordStoreRemainingAPDU(expected: string) {
  this.name = "RecordStoreRemainingAPDU";
  this.message = `replay expected more APDUs to come:\n${expected}`;
  this.stack = new Error().stack;
}
//$FlowFixMe
RecordStoreRemainingAPDU.prototype = new Error();

export type Queue = [string, string][];

export class RecordStore {
  queue: Queue;

  constructor(queue?: ?Queue) {
    this.queue = queue || [];
  }

  isEmpty = () => this.queue.length === 0;

  recordExchange(apdu: Buffer, out: Buffer) {
    this.queue.push([apdu.toString("hex"), out.toString("hex")]);
  }

  replayExchange(apdu: Buffer): Buffer {
    const { queue } = this;
    if (queue.length === 0) {
      throw new RecordStoreQueueEmpty();
    }
    const [head, ...tail] = queue;
    const apduHex = apdu.toString("hex");
    if (apduHex !== head[0]) {
      throw new RecordStoreWrongAPDU(head[0], apduHex);
    }
    this.queue = tail;
    return Buffer.from(head[1], "hex");
  }

  ensureQueueEmpty() {
    if (!this.isEmpty()) {
      throw new RecordStoreRemainingAPDU(this.toString());
    }
  }

  toString(): string {
    return (
      this.queue
        .map(([send, receive]) => `=> ${send}\n<= ${receive}`)
        .join("\n") + "\n"
    );
  }

  static fromString(str: string): RecordStore {
    const queue: Queue = [];
    let value = [];
    str
      .split("\n")
      .map(line => line.replace(/ /g, ""))
      .filter(o => o)
      .forEach(line => {
        if (value.length === 0) {
          const m = line.match(/^=> ([0-9a-fA-F]+)$/);
          if (!m) {
            throw new RecordStoreInvalidSynthax("expected an apdu input");
          }
          value.push(m[1]);
        } else {
          const m = line.match(/^<= ([0-9a-fA-F]+)$/);
          if (!m) {
            throw new RecordStoreInvalidSynthax("expected an apdu output");
          }
          value.push(m[1]);
          queue.push([value[0], value[1]]);
          value = [];
        }
      });
    if (value.length !== 0) {
      throw new RecordStoreInvalidSynthax("unexpected end of file");
    }
    return new RecordStore(queue);
  }
}
