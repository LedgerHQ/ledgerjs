// @flow
/* eslint-disable prefer-template */

import noble from "@abandonware/noble";
import { Observable } from "rxjs";
import { log } from "@ledgerhq/logs";
import {
  getInfosForServiceUuid,
  getBluetoothServiceUuids,
} from "@ledgerhq/devices";
import { TransportError } from "@ledgerhq/errors";

noble.on("warning", (message) => {
  log("ble-warning", message);
});

const POWERED_ON = "poweredOn";

export const availability: Observable<boolean> = Observable.create(
  (observer) => {
    const onAvailabilityChanged = (e) => {
      observer.next(e === POWERED_ON);
    };
    noble.addListener("stateChanged", onAvailabilityChanged); // events lib?
    observer.next(noble.state === POWERED_ON);
    return () => {
      noble.removeListener("stateChanged", onAvailabilityChanged);
    };
  }
);

export const listenDeviceDisconnect = (device: *, onDisconnect: *) => {
  device.addListener("disconnect", onDisconnect);
  return () => {
    device.removeListener("disconnect", onDisconnect);
  };
};

export const connectDevice = (device: *): Promise<void> =>
  new Promise((resolve, reject) => {
    device.connect((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

export const disconnectDevice = (device: *): Promise<void> =>
  new Promise((resolve, reject) => {
    device.disconnect((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

export const isDeviceDisconnected = (device: *): boolean =>
  device.state === "disconnected";

const discoverDeviceServices = (device) =>
  new Promise((resolve, reject) =>
    device.discoverServices(null, (error, services) => {
      if (error) reject(error);
      else resolve(services);
    })
  );

const discoverServiceCharacteristics = (service) =>
  new Promise((resolve, reject) =>
    service.discoverCharacteristics(null, (error, chs) => {
      if (error) reject(error);
      else resolve(chs);
    })
  );

export const listen = (): Observable<*> =>
  Observable.create((observer) => {
    const discoveredDevices = {};

    const onDiscover = (peripheral) => {
      const { uuid: id } = peripheral;
      const { localName } = peripheral.advertisement;
      const name =
        localName ||
        (discoveredDevices[id] ? discoveredDevices[id].name : null);
      discoveredDevices[id] = { peripheral, name };
      log("ble-advertisement", id + " (" + String(name) + ")");
      observer.next({
        type: "add",
        descriptor: peripheral,
        device: { id, name },
      });
    };

    noble.addListener("discover", onDiscover);
    noble.startScanning(getBluetoothServiceUuids(), true);

    return () => {
      noble.removeListener("discover", onDiscover);
      noble.stopScanning();
    };
  });

export const retrieveServiceAndCharacteristics = async (device: *) => {
  const [service] = await discoverDeviceServices(device);
  const infos = getInfosForServiceUuid(service.uuid);
  if (!infos) {
    throw new TransportError("service not found", "BLEServiceNotFound");
  }
  const characteristics = await discoverServiceCharacteristics(service);
  let writeC;
  let notifyC;
  for (const c of characteristics) {
    if (c.uuid === infos.writeUuid.replace(/-/g, "")) {
      writeC = c;
    } else if (c.uuid === infos.notifyUuid.replace(/-/g, "")) {
      notifyC = c;
    }
  }
  if (!writeC || !notifyC) {
    throw new TransportError(
      "missing characteristics",
      "BLEMissingCharacteristics"
    );
  }
  return {
    writeC,
    notifyC,
    deviceModel: infos.deviceModel,
  };
};

export const monitorCharacteristic = (
  characteristic: *
): [Observable<Buffer>, Promise<void>] => {
  let resolve;
  let reject;
  const readyness = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const observable = Observable.create((o) => {
    function onCharacteristicValueChanged(data) {
      o.next(Buffer.from(data));
    }

    function onSubscribe(error) {
      if (error) {
        reject(error);
        o.error(error);
      } else {
        resolve();
        log("verbose", "start monitor " + characteristic.uuid);
      }
    }

    characteristic.on("data", onCharacteristicValueChanged);
    characteristic.subscribe(onSubscribe);

    return () => {
      log("verbose", "end monitor " + characteristic.uuid);
      characteristic.removeListener("data", onCharacteristicValueChanged);
      characteristic.unsubscribe();
    };
  });

  return [observable, readyness];
};

export const write = (writeCharacteristic: *, buffer: Buffer): Promise<void> =>
  new Promise((resolve, reject) => {
    writeCharacteristic.write(buffer, false, (e) => {
      if (e) reject(e);
      else resolve();
    });
  });
