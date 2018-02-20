//@flow
import Transport from "@ledgerhq/hw-transport";
import type RecordStore from "./RecordStore";

export default (recordStore: RecordStore): Class<Transport<*>> => {
  class TransportReplayer extends Transport<*> {
    static isSupported = () => Promise.resolve(true);
    static list = () => Promise.resolve([null]);
    static listen = o => {
      let unsubscribed;
      setTimeout(() => {
        if (unsubscribed) return;
        o.next({ type: "add", descriptor: null });
        o.complete();
      }, 0);
      return {
        unsubscribe: () => {
          unsubscribed = true;
        }
      };
    };
    static open = () => Promise.resolve(new TransportReplayer());

    setScrambleKey() {}

    close() {
      return Promise.resolve();
    }

    exchange(apdu: Buffer): Promise<Buffer> {
      if (this.debug) {
        console.log("=> " + apdu.toString("hex"));
      }
      try {
        const buffer = recordStore.reverseExchange(apdu);
        if (this.debug) console.error("<= " + buffer.toString("hex"));
        return Promise.resolve(buffer);
      } catch (e) {
        if (this.debug) console.error("<= " + e);
        return Promise.reject(e);
      }
    }
  }
  return TransportReplayer;
};
