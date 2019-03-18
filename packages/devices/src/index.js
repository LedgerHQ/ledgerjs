// @flow

const devices = {
  blue: {
    id: "blue",
    productName: "Ledger Blue",
    usbProductId: 0x0000,
    usbOnly: true
  },
  nanoS: {
    id: "nanoS",
    productName: "Ledger Nano S",
    usbProductId: 0x0001,
    usbOnly: true
  },
  nanoX: {
    id: "nanoX",
    productName: "Ledger Nano X",
    usbProductId: 0x0004,
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
export const identifyUSBProductId = (usbProductId: number): ?DeviceModel =>
  devicesList.find(d => d.usbProductId === usbProductId);

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
      serviceUuidToInfos[spec.serviceUuid] = { deviceModel, ...spec };
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
  usbProductId: number,
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
