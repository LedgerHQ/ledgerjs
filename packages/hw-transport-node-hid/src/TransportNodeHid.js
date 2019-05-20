//@flow

import HID from "node-hid";
import Transport from "@ledgerhq/hw-transport";
import type {
  Observer,
  DescriptorEvent,
  Subscription
} from "@ledgerhq/hw-transport";
import hidFraming from "@ledgerhq/devices/lib/hid-framing";
import { identifyUSBProductId } from "@ledgerhq/devices";
import type { DeviceModel } from "@ledgerhq/devices";
import { TransportError, DisconnectedDevice } from "@ledgerhq/errors";
import getDevices from "./getDevices";
import listenDevices from "./listenDevices";

let listenDevicesDebounce = 500;
let listenDevicesPollingSkip = () => false;
let listenDevicesDebug = () => {};

const isDisconnectedError = e =>
  e && e.message && e.message.indexOf("HID") >= 0;

/**
 * node-hid Transport implementation
 * @example
 * import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
 * ...
 * TransportNodeHid.create().then(transport => ...)
 */
export default class TransportNodeHid extends Transport<string> {
  /**
   *
   */
  static isSupported = (): Promise<boolean> =>
    Promise.resolve(typeof HID.HID === "function");

  /**
   *
   */
  static list = (): Promise<string[]> =>
    Promise.resolve(getDevices().map(d => d.path));

  /**
   *
   */
  static setListenDevicesDebounce = (delay: number) => {
    listenDevicesDebounce = delay;
  };

  /**
   *
   */
  static setListenDevicesPollingSkip = (conditionToSkip: () => boolean) => {
    listenDevicesPollingSkip = conditionToSkip;
  };

  /**
   *
   */
  static setListenDevicesDebug = (debug: boolean | ((log: string) => void)) => {
    listenDevicesDebug =
      typeof debug === "function"
        ? debug
        : debug
          ? (...log) => console.log("[listenDevices]", ...log)
          : () => {};
  };

  /**
   */
  static listen = (
    observer: Observer<DescriptorEvent<string>>
  ): Subscription => {
    let unsubscribed = false;
    Promise.resolve(getDevices()).then(devices => {
      // this needs to run asynchronously so the subscription is defined during this phase
      for (const device of devices) {
        if (!unsubscribed) {
          const descriptor: string = device.path;
          const deviceModel = identifyUSBProductId(device.productId);
          observer.next({ type: "add", descriptor, device, deviceModel });
        }
      }
    });
    const { events, stop } = listenDevices(
      listenDevicesDebounce,
      listenDevicesPollingSkip,
      listenDevicesDebug
    );

    const onAdd = device => {
      if (unsubscribed || !device) return;
      const deviceModel = identifyUSBProductId(device.productId);
      observer.next({
        type: "add",
        descriptor: device.path,
        deviceModel,
        device
      });
    };
    const onRemove = device => {
      if (unsubscribed || !device) return;
      const deviceModel = identifyUSBProductId(device.productId);
      observer.next({
        type: "remove",
        descriptor: device.path,
        deviceModel,
        device
      });
    };
    events.on("add", onAdd);
    events.on("remove", onRemove);
    function unsubscribe() {
      unsubscribed = true;
      events.removeListener("add", onAdd);
      events.removeListener("remove", onRemove);
      stop();
    }
    return { unsubscribe };
  };

  /**
   * if path="" is not provided, the library will take the first device
   */
  static async open(path: string) {
    if (path) {
      return Promise.resolve(new TransportNodeHid(new HID.HID(path)));
    }
    const device = getDevices()[0];
    if (!device) throw new TransportError("NoDevice", "NoDevice");
    return Promise.resolve(new TransportNodeHid(new HID.HID(device.path)));
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
      info && info.serialNumber
        ? identifyUSBProductId(parseInt(info.serialNumber, 16))
        : null;
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
      const { debug, channel, packetSize } = this;
      if (debug) {
        debug("=>" + apdu.toString("hex"));
      }

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

      if (debug) {
        debug("<=" + result.toString("hex"));
      }
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
