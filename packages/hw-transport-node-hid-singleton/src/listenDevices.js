// @flow
import usbDetect from "usb-detection";
import { ledgerUSBVendorId } from "@ledgerhq/devices";
import { log } from "@ledgerhq/logs";

export type Device = {
  locationId: number,
  vendorId: number,
  productId: number,
  deviceName: string,
  manufacturer: string,
  serialNumber: string,
  deviceAddress: number
};

const deviceToLog = ({ productId, locationId, deviceAddress }) =>
  `productId=${productId} locationId=${locationId} deviceAddress=${deviceAddress}`;

let usbDebounce = 1000;

export const setUsbDebounce = (n: number) => {
  usbDebounce = n;
};

let totalMonitor = 0;
const monitor = () => {
  if (totalMonitor === 0) {
    log("usb-detection", "startMonitoring");
    usbDetect.startMonitoring();
  }
  totalMonitor++;
  return () => {
    totalMonitor--;
    if (totalMonitor === 0) {
      log("usb-detection", "stopMonitoring");
      usbDetect.stopMonitoring();
    }
  };
};

export const listenDevices = (
  onAdd: Device => void,
  onRemove: Device => void
) => {
  const unmonitor = monitor();

  const addEvent = "add:" + ledgerUSBVendorId;
  const removeEvent = "remove:" + ledgerUSBVendorId;

  let timeout;

  const add = device => {
    log("usb-detection", "add: " + deviceToLog(device));
    if (!timeout) {
      // a time is needed for the device to actually be connectable over HID..
      // we also take this time to not emit the device yet and potentially cancel it if a remove happens.
      timeout = setTimeout(() => {
        onAdd(device);
        timeout = null;
      }, usbDebounce);
    }
  };

  const remove = device => {
    log("usb-detection", "remove: " + deviceToLog(device));
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    } else {
      onRemove(device);
    }
  };

  usbDetect.on(addEvent, add);
  usbDetect.on(removeEvent, remove);

  return () => {
    if (timeout) clearTimeout(timeout);
    usbDetect.off(addEvent, add);
    usbDetect.off(removeEvent, remove);
    unmonitor();
  };
};
