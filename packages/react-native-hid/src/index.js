//@flow
import { NativeModules } from "react-native";
import { ledgerUSBVendorId, identifyUSBProductId } from "@ledgerhq/devices";
import Transport from "@ledgerhq/hw-transport";

type DeviceObj = {
  vendorId: number,
  productId: number
};

export default class HIDTransport extends Transport<DeviceObj> {
  static isSupported = (): Promise<boolean> =>
    Promise.resolve(!!NativeModules.HID);

  static async list(): * {
    if (!NativeModules.HID) return Promise.resolve([]);
    const list = await NativeModules.HID.getDeviceList();
    return list.filter(d => d.vendorId === ledgerUSBVendorId);
  }

  static listen(observer: *) {
    if (!NativeModules.HID) return { unsubscribe: () => {} };
    let unsubscribed = false;
    HIDTransport.list().then(candidates => {
      for (const c of candidates) {
        if (!unsubscribed) {
          const deviceInfo = identifyUSBProductId(c.productId);
          observer.next({ type: "add", descriptor: c, deviceInfo });
        }
      }
    });
    return {
      unsubscribe: () => {
        unsubscribed = true;
      }
    };
  }

  static async open(deviceObj: DeviceObj) {
    const nativeObj = await NativeModules.HID.openDevice(deviceObj);
    return new HIDTransport(nativeObj.id);
  }

  id: number;

  constructor(id: number) {
    super();
    this.id = id;
  }

  async exchange(value: Buffer) {
    return this.exchangeAtomicImpl(async () => {
      const resultHex = await NativeModules.HID.exchange(
        this.id,
        value.toString("hex")
      );
      return Buffer.from(resultHex, "hex");
    });
  }

  async close() {
    await this.exchangeBusyPromise;
    return NativeModules.HID.closeDevice(this.id);
  }

  setScrambleKey() {}
}
