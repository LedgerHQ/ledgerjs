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
export type Observer<Ev> = $ReadOnly<{
  next: (event: Ev) => mixed,
  error: (e: any) => mixed,
  complete: () => mixed
}>;

/**
 * all possible status codes.
 * @see https://github.com/LedgerHQ/blue-app-btc/blob/d8a03d10f77ca5ef8b22a5d062678eef788b824a/include/btchip_apdu_constants.h#L85-L115
 * @example
 * import { StatusCodes } from "@ledgerhq/hw-transport";
 */
export const StatusCodes = {
  PIN_REMAINING_ATTEMPTS: 0x63c0,
  INCORRECT_LENGTH: 0x6700,
  COMMAND_INCOMPATIBLE_FILE_STRUCTURE: 0x6981,
  SECURITY_STATUS_NOT_SATISFIED: 0x6982,
  CONDITIONS_OF_USE_NOT_SATISFIED: 0x6985,
  INCORRECT_DATA: 0x6a80,
  NOT_ENOUGH_MEMORY_SPACE: 0x6a84,
  REFERENCED_DATA_NOT_FOUND: 0x6a88,
  FILE_ALREADY_EXISTS: 0x6a89,
  INCORRECT_P1_P2: 0x6b00,
  INS_NOT_SUPPORTED: 0x6d00,
  CLA_NOT_SUPPORTED: 0x6e00,
  TECHNICAL_PROBLEM: 0x6f00,
  OK: 0x9000,
  MEMORY_PROBLEM: 0x9240,
  NO_EF_SELECTED: 0x9400,
  INVALID_OFFSET: 0x9402,
  FILE_NOT_FOUND: 0x9404,
  INCONSISTENT_FILE: 0x9408,
  ALGORITHM_NOT_SUPPORTED: 0x9484,
  INVALID_KCV: 0x9485,
  CODE_NOT_INITIALIZED: 0x9802,
  ACCESS_CONDITION_NOT_FULFILLED: 0x9804,
  CONTRADICTION_SECRET_CODE_STATUS: 0x9808,
  CONTRADICTION_INVALIDATION: 0x9810,
  CODE_BLOCKED: 0x9840,
  MAX_VALUE_REACHED: 0x9850,
  GP_AUTH_FAILED: 0x6300,
  LICENSING: 0x6f42,
  HALTED: 0x6faa
};

export function getAltStatusMessage(code: number): ?string {
  switch (code) {
    // improve text of most common errors
    case 0x6700:
      return "Incorrect length";
    case 0x6982:
      return "Security not satisfied (dongle locked or have invalid access rights)";
    case 0x6985:
      return "Condition of use not satisfied (denied by the user?)";
    case 0x6a80:
      return "Invalid data received";
    case 0x6b00:
      return "Invalid parameter received";
  }
  if (0x6f00 <= code && code <= 0x6fff) {
    return "Internal error, please report";
  }
}

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
  const statusText =
    Object.keys(StatusCodes).find(k => StatusCodes[k] === statusCode) ||
    "UNKNOWN_ERROR";
  const smsg = getAltStatusMessage(statusCode) || statusText;
  const statusCodeStr = statusCode.toString(16);
  this.message = `Ledger device: ${smsg} (0x${statusCodeStr})`;
  this.stack = new Error().stack;
  this.statusCode = statusCode;
  this.statusText = statusText;
}
//$FlowFixMe
TransportStatusError.prototype = new Error();

/**
 * Transport defines the generic interface to share between node/u2f impl
 * A **Descriptor** is a parametric type that is up to be determined for the implementation.
 * it can be for instance an ID, an file path, a URL,...
 */
export default class Transport<Descriptor> {
  debug: ?(log: string) => void = global.__ledgerDebug || null;
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
  setDebugMode(debug: boolean | ((log: string) => void)) {
    this.debug =
      typeof debug === "function"
        ? debug
        : debug
          ? log => console.log(log)
          : null;
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
    statusList: Array<number> = [StatusCodes.OK]
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
  static create(
    openTimeout?: number = 3000,
    listenTimeout?: number
  ): Promise<Transport<Descriptor>> {
    return new Promise((resolve, reject) => {
      let found = false;
      const sub = this.listen({
        next: e => {
          found = true;
          if (sub) sub.unsubscribe();
          if (listenTimeoutId) clearTimeout(listenTimeoutId);
          this.open(e.descriptor, openTimeout).then(resolve, reject);
        },
        error: e => {
          if (listenTimeoutId) clearTimeout(listenTimeoutId);
          reject(e);
        },
        complete: () => {
          if (listenTimeoutId) clearTimeout(listenTimeoutId);
          if (!found) {
            reject(
              new TransportError(
                this.ErrorMessage_NoDeviceFound,
                "NoDeviceFound"
              )
            );
          }
        }
      });
      const listenTimeoutId = listenTimeout
        ? setTimeout(() => {
            sub.unsubscribe();
            reject(
              new TransportError(
                this.ErrorMessage_ListenTimeout,
                "ListenTimeout"
              )
            );
          }, listenTimeout)
        : null;
    });
  }

  decorateAppAPIMethods(
    self: Object,
    methods: Array<string>,
    scrambleKey: string
  ) {
    for (let methodName of methods) {
      self[methodName] = this.decorateAppAPIMethod(
        methodName,
        self[methodName],
        self,
        scrambleKey
      );
    }
  }

  _appAPIlock = null;
  decorateAppAPIMethod<R, A: any[]>(
    methodName: string,
    f: (...args: A) => Promise<R>,
    ctx: *,
    scrambleKey: string
  ): (...args: A) => Promise<R> {
    return async (...args) => {
      const { _appAPIlock } = this;
      if (_appAPIlock) {
        const e = new TransportError(
          "Ledger Device is busy (lock " + _appAPIlock + ")",
          "TransportLocked"
        );
        Object.assign(e, {
          currentLock: _appAPIlock,
          methodName
        });
        return Promise.reject(e);
      }
      try {
        this._appAPIlock = methodName;
        this.setScrambleKey(scrambleKey);
        return await f.apply(ctx, args);
      } finally {
        this._appAPIlock = null;
      }
    };
  }

  static ErrorMessage_ListenTimeout = "No Ledger device found (timeout)";
  static ErrorMessage_NoDeviceFound = "No Ledger device found";
}
