//@flow
import Transport, { TransportError } from "@ledgerhq/hw-transport";
import type {
  Observer,
  DescriptorEvent,
  Subscription
} from "@ledgerhq/hw-transport";
import { getLedgerDevices, requestLedgerDevice, isSupported } from "./webusb";
import { ledgerWrap, ledgerUnwrap } from "./hid-wrap";

const configurationValue = 1;
const interfaceNumber = 2;
const endpointNumber = 3;

/**
 * WebUSB Transport implementation
 * @example
 * import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
 * ...
 * TransportWebUSB.create().then(transport => ...)
 */
export default class TransportWebUSB extends Transport<USBDevice> {
  device: USBDevice;
  channel = 0x0101;
  packetSize = 64;

  constructor(device: USBDevice) {
    super();
    this.device = device;
  }

  static isSupported = isSupported;

  static list = getLedgerDevices;

  static listen = (
    observer: Observer<DescriptorEvent<USBDevice>>
  ): Subscription => {
    let unsubscribed = false;
    requestLedgerDevice().then(device => {
      if (!unsubscribed) {
        observer.next({ type: "add", descriptor: device, device });
        observer.complete();
      }
    });
    function unsubscribe() {
      unsubscribed = true;
    }
    return { unsubscribe };
  };

  static async open(device: USBDevice) {
    await device.open();
    if (device.configuration === null) {
      await device.selectConfiguration(configurationValue);
    }
    await device.reset();
    await device.claimInterface(interfaceNumber);
    return new TransportWebUSB(device);
  }

  async close(): Promise<void> {
    await this.device.releaseInterface(interfaceNumber);
    await this.device.reset();
    await this.device.close();
  }

  exchange = (apdu: Buffer): Promise<Buffer> =>
    this.atomic(async () => {
      const { debug, channel, packetSize } = this;
      if (debug) {
        debug("=>" + apdu.toString("hex"));
      }

      // Write...
      const dataToSend = ledgerWrap(channel, apdu, packetSize);
      let offsetSent = 0;
      while (offsetSent < dataToSend.length) {
        const blockSize =
          dataToSend.length - offsetSent > packetSize
            ? packetSize
            : dataToSend.length - offsetSent;
        let block = dataToSend.slice(offsetSent, offsetSent + blockSize);
        const paddingSize = packetSize - block.length;
        if (paddingSize !== 0) {
          let padding = Buffer.alloc(paddingSize).fill(0);
          block = Buffer.concat([block, padding], block.length + paddingSize);
        }
        await this.device.transferOut(endpointNumber, block);
        offsetSent += blockSize;
      }

      // Read...
      let response;
      let received = Buffer.alloc(0);
      while (!response) {
        const res = await this.device.transferIn(endpointNumber, 64);
        const buffer = Buffer.from(res.data.buffer);
        received = Buffer.concat(
          [received, buffer],
          received.length + buffer.length
        );
        response = ledgerUnwrap(channel, received, packetSize);
      }

      if (debug) {
        debug("<=" + response.toString("hex"));
      }
      return response;
    });

  setScrambleKey() {}

  busy: ?Promise<void>;

  atomic = async f => {
    if (this.busy) {
      throw new TransportError("Transport race condition", "RaceCondition");
    }
    let resolveBusy;
    const busyPromise = new Promise(r => {
      resolveBusy = r;
    });
    this.busy = busyPromise;
    try {
      const res = await f();
      return res;
    } finally {
      if (resolveBusy) resolveBusy();
      this.busy = null;
    }
  };
}
