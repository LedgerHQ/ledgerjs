//@flow

import invariant from "invariant";
import EventEmitter from "events";

export type Subscription = { unsubscribe: () => void };
export type Observer<T> = {
  onNext: (descriptor: T) => void,
  onError: (e: ?Error) => void,
  onDone: () => void
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
   * @param observer is an object with a onNext, onError and onDone function (compatible with observer pattern)
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
   * TODO: in the future we'll refactor this to be Buffer=>Buffer instead
   * @param apduHex hex string of the data to send
   * @param statusList an array of accepted status code to be considered successful
   * @return a Promise of hex string response data
   */
  +exchange: (apduHex: string, statusList: Array<number>) => Promise<string>;

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
   * @return a Promise of response buffer
   */
  send = async (
    cla: number,
    ins: number,
    p1: number,
    p2: number,
    data: Buffer = Buffer.alloc(0)
  ): Promise<Buffer> => {
    invariant(
      data.length < 256,
      "data.length exceed 256 bytes limit. Got: %s",
      data.length
    );
    return Buffer.from(
      await this.exchange(
        Buffer.concat([
          Buffer.from([cla, ins, p1, p2]),
          Buffer.from([data.length]),
          data
        ]).toString("hex"),
        [0x9000]
      ),
      "hex"
    );
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
    if (descriptors.length === 0) {
      throw "No device found";
    }
    const transport = await this.open(descriptors[0], timeout);
    transport.setDebugMode(debug);
    return transport;
  }
}
