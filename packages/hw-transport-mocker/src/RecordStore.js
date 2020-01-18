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

export function RecordStoreWrongAPDU(
  expected: string,
  got: string,
  line: number
) {
  this.name = "RecordStoreWrongAPDU";
  this.message = `wrong apdu to replay line ${line}. Expected ${expected}, Got ${got}`;
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

export type RecordStoreOptions = {
  // smart mechanism that would skip an apdu un-recognize to the next one that does
  // this is meant to be used when you have refactored/dropped some APDUs
  // it will produces console warnings for you to fix the APDUs queue
  autoSkipUnknownApdu: boolean,
  warning: string => void
};

const defaultOpts: RecordStoreOptions = {
  autoSkipUnknownApdu: false,
  warning: log => console.warn(log)
};

export class RecordStore {
  passed = 0;
  queue: Queue;
  opts: RecordStoreOptions;

  constructor(queue?: ?Queue, opts?: $Shape<RecordStoreOptions>) {
    this.queue = queue || [];
    this.opts = { ...defaultOpts, ...opts };
  }

  isEmpty = () => this.queue.length === 0;

  recordExchange(apdu: Buffer, out: Buffer) {
    this.queue.push([apdu.toString("hex"), out.toString("hex")]);
  }

  replayExchange(apdu: Buffer): Buffer {
    const { queue, opts } = this;
    const apduHex = apdu.toString("hex");
    for (let i = 0; i < queue.length; i++) {
      const head = queue[i];
      const line = 2 * (this.passed + i);
      if (apduHex === head[0]) {
        ++this.passed;
        this.queue = queue.slice(i + 1);
        return Buffer.from(head[1], "hex");
      } else {
        if (opts.autoSkipUnknownApdu) {
          opts.warning(
            "skipped unmatched apdu (line " +
              line +
              " – expected " +
              head[0] +
              ")"
          );
          ++this.passed;
        } else {
          throw new RecordStoreWrongAPDU(head[0], apduHex, line);
        }
      }
    }
    this.queue = [];
    throw new RecordStoreQueueEmpty();
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

  static fromString(
    str: string,
    opts?: $Shape<RecordStoreOptions>
  ): RecordStore {
    const queue: Queue = [];
    let value = [];
    str
      .split("\n")
      .map(line => line.replace(/ /g, ""))
      .filter(o => o)
      .forEach(line => {
        if (value.length === 0) {
          const m = line.match(/^=>([0-9a-fA-F]+)$/);
          if (!m) {
            throw new RecordStoreInvalidSynthax("expected an apdu input");
          }
          value.push(m[1]);
        } else {
          const m = line.match(/^<=([0-9a-fA-F]+)$/);
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
    return new RecordStore(queue, opts);
  }
}
