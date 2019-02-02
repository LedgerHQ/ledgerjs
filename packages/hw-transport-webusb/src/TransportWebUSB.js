//@flow
import Transport from "@ledgerhq/hw-transport";
import type {
  Observer,
  DescriptorEvent,
  Subscription
} from "@ledgerhq/hw-transport";
import hidFraming from "@ledgerhq/devices/lib/hid-framing";
import { identifyUSBProductId } from "@ledgerhq/devices";
import { getLedgerDevices, requestLedgerDevice, isSupported } from "./webusb";

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
  channel = Math.floor(Math.random() * 0xffff);
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
        const deviceInfo = identifyUSBProductId(device.productId);
        observer.next({ type: "add", descriptor: device, deviceInfo });
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
    await this.exchangeBusyPromise;
    await this.device.releaseInterface(interfaceNumber);
    await this.device.reset();
    await this.device.close();
  }

  exchange = (apdu: Buffer): Promise<Buffer> =>
    this.exchangeAtomicImpl(async () => {
      const { debug, channel, packetSize } = this;
      if (debug) {
        debug("=>" + apdu.toString("hex"));
      }

      const framing = hidFraming(channel, packetSize);

      // Write...
      const blocks = framing.makeBlocks(apdu);
      for (let i = 0; i < blocks.length; i++) {
        await this.device.transferOut(endpointNumber, blocks[i]);
      }

      // Read...
      let result;
      let acc;
      while (!(result = framing.getReducedResult(acc))) {
        const r = await this.device.transferIn(endpointNumber, packetSize);
        acc = framing.reduceResponse(acc, Buffer.from(r.data.buffer));
      }

      if (debug) {
        debug("<=" + result.toString("hex"));
      }
      return result;
    });

  setScrambleKey() {}
}
