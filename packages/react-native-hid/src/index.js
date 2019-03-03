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

const listLedgerDevices = async () => {
  const devices = await NativeModules.HID.getDeviceList();
  return devices.filter(d => d.vendorId === ledgerUSBVendorId);
};

const liveDeviceEventsSubject: Subject<DescriptorEvent<*>> = new Subject();

DeviceEventEmitter.addListener("onDeviceConnect", (device: *) => {
  if (device.vendorId !== ledgerUSBVendorId) return;
  const deviceModel = identifyUSBProductId(device.productId);
  liveDeviceEventsSubject.next({
    type: "add",
    descriptor: device,
    deviceModel
  });
});

DeviceEventEmitter.addListener("onDeviceDisconnect", (device: *) => {
  if (device.vendorId !== ledgerUSBVendorId) return;
  const deviceModel = identifyUSBProductId(device.productId);
  liveDeviceEventsSubject.next({
    type: "remove",
    descriptor: device,
    deviceModel
  });
});

/**
 * Ledger's React Native HID Transport implementation
 * @example
 * import TransportHID from "@ledgerhq/react-native-hid";
 * ...
 * TransportHID.create().then(transport => ...)
 */
export default class HIDTransport extends Transport<DeviceObj> {
  id: number;

  constructor(id: number) {
    super();
    this.id = id;
  }

  /**
   * Check if the transport is supported (basically true on Android)
   */
  static isSupported = (): Promise<boolean> =>
    Promise.resolve(!!NativeModules.HID);

  /**
   * List currently connected devices.
   * @returns Promise of devices
   */
  static async list() {
    if (!NativeModules.HID) return Promise.resolve([]);
    let list = await listLedgerDevices();
    return list;
  }

  /**
   * Listen to ledger devices events
   */
  static listen(observer: *) {
    if (!NativeModules.HID) return { unsubscribe: () => {} };
    return concat(
      from(listLedgerDevices()).pipe(
        mergeMap(devices =>
          from(
            devices.map(device => ({
              type: "add",
              descriptor: device,
              deviceModel: identifyUSBProductId(device.productId)
            }))
          )
        )
      ),
      liveDeviceEventsSubject
    ).subscribe(observer);
  }

  /**
   * Open a the transport with a Ledger device
   */
  static async open(deviceObj: DeviceObj) {
    const nativeObj = await NativeModules.HID.openDevice(deviceObj);
    return new HIDTransport(nativeObj.id);
  }

  /**
   * @param {*} apdu input value
   * @returns Promise of apdu response
   */
  async exchange(apdu: Buffer) {
    return this.exchangeAtomicImpl(async () => {
      const resultHex = await NativeModules.HID.exchange(
        this.id,
        apdu.toString("hex")
      );
      return Buffer.from(resultHex, "hex");
    });
  }

  /**
   * Close the transport
   * @returns Promise
   */
  async close() {
    await this.exchangeBusyPromise;
    return NativeModules.HID.closeDevice(this.id);
  }

  setScrambleKey() {}
}
