//@flow

import invariant from "invariant";
import EventEmitter from "events";

export type Subscription = { unsubscribe: () => void };
export type Observer<T> = {
  next: (descriptor: T) => void,
  error: (e: ?Error) => void,
  complete: () => void
};

/**
 * Transport defines the generic interface to share between node/u2f impl
 * A **Descriptor** is a parametric type that is up to be determined for the implementation.
 * it can be for instance an ID, an file path, a URL,...
 */
export default class Transport<Descriptor> {
  debug: boolean = false;

  /**
   * List once all available descriptors. For a better granularity, checkout `discover()`.
   * @return a promise of descriptors
   * @example
   * TransportFoo.list().then(descriptors => ...)
   */
  static +list: () => Promise<Array<Descriptor>>;

  /**
   * Listen all descriptors that can be opened. This will call cb() with all available descriptors
   * and then the new ones that gets discovered in the future until unsubscribe is called.
   * events can come over times, for instance if you plug a USB device after listen() or a bluetooth device become discoverable
   * @param observer is an object with a next, error and complete function (compatible with observer pattern)
   * @return a Subscription object on which you can `.unsubscribe()` to stop discovering descriptors.
   * @example
const sub = TransportFoo.discover(async descriptor => {
  sub.unsubscribe();
  const transport = await TransportFoo.open(descriptor);
  ...
})
   */
  static +discover: (observer: Observer<Descriptor>) => Subscription;

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
    statusList: Array<number> = [0x9000]
  ): Promise<Buffer> => {
    invariant(
      data.length < 256,
      "data.length exceed 256 bytes limit. Got: %s",
      data.length
    );
    const response = await this.exchange(
      Buffer.concat([
        Buffer.from([cla, ins, p1, p2]),
        Buffer.from([data.length]),
        data
      ])
    );
    const sw = response.readUInt16BE(response.length - 2);
    invariant(
      statusList.some(s => s === sw),
      "Invalid status %s",
      sw.toString(16)
    );
    return response;
  };

  /**
   * create() allows to open the first descriptor available or throw if there is none.
   * **DEPRECATED**: use `list()` or `discover()` and `open()` instead.
   */
  static async create(
    timeout?: number,
    debug?: boolean = false
  ): Promise<Transport<Descriptor>> {
    console.warn(
      this.name +
        ".create is deprecated. Please use .list()/.discover() and .open() instead"
    );
    const descriptors = await this.list();
    invariant(descriptors.length !== 0, "No device found");
    const transport = await this.open(descriptors[0], timeout);
    transport.setDebugMode(debug);
    return transport;
  }
}
