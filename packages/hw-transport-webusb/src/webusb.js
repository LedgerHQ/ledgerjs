// @flow
import { ledgerUSBVendorId } from "@ledgerhq/devices";

const ledgerDevices = [{ vendorId: ledgerUSBVendorId }];

export async function requestLedgerDevice(): Promise<USBDevice> {
  // $FlowFixMe
  const device = await navigator.usb.requestDevice({ filters: ledgerDevices });
  return device;
}

export async function getLedgerDevices(): Promise<USBDevice[]> {
  // $FlowFixMe
  const devices = await navigator.usb.getDevices();
  return devices.filter((d) => d.vendorId === ledgerUSBVendorId);
}

export async function getFirstLedgerDevice(): Promise<USBDevice> {
  const existingDevices = await getLedgerDevices();
  if (existingDevices.length > 0) return existingDevices[0];
  return requestLedgerDevice();
}

export const isSupported = (): Promise<boolean> =>
  Promise.resolve(
    !!navigator &&
      // $FlowFixMe
      !!navigator.usb &&
      typeof navigator.usb.getDevices === "function"
  );
