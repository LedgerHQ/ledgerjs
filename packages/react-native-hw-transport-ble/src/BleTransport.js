// @flow
/* eslint-disable prefer-template */

import Transport from "@ledgerhq/hw-transport";
import {
  BleManager,
  ConnectionPriority,
  BleErrorCode,
} from "react-native-ble-plx";
import {
  getBluetoothServiceUuids,
  getInfosForServiceUuid,
} from "@ledgerhq/devices";
import type { DeviceModel } from "@ledgerhq/devices";

import { sendAPDU } from "@ledgerhq/devices/lib/ble/sendAPDU";
import { receiveAPDU } from "@ledgerhq/devices/lib/ble/receiveAPDU";
import { log } from "@ledgerhq/logs";
import { Observable, defer, merge, from } from "rxjs";
import { share, ignoreElements, first, map, tap } from "rxjs/operators";
import {
  CantOpenDevice,
  TransportError,
  DisconnectedDeviceDuringOperation,
} from "@ledgerhq/errors";
import type { Device, Characteristic } from "./types";
import { monitorCharacteristic } from "./monitorCharacteristic";
import { awaitsBleOn } from "./awaitsBleOn";
import { decoratePromiseErrors, remapError } from "./remapErrors";

let connectOptions = {
  requestMTU: 156,
};

const transportsCache = {};
const bleManager = new BleManager();

const retrieveInfos = (device) => {
  if (!device || !device.serviceUUIDs) return;
  const [serviceUUID] = device.serviceUUIDs;
  if (!serviceUUID) return;
  const infos = getInfosForServiceUuid(serviceUUID);
  if (!infos) return;
  return infos;
};

type ReconnectionConfig = {
  pairingThreshold: number,
  delayAfterFirstPairing: number,
};
let reconnectionConfig: ?ReconnectionConfig = {
  pairingThreshold: 1000,
  delayAfterFirstPairing: 4000,
};
export function setReconnectionConfig(config: ?ReconnectionConfig) {
  reconnectionConfig = config;
}

const delay = (ms) => new Promise((success) => setTimeout(success, ms));

async function open(deviceOrId: Device | string, needsReconnect: boolean) {
  let device;
  if (typeof deviceOrId === "string") {
    if (transportsCache[deviceOrId]) {
      log("ble-verbose", "Transport in cache, using that.");
      return transportsCache[deviceOrId];
    }

    log("ble-verbose", `open(${deviceOrId})`);

    await awaitsBleOn(bleManager);

    if (!device) {
      // works for iOS but not Android
      const devices = await bleManager.devices([deviceOrId]);
      log("ble-verbose", `found ${devices.length} devices`);
      [device] = devices;
    }

    if (!device) {
      const connectedDevices = await bleManager.connectedDevices(
        getBluetoothServiceUuids()
      );
      const connectedDevicesFiltered = connectedDevices.filter(
        (d) => d.id === deviceOrId
      );
      log(
        "ble-verbose",
        `found ${connectedDevicesFiltered.length} connected devices`
      );
      [device] = connectedDevicesFiltered;
    }

    if (!device) {
      log("ble-verbose", `connectToDevice(${deviceOrId})`);
      try {
        device = await bleManager.connectToDevice(deviceOrId, connectOptions);
      } catch (e) {
        if (e.errorCode === BleErrorCode.DeviceMTUChangeFailed) {
          // eslint-disable-next-line require-atomic-updates
          connectOptions = {};
          device = await bleManager.connectToDevice(deviceOrId);
        } else {
          throw e;
        }
      }
    }

    if (!device) {
      throw new CantOpenDevice();
    }
  } else {
    device = deviceOrId;
  }

  if (!(await device.isConnected())) {
    log("ble-verbose", "not connected. connecting...");
    try {
      await device.connect(connectOptions);
    } catch (e) {
      if (e.errorCode === BleErrorCode.DeviceMTUChangeFailed) {
        // eslint-disable-next-line require-atomic-updates
        connectOptions = {};
        await device.connect();
      } else {
        throw e;
      }
    }
  }

  await device.discoverAllServicesAndCharacteristics();

  let res = retrieveInfos(device);
  let characteristics;
  if (!res) {
    for (const uuid of getBluetoothServiceUuids()) {
      try {
        characteristics = await device.characteristicsForService(uuid);
        res = getInfosForServiceUuid(uuid);
        break;
      } catch (e) {
        // we attempt to connect to service
      }
    }
  }
  if (!res) {
    throw new TransportError("service not found", "BLEServiceNotFound");
  }

  const { deviceModel, serviceUuid, writeUuid, notifyUuid } = res;

  if (!characteristics) {
    characteristics = await device.characteristicsForService(serviceUuid);
  }

  if (!characteristics) {
    throw new TransportError("service not found", "BLEServiceNotFound");
  }
  let writeC;
  let notifyC;
  for (const c of characteristics) {
    if (c.uuid === writeUuid) {
      writeC = c;
    } else if (c.uuid === notifyUuid) {
      notifyC = c;
    }
  }
  if (!writeC) {
    throw new TransportError(
      "write characteristic not found",
      "BLEChracteristicNotFound"
    );
  }
  if (!notifyC) {
    throw new TransportError(
      "notify characteristic not found",
      "BLEChracteristicNotFound"
    );
  }
  if (!writeC.isWritableWithResponse) {
    throw new TransportError(
      "write characteristic not writableWithResponse",
      "BLEChracteristicInvalid"
    );
  }
  if (!notifyC.isNotifiable) {
    throw new TransportError(
      "notify characteristic not notifiable",
      "BLEChracteristicInvalid"
    );
  }

  log("ble-verbose", `device.mtu=${device.mtu}`);

  const notifyObservable = monitorCharacteristic(notifyC).pipe(
    tap((value) => {
      log("ble-frame", "<= " + value.toString("hex"));
    }),
    share()
  );

  const notif = notifyObservable.subscribe();

  const transport = new BluetoothTransport(
    device,
    writeC,
    notifyObservable,
    deviceModel
  );

  const onDisconnect = (e) => {
    transport.notYetDisconnected = false;
    notif.unsubscribe();
    disconnectedSub.remove();
    delete transportsCache[transport.id];
    log("ble-verbose", `BleTransport(${transport.id}) disconnected`);
    transport.emit("disconnect", e);
  };

  // eslint-disable-next-line require-atomic-updates
  transportsCache[transport.id] = transport;
  const disconnectedSub = device.onDisconnected((e) => {
    if (!transport.notYetDisconnected) return;
    onDisconnect(e);
  });

  let beforeMTUTime = Date.now();
  try {
    await transport.inferMTU();
  } finally {
    let afterMTUTime = Date.now();

    if (reconnectionConfig) {
      // workaround for #279: we need to open() again if we come the first time here,
      // to make sure we do a disconnect() after the first pairing time
      // because of a firmware bug

      if (afterMTUTime - beforeMTUTime < reconnectionConfig.pairingThreshold) {
        needsReconnect = false; // (optim) there is likely no new pairing done because mtu answer was fast.
      }

      if (needsReconnect) {
        // necessary time for the bonding workaround
        await BluetoothTransport.disconnect(transport.id).catch(() => {});
        await delay(reconnectionConfig.delayAfterFirstPairing);
      }
    } else {
      needsReconnect = false;
    }
  }

  if (needsReconnect) {
    return open(device, false);
  }

  return transport;
}

/**
 * react-native bluetooth BLE implementation
 * @example
 * import BluetoothTransport from "@ledgerhq/react-native-hw-transport-ble";
 */
export default class BluetoothTransport extends Transport<Device | string> {
  /**
   *
   */
  static isSupported = (): Promise<boolean> =>
    Promise.resolve(typeof BleManager === "function");

  /**
   *
   */
  static setLogLevel = (level: *) => {
    bleManager.setLogLevel(level);
  };

  /**
   * TODO could add this concept in all transports
   * observe event with { available: bool, string } // available is generic, type is specific
   * an event is emit once and then listened
   */
  static observeState(observer: *) {
    const emitFromState = (type) => {
      observer.next({ type, available: type === "PoweredOn" });
    };
    bleManager.onStateChange(emitFromState, true);
    return {
      unsubscribe: () => {},
    };
  }

  static list = (): * => {
    throw new Error("not implemented");
  };

  /**
   * Scan for bluetooth Ledger devices
   */
  static listen(observer: *) {
    log("ble-verbose", "listen...");
    let unsubscribed;

    // $FlowFixMe
    const stateSub = bleManager.onStateChange(async (state) => {
      if (state === "PoweredOn") {
        stateSub.remove();

        const devices = await bleManager.connectedDevices(
          getBluetoothServiceUuids()
        );
        if (unsubscribed) return;

        await Promise.all(
          devices.map((d) =>
            BluetoothTransport.disconnect(d.id).catch(() => {})
          )
        );
        if (unsubscribed) return;

        bleManager.startDeviceScan(
          getBluetoothServiceUuids(),
          null,
          (bleError, device) => {
            if (bleError) {
              observer.error(bleError);
              unsubscribe();
              return;
            }
            const res = retrieveInfos(device);
            const deviceModel = res && res.deviceModel;
            observer.next({ type: "add", descriptor: device, deviceModel });
          }
        );
      }
    }, true);
    const unsubscribe = () => {
      unsubscribed = true;
      bleManager.stopDeviceScan();
      stateSub.remove();
      log("ble-verbose", "done listening.");
    };
    return { unsubscribe };
  }

  /**
   * Open a BLE transport
   * @param {*} deviceOrId
   */
  static async open(deviceOrId: Device | string) {
    return open(deviceOrId, true);
  }

  /**
   * Globally disconnect a BLE device by its ID
   */
  static disconnect = async (id: *) => {
    log("ble-verbose", `user disconnect(${id})`);
    await bleManager.cancelDeviceConnection(id);
  };

  id: string;

  device: Device;

  mtuSize: number = 20;

  writeCharacteristic: Characteristic;

  notifyObservable: Observable<Buffer>;

  deviceModel: DeviceModel;

  notYetDisconnected = true;

  constructor(
    device: Device,
    writeCharacteristic: Characteristic,
    notifyObservable: Observable<Buffer>,
    deviceModel: DeviceModel
  ) {
    super();
    this.id = device.id;
    this.device = device;
    this.writeCharacteristic = writeCharacteristic;
    this.notifyObservable = notifyObservable;
    this.deviceModel = deviceModel;
    log("ble-verbose", `BleTransport(${String(this.id)}) new instance`);
  }

  /**
   * communicate with a BLE transport
   */
  exchange = (apdu: Buffer): Promise<Buffer> =>
    this.exchangeAtomicImpl(async () => {
      try {
        const msgIn = apdu.toString("hex");
        log("apdu", `=> ${msgIn}`);

        const data = await merge(
          // $FlowFixMe
          this.notifyObservable.pipe(receiveAPDU),
          sendAPDU(this.write, apdu, this.mtuSize)
        ).toPromise();

        const msgOut = data.toString("hex");
        log("apdu", `<= ${msgOut}`);

        return data;
      } catch (e) {
        log("ble-error", "exchange got " + String(e));
        if (this.notYetDisconnected) {
          // in such case we will always disconnect because something is bad.
          await bleManager.cancelDeviceConnection(this.id).catch(() => {}); // but we ignore if disconnect worked.
        }
        throw remapError(e);
      }
    });

  // TODO we probably will do this at end of open
  async inferMTU() {
    let { mtu } = this.device;
    await this.exchangeAtomicImpl(async () => {
      try {
        mtu =
          (await merge(
            this.notifyObservable.pipe(
              first((buffer) => buffer.readUInt8(0) === 0x08),
              map((buffer) => buffer.readUInt8(5))
            ),
            defer(() => from(this.write(Buffer.from([0x08, 0, 0, 0, 0])))).pipe(
              ignoreElements()
            )
          ).toPromise()) + 3;
      } catch (e) {
        log("ble-error", "inferMTU got " + String(e));
        await bleManager.cancelDeviceConnection(this.id).catch(() => {}); // but we ignore if disconnect worked.
        throw remapError(e);
      }
    });

    if (mtu > 23) {
      const mtuSize = mtu - 3;
      log(
        "ble-verbose",
        `BleTransport(${String(this.id)}) mtu set to ${String(mtuSize)}`
      );
      this.mtuSize = mtuSize;
    }

    return this.mtuSize;
  }

  async requestConnectionPriority(
    connectionPriority: "Balanced" | "High" | "LowPower"
  ) {
    await decoratePromiseErrors(
      this.device.requestConnectionPriority(
        ConnectionPriority[connectionPriority]
      )
    );
  }

  setScrambleKey() {}

  write = async (buffer: Buffer, txid?: ?string) => {
    log("ble-frame", "=> " + buffer.toString("hex"));
    try {
      await this.writeCharacteristic.writeWithResponse(
        buffer.toString("base64"),
        txid
      );
    } catch (e) {
      throw new DisconnectedDeviceDuringOperation(e.message);
    }
  };

  async close() {
    if (this.exchangeBusyPromise) {
      await this.exchangeBusyPromise;
    }
  }
}
