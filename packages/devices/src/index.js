// @flow

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
    productIdMM: 0,
    legacyUsbProductId: 0x0000,
    usbOnly: true
  },
  nanoS: {
    id: "nanoS",
    productName: "Ledger Nano S",
    productIdMM: 1,
    legacyUsbProductId: 0x0001,
    usbOnly: true
  },
  nanoX: {
    id: "nanoX",
    productName: "Ledger Nano X",
    productIdMM: 4,
    legacyUsbProductId: 0x0004,
    usbOnly: false,
    bluetoothSpec: [
      {
        // this is the legacy one (prototype version). we will eventually drop it.
        serviceUuid: "d973f2e0-b19e-11e2-9e96-0800200c9a66",
        notifyUuid: "d973f2e1-b19e-11e2-9e96-0800200c9a66",
        writeUuid: "d973f2e2-b19e-11e2-9e96-0800200c9a66"
      },
      {
        serviceUuid: "13d63400-2c97-0004-0000-4c6564676572",
        notifyUuid: "13d63400-2c97-0004-0001-4c6564676572",
        writeUuid: "13d63400-2c97-0004-0002-4c6564676572"
      }
    ]
  }
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
 *
 */
export const identifyUSBProductId = (usbProductId: number): ?DeviceModel => {
  const legacy = devicesList.find(d => d.legacyUsbProductId === usbProductId);
  if (legacy) return legacy;
  const mm = usbProductId >> 8;
  const deviceModel = devicesList.find(d => d.productIdMM === mm);
  return deviceModel;
};

const bluetoothServices: string[] = [];
const serviceUuidToInfos: {
  [_: string]: BluetoothInfos
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
  bluetoothSpec?: Array<{
    serviceUuid: string,
    writeUuid: string,
    notifyUuid: string
  }>
};

/**
 *
 */
export type BluetoothInfos = {
  deviceModel: DeviceModel,
  serviceUuid: string,
  writeUuid: string,
  notifyUuid: string
};
