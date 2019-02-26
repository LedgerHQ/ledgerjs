//@flow
import { NativeModules, DeviceEventEmitter } from "react-native";
import { ledgerUSBVendorId, identifyUSBProductId } from "@ledgerhq/devices";
import Transport from "@ledgerhq/hw-transport";

type DeviceObj = {
  vendorId: number,
  productId: number
};

export default class HIDTransport extends Transport<DeviceObj> {
  static observer: *;
  static unsubscribed: boolean;

  id: number;

  constructor(id: number) {
    super();
    this.id = id;
  }

  static onDeviceConnect = device => {
    if (HIDTransport.observer && !HIDTransport.unsubscribed) {
      const deviceModel = identifyUSBProductId(device.productId);
      HIDTransport.observer.next({
        type: "add",
        descriptor: device,
        deviceModel
      });
    }
  };

  static onDeviceDisconnect = event => {
    if (HIDTransport.observer && !HIDTransport.unsubscribed) {
      HIDTransport.observer.next({ type: "reset" });
      HIDTransport.listDevices();
    }
  };

  static isSupported = (): Promise<boolean> =>
    Promise.resolve(!!NativeModules.HID);

  static async list(): * {
    if (!NativeModules.HID) return Promise.resolve([]);
    const list = await NativeModules.HID.getDeviceList();
    return list.filter(d => d.vendorId === ledgerUSBVendorId);
  }

  static listDevices(){
    HIDTransport.list().then(candidates => {
      for (const c of candidates) {
        if (!HIDTransport.unsubscribed) {
          console.log("wadus device listed",c)
          const deviceModel = identifyUSBProductId(c.productId);
          console.log("wadus device detected model", deviceModel)
          HIDTransport.observer.next({ type: "add", descriptor: c, deviceModel });
        }
      }
    });
  }

  static listen(observer: *) {
    HIDTransport.observer = observer;
    HIDTransport.unsubscribed = false;
    if (!NativeModules.HID) return { unsubscribe: () => {} };

    HIDTransport.listDevices();
    return {
      unsubscribe: () => {
        HIDTransport.unsubscribed = true;
        HIDTransport.observer = null;
      }
    };
  }

  static async open(deviceObj: DeviceObj) {
    const nativeObj = await NativeModules.HID.openDevice(deviceObj);
    return new HIDTransport(nativeObj.id);
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

DeviceEventEmitter.addListener(
  "onDeviceConnect",
  HIDTransport.onDeviceConnect
);
DeviceEventEmitter.addListener(
  "onDeviceDisconnect",
  HIDTransport.onDeviceDisconnect
);
