//@flow
import Transport from "@ledgerhq/hw-transport";
import type {
  Observer,
  DescriptorEvent,
  Subscription
} from "@ledgerhq/hw-transport";
import hidFraming from "@ledgerhq/devices/lib/hid-framing";
import { identifyUSBProductId, ledgerUSBVendorId } from "@ledgerhq/devices";
import type { DeviceModel } from "@ledgerhq/devices";
import { log } from "@ledgerhq/logs";
import {
  TransportOpenUserCancelled,
  DisconnectedDeviceDuringOperation,
  DisconnectedDevice
} from "@ledgerhq/errors";

const ledgerDevices = [{ vendorId: ledgerUSBVendorId }];

const isSupported = () =>
  Promise.resolve(!!(global.navigator && global.navigator.hid));

async function requestLedgerDevice(): Promise<HIDDevice> {
  // $FlowFixMe
  const device = await navigator.hid.requestDevice({ filters: ledgerDevices });
  return device;
}

async function getLedgerDevices(): Promise<HIDDevice[]> {
  // $FlowFixMe
  const devices = await navigator.hid.getDevices();
  return devices.filter(d => d.vendorId === ledgerUSBVendorId);
}

async function getFirstLedgerDevice(): Promise<HIDDevice> {
  const existingDevices = await getLedgerDevices();
  if (existingDevices.length > 0) return existingDevices[0];
  return requestLedgerDevice();
}

export interface HIDDevice {
  oninputreport: EventHandler;
  opened: boolean;
  vendorId: number;
  productId: number;
  productName: string;
  open(): Promise<void>;
  close(): Promise<void>;
  sendReport(reportId: number, data: BufferSource): Promise<void>;
  sendFeatureReport(reportId: number, data: BufferSource): Promise<void>;
  receiveFeatureReport(reportId: number): Promise<DataView>;
  addEventListener(string, EventHandler): void;
  removeEventListener(string, EventHandler): void;
}
/**
 * WebHID Transport implementation
 * @example
 * import TransportWebHID from "@ledgerhq/hw-transport-webhid";
 * ...
 * TransportWebHID.create().then(transport => ...)
 */
export default class TransportWebHID extends Transport<HIDDevice> {
  device: HIDDevice;
  deviceModel: ?DeviceModel;
  channel = Math.floor(Math.random() * 0xffff);
  packetSize = 64;

  constructor(device: HIDDevice) {
    super();
    this.device = device;
    this.deviceModel = identifyUSBProductId(device.productId);
    device.addEventListener("inputreport", this.onInputReport);
  }

  inputs = [];
  inputCallback: ?(Buffer) => void;

  read = (): Promise<Buffer> => {
    if (this.inputs.length) {
      return Promise.resolve(this.inputs.shift());
    }
    return new Promise(success => {
      this.inputCallback = success;
    });
  };

  onInputReport = (e: Event) => {
    // $FlowFixMe
    const buffer = new Buffer(e.data.buffer);
    if (this.inputCallback) {
      this.inputCallback(buffer);
      this.inputCallback = null;
    } else {
      this.inputs.push(buffer);
    }
  };

  /**
   * Check if WebUSB transport is supported.
   */
  static isSupported = isSupported;

  /**
   * List the WebUSB devices that was previously authorized by the user.
   */
  static list = getLedgerDevices;

  /**
   * Actively listen to WebUSB devices and emit ONE device
   * that was either accepted before, if not it will trigger the native permission UI.
   *
   * Important: it must be called in the context of a UI click!
   */
  static listen = (
    observer: Observer<DescriptorEvent<HIDDevice>>
  ): Subscription => {
    let unsubscribed = false;
    getFirstLedgerDevice().then(
      device => {
        if (!unsubscribed) {
          const deviceModel = identifyUSBProductId(device.productId);
          observer.next({ type: "add", descriptor: device, deviceModel });
          observer.complete();
        }
      },
      error => {
        observer.error(new TransportOpenUserCancelled(error.message));
      }
    );
    function unsubscribe() {
      unsubscribed = true;
    }
    return { unsubscribe };
  };

  /**
   * Similar to create() except it will always display the device permission (even if some devices are already accepted).
   */
  static async request() {
    const device = await requestLedgerDevice();
    return TransportWebHID.open(device);
  }

  /**
   * Similar to create() except it will never display the device permission (it returns a Promise<?Transport>, null if it fails to find a device).
   */
  static async openConnected() {
    const devices = await getLedgerDevices();
    if (devices.length === 0) return null;
    return TransportWebHID.open(devices[0]);
  }

  /**
   * Create a Ledger transport with a HIDDevice
   */
  static async open(device: HIDDevice) {
    await device.open();
    const transport = new TransportWebHID(device);
    const onDisconnect = e => {
      console.log(e);
      console.log(e.device);
      if (device === e.device) {
        // $FlowFixMe
        navigator.hid.removeEventListener("disconnect", onDisconnect);
        transport._emitDisconnect(new DisconnectedDevice());
      }
    };
    // $FlowFixMe
    navigator.hid.addEventListener("disconnect", onDisconnect);
    return transport;
  }

  _disconnectEmitted = false;
  _emitDisconnect = (e: Error) => {
    if (this._disconnectEmitted) return;
    this._disconnectEmitted = true;
    this.emit("disconnect", e);
  };

  /**
   * Release the transport device
   */
  async close(): Promise<void> {
    await this.exchangeBusyPromise;
    this.device.removeEventListener("inputreport", this.onInputReport);
    await this.device.close();
  }

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
        log("hid-frame", "=> " + blocks[i].toString("hex"));
        await this.device.sendReport(0, blocks[i]);
      }

      // Read...
      let result;
      let acc;
      while (!(result = framing.getReducedResult(acc))) {
        const buffer = await this.read();
        log("hid-frame", "<= " + buffer.toString("hex"));
        acc = framing.reduceResponse(acc, buffer);
      }

      log("apdu", "<= " + result.toString("hex"));
      return result;
    }).catch(e => {
      if (e && e.message && e.message.includes("write")) {
        this._emitDisconnect(e);
        throw new DisconnectedDeviceDuringOperation(e.message);
      }
      throw e;
    });

  setScrambleKey() {}
}
