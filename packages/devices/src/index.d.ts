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
export declare const IIGenericHID = 1;
export declare const IIKeyboardHID = 2;
export declare const IIU2F = 4;
export declare const IICCID = 8;
export declare const IIWebUSB = 16;
export declare enum DeviceModelId {
    blue = "blue",
    nanoS = "nanoS",
    nanoX = "nanoX"
}
export declare const ledgerUSBVendorId = 11415;
export declare const getDeviceModel: (id: DeviceModelId) => DeviceModel;
export declare const identifyUSBProductId: (usbProductId: number) => DeviceModel | null | undefined;
export declare const identifyProductName: (productName: string) => DeviceModel | null | undefined;
export declare const getBluetoothServiceUuids: () => string[];
export declare const getInfosForServiceUuid: (uuid: string) => BluetoothInfos | null | undefined;
export interface DeviceModel {
    id: DeviceModelId;
    productName: string;
    productIdMM: number;
    legacyUsbProductId: number;
    usbOnly: boolean;
    memorySize: number;
    getBlockSize: (firmwareVersion: string) => number;
    bluetoothSpec?: Array<{
        serviceUuid: string;
        writeUuid: string;
        notifyUuid: string;
    }>;
}
export interface BluetoothInfos {
    deviceModel: DeviceModel;
    serviceUuid: string;
    writeUuid: string;
    notifyUuid: string;
}
//# sourceMappingURL=index.d.ts.map