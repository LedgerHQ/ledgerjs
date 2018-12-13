// @flow

const ledgerDevices = [
  { vendorId: 0x2581, productId: 0x3b7c },
  { vendorId: 0x2c97 }
];

const isLedgerDevice = device =>
  ledgerDevices.some(
    info =>
      (!info.productId || info.productId === device.productId) &&
      (!info.vendorId || info.vendorId === device.vendorId)
  );

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
    .then(devices => devices.filter(isLedgerDevice));
