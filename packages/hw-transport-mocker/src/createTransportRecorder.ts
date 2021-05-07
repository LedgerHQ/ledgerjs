import { Class } from "utility-types";
import Transport from "@ledgerhq/hw-transport";
import type { RecordStore } from "./RecordStore";

/**
 * decorate a real transport and proxy it to record the APDUs.
 * @param {Class<Transport<*>>} DecoratedTransport: an actual transport class. Like @ledgerhq/hw-transport-webusb
 * @param {RecordStore} recordStore: a record store to record the apdu in.
 */
const createTransportRecorder = (
  DecoratedTransport: Class<Transport<any>>,
  recordStore: RecordStore
): Class<Transport<any>> => {
  class TransportRecorder extends Transport<any> {
    static recordStore = recordStore;
    static isSupported = DecoratedTransport.isSupported;
    static list = DecoratedTransport.list;
    static listen = DecoratedTransport.listen;
    static open = (...args) =>
      DecoratedTransport.open(...args).then((t) => new TransportRecorder(t));

    setScrambleKey() {}

    close() {
      return this.transport.close();
    }

    transport: Transport<any>;

    constructor(t) {
      super();
      this.transport = t;
    }

    exchange(apdu: Buffer): Promise<Buffer> {
      const output = this.transport.exchange(apdu);
      output.then((out) => {
        recordStore.recordExchange(apdu, out);
      });
      return output;
    }
  }

  return TransportRecorder;
};

export default createTransportRecorder;
