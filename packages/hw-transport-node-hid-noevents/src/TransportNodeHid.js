//@flow

import HID from "node-hid";
import Transport from "@ledgerhq/hw-transport";
import { log } from "@ledgerhq/logs";
import type {
  Observer,
  DescriptorEvent,
  Subscription,
} from "@ledgerhq/hw-transport";
import { ledgerUSBVendorId } from "@ledgerhq/devices";
import hidFraming from "@ledgerhq/devices/lib/hid-framing";
import { identifyUSBProductId, identifyProductName } from "@ledgerhq/devices";
import type { DeviceModel } from "@ledgerhq/devices";
import { TransportError, DisconnectedDevice } from "@ledgerhq/errors";

const filterInterface = (device) =>
  ["win32", "darwin"].includes(process.platform)
    ? // $FlowFixMe
      device.usagePage === 0xffa0
    : device.interface === 0;

export function getDevices(): Array<*> {
  // $FlowFixMe
  return HID.devices(ledgerUSBVendorId, 0x0).filter(filterInterface);
}

const isDisconnectedError = (e) =>
  e && e.message && e.message.indexOf("HID") >= 0;

/**
 * node-hid Transport minimal implementation
 * @example
 * import TransportNodeHid from "@ledgerhq/hw-transport-node-hid-noevents";
 * ...
 * TransportNodeHid.create().then(transport => ...)
 */
export default class TransportNodeHidNoEvents extends Transport<?string> {
  /**
   *
   */
  static isSupported = (): Promise<boolean> =>
    Promise.resolve(typeof HID.HID === "function");

  /**
   *
   */
  static list = (): Promise<(?string)[]> =>
    Promise.resolve(getDevices().map((d) => d.path));

  /**
   */
  static listen = (
    observer: Observer<DescriptorEvent<?string>>
  ): Subscription => {
    getDevices().forEach((device) => {
      const deviceModel = identifyUSBProductId(device.productId);
      observer.next({
        type: "add",
        descriptor: device.path,
        deviceModel,
        device,
      });
    });
    observer.complete();
    return { unsubscribe: () => {} };
  };

  /**
   * if path="" is not provided, the library will take the first device
   */
  static open(path: ?string) {
    return Promise.resolve().then(() => {
      if (path) {
        return new TransportNodeHidNoEvents(new HID.HID(path));
      }
      const device = getDevices()[0];
      if (!device) throw new TransportError("NoDevice", "NoDevice");
      return new TransportNodeHidNoEvents(new HID.HID(device.path));
    });
  }

  device: HID.HID;
  deviceModel: ?DeviceModel;

  channel = Math.floor(Math.random() * 0xffff);
  packetSize = 64;
  disconnected = false;

  constructor(device: HID.HID) {
    super();
    this.device = device;
    // $FlowFixMe
    const info = device.getDeviceInfo();
    this.deviceModel =
      info && info.product ? identifyProductName(info.product) : null;
  }

  setDisconnected = () => {
    if (!this.disconnected) {
      this.emit("disconnect");
      this.disconnected = true;
    }
  };

  writeHID = (content: Buffer): Promise<void> => {
    const data = [0x00];
    for (let i = 0; i < content.length; i++) {
      data.push(content[i]);
    }
    try {
      this.device.write(data);
      return Promise.resolve();
    } catch (e) {
      if (isDisconnectedError(e)) {
        this.setDisconnected();
        return Promise.reject(new DisconnectedDevice(e.message));
      }
      return Promise.reject(e);
    }
  };

  readHID = (): Promise<Buffer> =>
    new Promise((resolve, reject) =>
      this.device.read((e, res) => {
        if (!res) {
          return reject(new DisconnectedDevice());
        }
        if (e) {
          if (isDisconnectedError(e)) {
            this.setDisconnected();
            return reject(new DisconnectedDevice(e.message));
          }
          reject(e);
        } else {
          const buffer = Buffer.from(res);
          resolve(buffer);
        }
      })
    );

  /**
   * Exchange with the device using APDU protocol.
   * @param apdu
   * @returns a promise of apdu response
   */
  exchange = (apdu: Buffer): Promise<Buffer> =>
    this.exchangeAtomicImpl(async () => {
      const { channel, packetSize } = this;
      log("apdu", "=> " + apdu.toString("hex"));

      const framing = hidFraming(channel, packetSize);

      // Write...
      const blocks = framing.makeBlocks(apdu);
      for (let i = 0; i < blocks.length; i++) {
        await this.writeHID(blocks[i]);
      }

      // Read...
      let result;
      let acc;
      while (!(result = framing.getReducedResult(acc))) {
        const buffer = await this.readHID();
        acc = framing.reduceResponse(acc, buffer);
      }

      log("apdu", "<= " + result.toString("hex"));
      return result;
    });

  setScrambleKey() {}

  /**
   * release the USB device.
   */
  async close(): Promise<void> {
    await this.exchangeBusyPromise;
    this.device.close();
  }
}
