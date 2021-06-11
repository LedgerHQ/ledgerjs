// @flow

import semver from "semver";

/**
 * The USB product IDs will be defined as MMII, encoding a model (MM) and an interface bitfield (II)
 *
 ** Model
 * Ledger Nano S : 0x10
 * Ledger Blue : 0x00
 * Ledger Nano X : 0x40
 *
 ** Interface support bitfield
 * Generic HID : 0x01
 * Keyboard HID : 0x02
 * U2F : 0x04
 * CCID : 0x08
 * WebUSB : 0x10
 */

export const IIGenericHID = 0x01;
export const IIKeyboardHID = 0x02;
export const IIU2F = 0x04;
export const IICCID = 0x08;
export const IIWebUSB = 0x10;

const devices = {
  blue: {
    id: "blue",
    productName: "Ledger Blue",
    productIdMM: 0x00,
    legacyUsbProductId: 0x0000,
    usbOnly: true,
    memorySize: 480 * 1024,
    blockSize: 4 * 1024,
    masks: [0x31000000, 0x31010000],
    getBlockSize: (_firwareVersion: string): number => 4 * 1024,
  },
  nanoS: {
    id: "nanoS",
    productName: "Ledger Nano S",
    productIdMM: 0x10,
    legacyUsbProductId: 0x0001,
    usbOnly: true,
    memorySize: 320 * 1024,
    blockSize: 4 * 1024,
    masks: [0x31100000],
    getBlockSize: (firmwareVersion: string): number =>
      semver.lt(semver.coerce(firmwareVersion), "2.0.0") ? 4 * 1024 : 2 * 1024,
  },
  nanoX: {
    id: "nanoX",
    productName: "Ledger Nano X",
    productIdMM: 0x40,
    legacyUsbProductId: 0x0004,
    usbOnly: false,
    memorySize: 2 * 1024 * 1024,
    blockSize: 4 * 1024,
    masks: [0x33000000],
    getBlockSize: (_firwareVersion: string): number => 4 * 1024,
    bluetoothSpec: [
      {
        // this is the legacy one (prototype version). we will eventually drop it.
        serviceUuid: "d973f2e0-b19e-11e2-9e96-0800200c9a66",
        notifyUuid: "d973f2e1-b19e-11e2-9e96-0800200c9a66",
        writeUuid: "d973f2e2-b19e-11e2-9e96-0800200c9a66",
      },
      {
        serviceUuid: "13d63400-2c97-0004-0000-4c6564676572",
        notifyUuid: "13d63400-2c97-0004-0001-4c6564676572",
        writeUuid: "13d63400-2c97-0004-0002-4c6564676572",
      },
    ],
  },
};

const productMap = {
  Blue: "blue",
  "Nano S": "nanoS",
  "Nano X": "nanoX",
};

// $FlowFixMe
const devicesList: DeviceModel[] = Object.values(devices);

/**
 *
 */
export const ledgerUSBVendorId = 0x2c97;

/**
 *
 */
export const getDeviceModel = (id: DeviceModelId): DeviceModel => {
  const info = devices[id];
  if (!info) throw new Error("device '" + id + "' does not exist");
  return info;
};

/**
 * Given a `targetId`, return the deviceModel associated to it,
 * based on the first two bytes.
 */
export const identifyTargetId = (targetId: number): ?DeviceModel => {
  const deviceModel = devicesList.find(({ masks }) =>
    masks.find((mask) => (targetId & 0xffff0000) === mask)
  );

  return deviceModel;
};

/**
 *
 */
export const identifyUSBProductId = (usbProductId: number): ?DeviceModel => {
  const legacy = devicesList.find((d) => d.legacyUsbProductId === usbProductId);
  if (legacy) return legacy;

  const mm = usbProductId >> 8;
  const deviceModel = devicesList.find((d) => d.productIdMM === mm);
  return deviceModel;
};

export const identifyProductName = (productName: string): ?DeviceModel => {
  const productId = productMap[productName];
  const deviceModel = devicesList.find((d) => d.id === productId);

  return deviceModel;
};

const bluetoothServices: string[] = [];
const serviceUuidToInfos: {
  [_: string]: BluetoothInfos,
} = {};

for (let id in devices) {
  const deviceModel = devices[id];
  const { bluetoothSpec } = deviceModel;
  if (bluetoothSpec) {
    for (let i = 0; i < bluetoothSpec.length; i++) {
      const spec = bluetoothSpec[i];
      bluetoothServices.push(spec.serviceUuid);
      serviceUuidToInfos[spec.serviceUuid] = serviceUuidToInfos[
        spec.serviceUuid.replace(/-/g, "")
      ] = { deviceModel, ...spec };
    }
  }
}

/**
 *
 */
export const getBluetoothServiceUuids = () => bluetoothServices;

/**
 *
 */
export const getInfosForServiceUuid = (uuid: string): ?BluetoothInfos =>
  serviceUuidToInfos[uuid.toLowerCase()];

/**
 *
 */
export type DeviceModelId = $Keys<typeof devices>;

/**
 *
 */
export type DeviceModel = {
  id: DeviceModelId,
  productName: string,
  productIdMM: number,
  legacyUsbProductId: number,
  usbOnly: boolean,
  memorySize: number,
  masks: Array<number>,
  // blockSize: number, // THIS FIELD IS DEPRECATED, use getBlockSize
  getBlockSize: (firmwareVersion: string) => number,
  bluetoothSpec?: Array<{
    serviceUuid: string,
    writeUuid: string,
    notifyUuid: string,
  }>,
};

/**
 *
 */
export type BluetoothInfos = {
  deviceModel: DeviceModel,
  serviceUuid: string,
  writeUuid: string,
  notifyUuid: string,
};
