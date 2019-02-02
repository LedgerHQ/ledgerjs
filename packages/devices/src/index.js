// @flow

export type DeviceInfo = {
  id: string,
  productName: string,
  usbProductId: number
};

const devices: { [id: string]: DeviceInfo } = {
  blue: {
    id: "blue",
    productName: "Ledger Blue",
    usbProductId: 0x0000
  },
  nanoS: {
    id: "nanoS",
    productName: "Ledger Nano S",
    usbProductId: 0x0001
  },
  nanoX: {
    id: "nanoX",
    productName: "Ledger Nano X",
    usbProductId: 0x0004
  }
};

// $FlowFixMe
const devicesList: DeviceInfo[] = Object.values(devices);

export const ledgerUSBVendorId = 0x2c97;

export const getDeviceInfo = (id: string): DeviceInfo => {
  const info = devices[id];
  if (!info) throw new Error("device '" + id + "' does not exist");
  return info;
};

export const identifyUSBProductId = (usbProductId: number): ?DeviceInfo =>
  devicesList.find(d => d.usbProductId === usbProductId);
