//@flow
import Transport from "@ledgerhq/hw-transport";
import type RecordStore from "./RecordStore";
export default (
  DecoratedTransport: Class<Transport<*>>,
  recordStore: RecordStore
): Class<Transport<*>> => {
  class TransportRecorder extends Transport<*> {
    static isSupported = DecoratedTransport.isSupported;
    static list = DecoratedTransport.list;
    static listen = DecoratedTransport.listen;
    static open = (...args) =>
      DecoratedTransport.open(...args).then(t => new TransportRecorder(t));
    setScrambleKey() {}
    close() {
      return this.transport.close();
    }
    transport: Transport<*>;
    constructor(t) {
      super();
      this.transport = t;
    }
    exchange(apdu: Buffer): Promise<Buffer> {
      const output = this.transport.exchange(apdu);
      output.then(out => {
        recordStore.recordExchange(apdu, out);
      });
      return output;
    }
  }
  return TransportRecorder;
};
