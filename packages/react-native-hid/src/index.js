//@flow
import { NativeModules, DeviceEventEmitter } from "react-native";
import { ledgerUSBVendorId, identifyUSBProductId } from "@ledgerhq/devices";
import Transport from "@ledgerhq/hw-transport";
import type { DescriptorEvent } from "@ledgerhq/hw-transport";
import { Subject, from, concat } from "rxjs";
import { mergeMap } from "rxjs/operators";

type DeviceObj = {
  vendorId: number,
  productId: number
};

const onDeviceConnect = (device: *) => {
  const deviceModel = identifyUSBProductId(device.productId);
  liveDeviceEventsSubject.next({
    type: "add",
    descriptor: device,
    deviceModel
  });
};

const onDeviceDisconnect = (device: *) => {
  const deviceModel = identifyUSBProductId(device.productId);
  liveDeviceEventsSubject.next({
    type: "remove",
    descriptor: device,
    deviceModel
  });
};

const liveDeviceEventsSubject: Subject<DescriptorEvent<*>> = new Subject();
DeviceEventEmitter.addListener("onDeviceConnect", onDeviceConnect);
DeviceEventEmitter.addListener("onDeviceDisconnect", onDeviceDisconnect);

export default class HIDTransport extends Transport<DeviceObj> {
  id: number;

  constructor(id: number) {
    super();
    this.id = id;
  }

  static isSupported = (): Promise<boolean> =>
    Promise.resolve(!!NativeModules.HID);

  static async list(): * {
    if (!NativeModules.HID) return Promise.resolve([]);
    let rawList = await NativeModules.HID.getDeviceList();

    return rawList.reduce((filteredList, candidate) => {
      if (candidate.vendorId === ledgerUSBVendorId) {
        const deviceModel = identifyUSBProductId(candidate.productId);
        filteredList.push({ type: "add", descriptor: candidate, deviceModel });
      }
      return filteredList;
    }, []);
  }

  static listen(observer: *) {
    if (!NativeModules.HID) return { unsubscribe: () => {} };
    return concat(
      from(HIDTransport.list()).pipe(mergeMap(a => from(a))),
      liveDeviceEventsSubject
    ).subscribe(observer);
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
