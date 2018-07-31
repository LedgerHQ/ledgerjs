//@flow

import HID from "node-hid";
import Transport, { TransportError } from "@ledgerhq/hw-transport";
import type {
  Observer,
  DescriptorEvent,
  Subscription
} from "@ledgerhq/hw-transport";
import getDevices from "./getDevices";
import listenDevices from "./listenDevices";

// FIXME drop
type Defer<T> = {
  promise: Promise<T>,
  resolve: T => void,
  reject: any => void
};
function defer<T>(): Defer<T> {
  let resolve, reject;
  let promise = new Promise(function(success, failure) {
    resolve = success;
    reject = failure;
  });
  if (!resolve || !reject) throw new Error("defer() error"); // this never happens and is just to make flow happy
  return { promise, resolve, reject };
}

let listenDevicesDebounce = 500;
let listenDevicesPollingSkip = () => false;
let listenDevicesDebug = () => {};

/**
 * node-hid Transport implementation
 * @example
 * import TransportNodeHid from "@ledgerhq/hw-transport-node-u2f";
 * ...
 * TransportNodeHid.create().then(transport => ...)
 */
export default class TransportNodeHid extends Transport<string> {
  device: HID.HID;
  ledgerTransport: boolean;
  timeout: number;
  exchangeStack: Array<*>;

  constructor(
    device: HID.HID,
    ledgerTransport: boolean = true, // FIXME not used?
    timeout: number = 0 // FIXME not used?
  ) {
    super();
    this.device = device;
    this.ledgerTransport = ledgerTransport;
    this.timeout = timeout;
    this.exchangeStack = [];
  }

  static isSupported = (): Promise<boolean> =>
    Promise.resolve(typeof HID.HID === "function");

  static list = (): Promise<string[]> =>
    Promise.resolve(getDevices().map(d => d.path));

  static setListenDevicesDebounce = (delay: number) => {
    listenDevicesDebounce = delay;
  };

  static setListenDevicesPollingSkip = (conditionToSkip: () => boolean) => {
    listenDevicesPollingSkip = conditionToSkip;
  };

  static setListenDevicesDebug = (debug: boolean | ((log: string) => void)) => {
    listenDevicesDebug =
      typeof debug === "function"
        ? debug
        : debug
          ? (...log) => console.log("[listenDevices]", ...log)
          : () => {};
  };

  /**
   */
  static listen = (
    observer: Observer<DescriptorEvent<string>>
  ): Subscription => {
    let unsubscribed = false;
    Promise.resolve(getDevices()).then(devices => {
      // this needs to run asynchronously so the subscription is defined during this phase
      for (const device of devices) {
        if (!unsubscribed) {
          const descriptor: string = device.path;
          observer.next({ type: "add", descriptor, device });
        }
      }
    });
    const { events, stop } = listenDevices(
      listenDevicesDebounce,
      listenDevicesPollingSkip,
      listenDevicesDebug
    );

    const onAdd = device => {
      if (unsubscribed || !device) return;
      observer.next({ type: "add", descriptor: device.path, device });
    };
    const onRemove = device => {
      if (unsubscribed || !device) return;
      observer.next({ type: "remove", descriptor: device.path, device });
    };
    events.on("add", onAdd);
    events.on("remove", onRemove);
    function unsubscribe() {
      unsubscribed = true;
      events.removeListener("add", onAdd);
      events.removeListener("remove", onRemove);
      stop();
    }
    return { unsubscribe };
  };

  /**
   */
  static async open(path: string) {
    return Promise.resolve(new TransportNodeHid(new HID.HID(path)));
  }

  exchange(apdu: Buffer): Promise<Buffer> {
    function ledgerWrap(channel, command, packetSize) {
      let sequenceIdx = 0;
      let offset = 0;

      let tmp = Buffer.alloc(7);
      tmp.writeUInt16BE(channel, 0);
      tmp[2] = 0x05; // TAG_APDU
      tmp.writeUInt16BE(sequenceIdx, 3);
      sequenceIdx++;
      tmp.writeUInt16BE(command.length, 5);
      let blockSize =
        command.length > packetSize - 7 ? packetSize - 7 : command.length;
      let result = Buffer.concat(
        [tmp, command.slice(offset, offset + blockSize)],
        blockSize + 7
      );
      offset += blockSize;
      while (offset !== command.length) {
        tmp = Buffer.alloc(5);
        tmp.writeUInt16BE(channel, 0);
        tmp[2] = 0x05; // TAG_APDU
        tmp.writeUInt16BE(sequenceIdx, 3);
        sequenceIdx++;
        blockSize =
          command.length - offset > packetSize - 5
            ? packetSize - 5
            : command.length - offset;
        result = Buffer.concat(
          [result, tmp, command.slice(offset, offset + blockSize)],
          result.length + blockSize + 5
        );
        offset += blockSize;
      }
      return result;
    }

    function ledgerUnwrap(channel, data, packetSize) {
      let offset = 0;
      let responseLength;
      let sequenceIdx = 0;
      let response;
      if (typeof data === "undefined" || data.length < 7 + 5) {
        return;
      }
      if (data[offset++] !== channel >> 8) {
        throw new TransportError("Invalid channel", "InvalidChannel");
      }
      if (data[offset++] !== (channel & 0xff)) {
        throw new TransportError("Invalid channel", "InvalidChannel");
      }
      if (data[offset++] !== 0x05) {
        throw new TransportError("Invalid tag", "InvalidTag");
      }
      if (data[offset++] !== 0x00) {
        throw new TransportError("Invalid sequence", "InvalidSequence");
      }
      if (data[offset++] !== 0x00) {
        throw new TransportError("Invalid sequence", "InvalidSequence");
      }
      responseLength = (data[offset++] & 0xff) << 8;
      responseLength |= data[offset++] & 0xff;
      if (data.length < 7 + responseLength) {
        return;
      }
      let blockSize =
        responseLength > packetSize - 7 ? packetSize - 7 : responseLength;
      response = data.slice(offset, offset + blockSize);
      offset += blockSize;
      while (response.length !== responseLength) {
        sequenceIdx++;
        if (offset === data.length) {
          return;
        }
        if (data[offset++] !== channel >> 8) {
          throw new TransportError("Invalid channel", "InvalidChannel");
        }
        if (data[offset++] !== (channel & 0xff)) {
          throw new TransportError("Invalid channel", "InvalidChannel");
        }
        if (data[offset++] !== 0x05) {
          throw new TransportError("Invalid tag", "InvalidTag");
        }
        if (data[offset++] !== sequenceIdx >> 8) {
          throw new TransportError("Invalid sequence", "InvalidSequence");
        }
        if (data[offset++] !== (sequenceIdx & 0xff)) {
          throw new TransportError("Invalid sequence", "InvalidSequence");
        }
        blockSize =
          responseLength - response.length > packetSize - 5
            ? packetSize - 5
            : responseLength - response.length;
        if (blockSize > data.length - offset) {
          return;
        }
        response = Buffer.concat(
          [response, data.slice(offset, offset + blockSize)],
          response.length + blockSize
        );
        offset += blockSize;
      }
      return response;
    }

    const deferred = defer();
    let exchangeTimeout;
    let transport;
    if (!this.ledgerTransport) {
      transport = apdu;
    } else {
      transport = ledgerWrap(0x0101, apdu, 64);
    }

    if (this.timeout !== 0) {
      exchangeTimeout = setTimeout(() => {
        // Node.js supports timeouts
        deferred.reject(new TransportError("timeout", "timeout"));
      }, this.timeout);
    }

    // enter the exchange wait list
    this.exchangeStack.push(deferred);

    if (this.exchangeStack.length === 1) {
      const processNextExchange = () => {
        // don't pop it now, to avoid multiple at once
        const deferred = this.exchangeStack[0];

        const send = content => {
          const { debug } = this;
          if (debug) {
            debug("=>" + content.toString("hex"));
          }
          const data = [0x00];
          for (let i = 0; i < content.length; i++) {
            data.push(content[i]);
          }
          this.device.write(data);
          return Promise.resolve(content.length);
        };

        const recv = () =>
          new Promise((resolve, reject) =>
            this.device.read((err, res) => {
              if (err || !res) reject(err);
              else {
                const buffer = Buffer.from(res);
                const { debug } = this;
                if (debug) {
                  debug("<=" + buffer.toString("hex"));
                }
                resolve(buffer);
              }
            })
          );

        const performExchange = () => {
          let offsetSent = 0;
          let firstReceived = true;
          let toReceive = 0;

          let received = Buffer.alloc(0);
          const sendPart = () => {
            if (offsetSent === transport.length) {
              return receivePart();
            }
            const blockSize =
              transport.length - offsetSent > 64
                ? 64
                : transport.length - offsetSent;
            let block = transport.slice(offsetSent, offsetSent + blockSize);
            const paddingSize = 64 - block.length;
            if (paddingSize !== 0) {
              let padding = Buffer.alloc(paddingSize).fill(0);
              block = Buffer.concat(
                [block, padding],
                block.length + paddingSize
              );
            }
            return send(block).then(() => {
              offsetSent += blockSize;
              return sendPart();
            });
          };

          const receivePart = () => {
            if (!this.ledgerTransport) {
              return recv().then(result => {
                received = Buffer.concat(
                  [received, result],
                  received.length + result.length
                );
                if (firstReceived) {
                  firstReceived = false;
                  if (received.length === 2 || received[0] !== 0x61) {
                    return received;
                  } else {
                    toReceive = received[1];
                    if (toReceive === 0) {
                      toReceive = 256;
                    }
                    toReceive += 2;
                  }
                }
                if (toReceive < 64) {
                  return received;
                } else {
                  toReceive -= 64;
                  return receivePart();
                }
              });
            } else {
              return recv().then(result => {
                received = Buffer.concat(
                  [received, result],
                  received.length + result.length
                );
                const response = ledgerUnwrap(0x0101, received, 64);
                if (typeof response !== "undefined") {
                  return response;
                } else {
                  return receivePart();
                }
              });
            }
          };
          return sendPart();
        };

        performExchange()
          .then(result => {
            let response,
              resultBin = result;
            if (!this.ledgerTransport) {
              if (resultBin.length === 2 || resultBin[0] !== 0x61) {
                response = resultBin;
              } else {
                let size = resultBin[1];
                // fake T0
                if (size === 0) {
                  size = 256;
                }
                response = resultBin.slice(2);
              }
            } else {
              response = resultBin;
            }
            // build the response
            if (this.timeout !== 0) {
              clearTimeout(exchangeTimeout);
            }
            return response;
          })
          .then(
            response => {
              // consume current promise
              this.exchangeStack.shift();

              // schedule next exchange
              if (this.exchangeStack.length > 0) {
                processNextExchange();
              }
              return response;
            },
            (err: Error) => {
              if (this.timeout !== 0) {
                clearTimeout(exchangeTimeout);
              }
              throw err;
            }
          )
          // plug to deferred
          .then(deferred.resolve, deferred.reject);
      };

      // schedule next exchange
      processNextExchange();
    }

    // the exchangeStack will process the promise when possible
    return deferred.promise;
  }

  setScrambleKey() {}

  close(): Promise<void> {
    this.device.close();
    return Promise.resolve();
  }
}
