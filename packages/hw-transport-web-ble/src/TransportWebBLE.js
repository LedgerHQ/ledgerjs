// @flow
/* eslint-disable prefer-template */

import Transport from "@ledgerhq/hw-transport";
import { DisconnectedDevice } from "@ledgerhq/errors";
import { Observable, defer, merge, from } from "rxjs";
import {
  share,
  ignoreElements,
  first,
  map,
  tap,
  timeout
} from "rxjs/operators";
import { logSubject } from "./debug";
import type { Device, Characteristic } from "./types";
import { sendAPDU } from "./sendAPDU";
import { receiveAPDU } from "./receiveAPDU";
import { monitorCharacteristic } from "./monitorCharacteristic";

const ServiceUuid = "d973f2e0-b19e-11e2-9e96-0800200c9a66";
const WriteCharacteristicUuid = "d973f2e2-b19e-11e2-9e96-0800200c9a66";
const NotifyCharacteristicUuid = "d973f2e1-b19e-11e2-9e96-0800200c9a66";

const requiresBluetooth = () => {
  // $FlowFixMe
  const { bluetooth } = navigator;
  if (typeof bluetooth === "undefined") {
    throw new Error("web bluetooth not supported");
  }
  return bluetooth;
};

const availability = () =>
  Observable.create(observer => {
    const bluetooth = requiresBluetooth();
    const onAvailabilityChanged = e => {
      observer.next(e.value);
    };
    bluetooth.addEventListener("availabilitychanged", onAvailabilityChanged);
    let unsubscribed = false;
    bluetooth.getAvailability().then(available => {
      if (!unsubscribed) {
        observer.next(available);
      }
    });
    return {
      unsubscribe: () => {
        unsubscribed = true;
        bluetooth.removeEventListener(
          "availabilitychanged",
          onAvailabilityChanged
        );
      }
    };
  });

const transportsCache = {};

/**
 * react-native bluetooth BLE implementation
 * @example
 * import BluetoothTransport from "@ledgerhq/hw-transport-web-ble";
 */
export default class BluetoothTransport extends Transport<Device | string> {
  static isSupported = (): Promise<boolean> =>
    Promise.resolve()
      .then(requiresBluetooth)
      .then(() => true, () => false);

  /**
   * TODO could add this concept in all transports
   * observe event with { available: bool, type: string } // available is generic, type is specific
   * an event is emit once and then each time it changes
   */
  static observeAvailability = (observer: *) =>
    availability.subscribe(observer);

  static list = (): * => Promise.resolve([]);

  static listen(observer: *) {
    logSubject.next({
      type: "verbose",
      message: "listen..."
    });

    let unsubscribed;

    const bluetooth = requiresBluetooth();

    bluetooth
      .requestDevice({
        filters: [
          {
            services: [ServiceUuid]
          }
        ]
      })
      .then(device => {
        if (!unsubscribed) {
          observer.next({ type: "add", descriptor: device, device });
          observer.complete();
        }
      });
    function unsubscribe() {
      unsubscribed = true;
    }
    return { unsubscribe };
  }

  static async open(deviceOrId: Device | string) {
    let device;
    if (typeof deviceOrId === "string") {
      if (transportsCache[deviceOrId]) {
        logSubject.next({
          type: "verbose",
          message: "Transport in cache, using that."
        });
        return transportsCache[deviceOrId];
      }

      const bluetooth = requiresBluetooth();

      // TODO instead we should "query" the device by its ID
      device = await bluetooth.requestDevice({
        filters: [
          {
            services: [ServiceUuid]
          }
        ]
      });
    } else {
      device = deviceOrId;
    }

    if (!device.gatt.connected) {
      logSubject.next({
        type: "verbose",
        message: "not connected. connecting..."
      });
      await device.gatt.connect();
    }

    const service = await device.gatt.getPrimaryService(ServiceUuid);
    const [writeC, notifyC] = await Promise.all([
      service.getCharacteristic(WriteCharacteristicUuid),
      service.getCharacteristic(NotifyCharacteristicUuid)
    ]);

    const notifyObservable = monitorCharacteristic(notifyC).pipe(
      tap(value => {
        logSubject.next({
          type: "ble-frame-read",
          message: value.toString("hex")
        });
      }),
      share()
    );

    const notif = notifyObservable.subscribe();

    const transport = new BluetoothTransport(device, writeC, notifyObservable);

    await transport.inferMTU();

    if (!device.gatt.connected) {
      throw new DisconnectedDevice();
    }

    transportsCache[transport.id] = transport;
    const onDisconnect = e => {
      delete transportsCache[transport.id];
      transport.notYetDisconnected = false;
      notif.unsubscribe();
      device.removeEventListener("gattserverdisconnected", onDisconnect);
      logSubject.next({
        type: "verbose",
        message: `BleTransport(${transport.id}) disconnected`
      });
      transport.emit("disconnect", e);
    };
    device.addEventListener("gattserverdisconnected", onDisconnect);

    return transport;
  }

  static disconnect = async (id: *) => {
    logSubject.next({
      type: "verbose",
      message: `user disconnect(${id})`
    });
    const transport = transportsCache[id];
    if (transport) {
      transport.device.gatt.disconnect();
    }
  };

  id: string;

  device: Device;

  mtuSize: number = 20;

  writeCharacteristic: Characteristic;

  notifyObservable: Observable<Buffer>;

  notYetDisconnected = true;

  constructor(
    device: Device,
    writeCharacteristic: Characteristic,
    notifyObservable: Observable<*>
  ) {
    super();
    this.id = device.id;
    this.device = device;
    this.writeCharacteristic = writeCharacteristic;
    this.notifyObservable = notifyObservable;

    logSubject.next({
      type: "verbose",
      message: `BleTransport(${String(this.id)}) new instance`
    });
  }

  async reconnect() {
    await this.device.gatt.disconnect();
    await this.device.gatt.connect();
  }

  async inferMTU() {
    let mtu = 23;

    await this.exchangeAtomicImpl(async () => {
      try {
        mtu =
          (await merge(
            this.notifyObservable.pipe(
              first(buffer => buffer.readUInt8(0) === 0x08),
              map(buffer => buffer.readUInt8(5)),
              timeout(30000)
            ),
            defer(() => from(this.write(Buffer.from([0x08, 0, 0, 0, 0])))).pipe(
              ignoreElements()
            )
          ).toPromise()) + 3;

        // workaround for #279
        await this.reconnect();
      } catch (e) {
        logSubject.next({
          type: "ble-error",
          message: "inferMTU got " + String(e)
        });
        await this.device.gatt.disconnect().catch(() => {});
        throw e;
      }
    });

    if (mtu > 23) {
      const mtuSize = mtu - 3;
      logSubject.next({
        type: "verbose",
        message: `BleTransport(${String(this.id)}) mtu set to ${String(
          mtuSize
        )}`
      });
      this.mtuSize = mtuSize;
    }

    return this.mtuSize;
  }

  exchange = (apdu: Buffer): Promise<Buffer> =>
    this.exchangeAtomicImpl(async () => {
      try {
        const { debug } = this;

        const msgIn = apdu.toString("hex");
        if (debug) debug(`=> ${msgIn}`); // eslint-disable-line no-console
        logSubject.next({ type: "ble-apdu-write", message: msgIn });

        const data = await merge(
          this.notifyObservable.pipe(receiveAPDU),
          sendAPDU(this.write, apdu, this.mtuSize)
        ).toPromise();

        const msgOut = data.toString("hex");
        logSubject.next({ type: "ble-apdu-read", message: msgOut });
        if (debug) debug(`<= ${msgOut}`); // eslint-disable-line no-console

        return data;
      } catch (e) {
        logSubject.next({
          type: "ble-error",
          message: "exchange got " + String(e)
        });
        if (this.notYetDisconnected) {
          // in such case we will always disconnect because something is bad.
          this.device.gatt.disconnect();
        }
        throw e;
      }
    });

  setScrambleKey() {}

  write = async (buffer: Buffer) => {
    logSubject.next({
      type: "ble-frame-write",
      message: buffer.toString("hex")
    });
    await this.writeCharacteristic.writeValue(buffer);
  };

  async close() {
    if (this.exchangeBusyPromise) {
      await this.exchangeBusyPromise;
    }
  }
}
