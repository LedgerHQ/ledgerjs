//@flow

import EventEmitter from "events";

/**
 */
export type Subscription = { unsubscribe: () => void };

/**
 */
export type Device = Object;

/**
 */
export type DescriptorEvent<Descriptor> = {
  type: "add" | "remove",
  descriptor: Descriptor,
  device?: Device
};
/**
 */
export type Observer<Ev> = {
  next: (event: Ev) => void,
  error: (e: ?Error) => void,
  complete: () => void
};

/**
 * all possible status codes.
 * @see https://ledgerhq.github.io/btchip-doc/bitcoin-technical.html#_status_words
 * @example
 * import { StatusCodes } from "@ledgerhq/hw-transport";
 */
export const StatusCodes = {
  /**
   * Incorrect length
   */
  IncorrectLength: 0x6700,
  /**
   * Security status not satisfied (Bitcoin dongle is locked or invalid access rights)
   */
  SecurityNotSatisfied: 0x6982,
  /**
   * Invalid data
   */
  InvalidData: 0x6a80,
  /**
   * File not found
   */
  FileNotFound: 0x6a82,
  /**
   * Incorrect parameter P1 or P2
   */
  IncorrectParameter: 0x6b00,
  /**
   * Success
   */
  Success: 0x9000
};

/**
 * TransportError is used for any generic transport errors.
 * e.g. Error thrown when data received by exchanges are incorrect or if exchanged failed to communicate with the device for various reason.
 */
export function TransportError(message: string, id: string) {
  this.name = "TransportError";
  this.message = message;
  this.stack = new Error().stack;
  this.id = id;
}
//$FlowFixMe
TransportError.prototype = new Error();

/**
 * Error thrown when a device returned a non success status.
 * the error.statusCode is one of the `StatusCodes` exported by this library.
 */
export function TransportStatusError(statusCode: number) {
  this.name = "TransportStatusError";
  this.message = "Invalid status " + statusCode.toString(16);
  this.stack = new Error().stack;
  this.statusCode = statusCode;
}
//$FlowFixMe
TransportStatusError.prototype = new Error();

/**
 * Transport defines the generic interface to share between node/u2f impl
 * A **Descriptor** is a parametric type that is up to be determined for the implementation.
 * it can be for instance an ID, an file path, a URL,...
 */
export default class Transport<Descriptor> {
  debug: boolean = false;
  exchangeTimeout: number = 30000;

  /**
   * Statically check if a transport is supported on the user's platform/browser.
   */
  static +isSupported: () => Promise<boolean>;

  /**
   * List once all available descriptors. For a better granularity, checkout `listen()`.
   * @return a promise of descriptors
   * @example
   * TransportFoo.list().then(descriptors => ...)
   */
  static +list: () => Promise<Array<Descriptor>>;

  /**
   * Listen all device events for a given Transport. The method takes an Obverver of DescriptorEvent and returns a Subscription (according to Observable paradigm https://github.com/tc39/proposal-observable )
   * a DescriptorEvent is a `{ descriptor, type }` object. type can be `"add"` or `"remove"` and descriptor is a value you can pass to `open(descriptor)`.
   * each listen() call will first emit all potential device already connected and then will emit events can come over times,
   * for instance if you plug a USB device after listen() or a bluetooth device become discoverable.
   * @param observer is an object with a next, error and complete function (compatible with observer pattern)
   * @return a Subscription object on which you can `.unsubscribe()` to stop listening descriptors.
   * @example
const sub = TransportFoo.listen({
  next: e => {
    if (e.type==="add") {
      sub.unsubscribe();
      const transport = await TransportFoo.open(e.descriptor);
      ...
    }
  },
  error: error => {},
  complete: () => {}
})
   */
  static +listen: (
    observer: Observer<DescriptorEvent<Descriptor>>
  ) => Subscription;

  /**
   * attempt to create a Transport instance with potentially a descriptor.
   * @param descriptor: the descriptor to open the transport with.
   * @param timeout: an optional timeout
   * @return a Promise of Transport instance
   * @example
TransportFoo.open(descriptor).then(transport => ...)
   */
  static +open: (
    descriptor: Descriptor,
    timeout?: number
  ) => Promise<Transport<Descriptor>>;

  /**
   * low level api to communicate with the device
   * This method is for implementations to implement but should not be directly called.
   * Instead, the recommanded way is to use send() method
   * @param apdu the data to send
   * @return a Promise of response data
   */
  +exchange: (apdu: Buffer) => Promise<Buffer>;

  /**
   * set the "scramble key" for the next exchanges with the device.
   * Each App can have a different scramble key and they internally will set it at instanciation.
   * @param key the scramble key
   */
  +setScrambleKey: (key: string) => void;

  /**
   * close the exchange with the device.
   * @return a Promise that ends when the transport is closed.
   */
  +close: () => Promise<void>;

  _events = new EventEmitter();

  /**
   * Listen to an event on an instance of transport.
   * Transport implementation can have specific events. Here is the common events:
   * * `"disconnect"` : triggered if Transport is disconnected
   */
  on(eventName: string, cb: Function) {
    this._events.on(eventName, cb);
  }

  /**
   * Stop listening to an event on an instance of transport.
   */
  off(eventName: string, cb: Function) {
    this._events.removeListener(eventName, cb);
  }

  emit(event: string, ...args: *) {
    this._events.emit(event, ...args);
  }

  /**
   * Enable or not logs of the binary exchange
   */
  setDebugMode(debug: boolean) {
    this.debug = debug;
  }

  /**
   * Set a timeout (in milliseconds) for the exchange call. Only some transport might implement it. (e.g. U2F)
   */
  setExchangeTimeout(exchangeTimeout: number) {
    this.exchangeTimeout = exchangeTimeout;
  }

  /**
   * wrapper on top of exchange to simplify work of the implementation.
   * @param cla
   * @param ins
   * @param p1
   * @param p2
   * @param data
   * @param statusList is a list of accepted status code (shorts). [0x9000] by default
   * @return a Promise of response buffer
   */
  send = async (
    cla: number,
    ins: number,
    p1: number,
    p2: number,
    data: Buffer = Buffer.alloc(0),
    statusList: Array<number> = [StatusCodes.Success]
  ): Promise<Buffer> => {
    if (data.length >= 256) {
      throw new TransportError(
        "data.length exceed 256 bytes limit. Got: " + data.length,
        "DataLengthTooBig"
      );
    }
    const response = await this.exchange(
      Buffer.concat([
        Buffer.from([cla, ins, p1, p2]),
        Buffer.from([data.length]),
        data
      ])
    );
    const sw = response.readUInt16BE(response.length - 2);
    if (!statusList.some(s => s === sw)) {
      throw new TransportStatusError(sw);
    }
    return response;
  };

  /**
   * create() allows to open the first descriptor available or
   * throw if there is none or if timeout is reached.
   * This is a light helper, alternative to using listen() and open() (that you may need for any more advanced usecase)
   * @example
TransportFoo.create().then(transport => ...)
   */
  static create(openTimeout?: number = 5000): Promise<Transport<Descriptor>> {
    if (arguments.length > 1) {
      console.warn(
        this.name +
          ".create: second parameter 'debugMode' has been dropped. instead, please use transport.setDebugMode(debug)"
      );
    }
    return new Promise((resolve, reject) => {
      let found = false;
      const openTimeoutId = setTimeout(() => {
        sub.unsubscribe();
        reject(new TransportError("Transport openTimeout", "OpenTimeout"));
      }, openTimeout);
      const sub = this.listen({
        next: e => {
          found = true;
          sub.unsubscribe();
          clearTimeout(openTimeoutId);
          this.open(e.descriptor, openTimeout).then(resolve, reject);
        },
        error: e => {
          clearTimeout(openTimeoutId);
          reject(e);
        },
        complete: () => {
          clearTimeout(openTimeoutId);
          if (!found) {
            reject(new TransportError("No device found", "NoDeviceFound"));
          }
        }
      });
    });
  }
}
