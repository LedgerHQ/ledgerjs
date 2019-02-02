// @flow
import { ledgerUSBVendorId } from "@ledgerhq/devices";

const ledgerDevices = [{ vendorId: ledgerUSBVendorId }];

export function requestLedgerDevice(): Promise<USBDevice> {
  return Promise.resolve().then(() =>
    // $FlowFixMe
    navigator.usb.requestDevice({ filters: ledgerDevices })
  );
}

export const isSupported = (): Promise<boolean> =>
  Promise.resolve(
    typeof navigator === "object" &&
      // $FlowFixMe
      typeof navigator.usb === "object"
  );

export const getLedgerDevices = (): Promise<USBDevice[]> =>
  Promise.resolve()
    .then(() =>
      // $FlowFixMe
      navigator.usb.getDevices()
    )
    .then(devices => devices.filter(d => d.vendorId === ledgerUSBVendorId));
