//@flow
import Transport from "@ledgerhq/hw-transport";
import invariant from "invariant";
import { BleManager } from "react-native-ble-plx";

const ServiceUuid = "d973f2e0-b19e-11e2-9e96-0800200c9a66";
const WriteCharacteristicUuid = "d973f2e2-b19e-11e2-9e96-0800200c9a66";
const NotifyCharacteristicUuid = "d973f2e1-b19e-11e2-9e96-0800200c9a66";
const MaxChunkBytes = 20;
const TagId = 0x05;

type Device = *;
type Characteristic = *;

function chunkBuffer(
  buffer: Buffer,
  sizeForIndex: number => number
): Array<Buffer> {
  const chunks = [];
  for (
    let i = 0, size = sizeForIndex(0);
    i < buffer.length;
    i += size, size = sizeForIndex(i)
  ) {
    chunks.push(buffer.slice(i, i + size));
  }
  return chunks;
}

function receive(characteristic, debug) {
  let subscription;
  const promise = new Promise((resolve, reject) => {
    let notifiedIndex = 0,
      notifiedDataLength = 0,
      notifiedData = Buffer.alloc(0);
    subscription = characteristic.monitor((error, c) => {
      if (error) return reject(error);
      try {
        const value = Buffer.from(c.value, "base64");
        if (debug) {
          console.log("<=", value.toString("hex"));
        }
        const tag = value.readUInt8(0);
        const index = value.readUInt16BE(1);
        let data = value.slice(3);
        invariant(
          tag === TagId,
          "BLE: tag should be 05. Got %s",
          tag.toString(16)
        );
        invariant(
          notifiedIndex === index,
          "BLE: discontinued chunk. Received %s but expected %s",
          index,
          notifiedIndex
        );
        if (index === 0) {
          notifiedDataLength = data.readUInt16BE(0);
          data = data.slice(2);
        }
        notifiedIndex++;
        notifiedData = Buffer.concat([notifiedData, data]);
        invariant(
          notifiedData.length <= notifiedDataLength,
          "BLE: received too much data. Excepted %s, received %s",
          notifiedDataLength,
          notifiedData.length
        );
        if (notifiedData.length === notifiedDataLength) {
          resolve(notifiedData);
        }
      } catch (e) {
        reject(e);
      }
    });
  });
  invariant(subscription, "subscription defined");
  return { promise, subscription };
}

async function send(characteristic, apdu, termination, debug) {
  const chunks = chunkBuffer(apdu, i => MaxChunkBytes - (i === 0 ? 5 : 3)).map(
    (buffer, i) => {
      const head = Buffer.alloc(i === 0 ? 5 : 3);
      head.writeUInt8(TagId, 0);
      head.writeUInt16BE(i, 1);
      if (i === 0) {
        head.writeUInt16BE(apdu.length, 3);
      }
      return Buffer.concat([head, buffer]);
    }
  );
  let terminated = false;
  termination.then(() => {
    terminated = true;
  });
  for (let chunk of chunks) {
    if (terminated) return;
    if (debug) {
      console.log("=>", chunk.toString("hex"));
    }
    await characteristic.writeWithResponse(chunk.toString("base64"));
  }
}

/**
 * react-native bluetooth BLE implementation
 * @example
 * import BluetoothTransport from "@ledgerhq/react-native-hw-transport-ble";
 */
export default class BluetoothTransport extends Transport<Device> {
  static list = (): * => Promise.resolve([]);

  /**
   */
  static listen(observer: *) {
    let bleManager;
    try {
      bleManager = new BleManager();
    } catch (e) {
      // basically for the tests to pass
      console.warn(e);
      return { unsubscribe: () => {} };
    }
    const unsubscribe = () => {
      sub.remove();
      bleManager.stopDeviceScan();
    };
    const onBleStateChange = (state: string) => {
      if (state === "PoweredOn") {
        bleManager.startDeviceScan(null, null, (bleError, device) => {
          if (bleError) {
            observer.error(bleError);
            unsubscribe();
            return;
          }
          if (device.name !== "Blue") return;
          //if (device.rssi < -50) return; // HACK to filter very close device
          console.log(device);
          observer.next({ type: "add", descriptor: device });
        });
        if (sub) sub.remove();
      } else if (state === "Unsupported") {
        unsubscribe();
        observer.error(new Error("Bluetooth BLE is not supported"));
      }
    };
    const sub = bleManager.onStateChange(onBleStateChange, true);
    return { unsubscribe };
  }

  /**
   */
  static async open(device: Device) {
    await device.connect();
    await device.discoverAllServicesAndCharacteristics();
    /*
    const services = await device.services();
    for (const service of services) {
      const characteristics = await service.characteristics();
    }
    */
    const characteristics = await device.characteristicsForService(ServiceUuid);
    invariant(characteristics, "service found");
    let writeC, notifyC;
    for (const c of characteristics) {
      if (c.uuid === WriteCharacteristicUuid) {
        writeC = c;
      } else if (c.uuid === NotifyCharacteristicUuid) {
        notifyC = c;
      }
    }
    invariant(writeC, "write characteristic found");
    invariant(notifyC, "notify characteristic found");
    invariant(notifyC.isNotifiable, "isNotifiable expected");
    invariant(writeC.isWritableWithResponse, "isWritableWithResponse expected");
    return new BluetoothTransport(device, writeC, notifyC);
  }

  device: Device;
  writeCharacteristic: Characteristic;
  notifyCharacteristic: Characteristic;
  constructor(
    device: Device,
    writeCharacteristic: Characteristic,
    notifyCharacteristic: Characteristic
  ) {
    super();
    this.device = device;
    this.writeCharacteristic = writeCharacteristic;
    this.notifyCharacteristic = notifyCharacteristic;
    device.onDisconnected(e => {
      if (this.debug) {
        console.log("BLE disconnect", this.device);
      }
      this.emit("disconnect", e);
    });
  }

  busy = false;
  async exchange(apdu: Buffer): Promise<Buffer> {
    invariant(!this.busy, "exchange() race condition");
    this.busy = true;
    let receiving;
    try {
      receiving = receive(this.notifyCharacteristic, this.debug);
      send(this.writeCharacteristic, apdu, receiving.promise, this.debug);
      const data = await receiving.promise;
      return data;
    } finally {
      this.busy = false;
      if (receiving) {
        receiving.subscription.remove();
      }
    }
  }

  setScrambleKey() {}

  close(): Promise<void> {
    return Promise.resolve();
  }
}
