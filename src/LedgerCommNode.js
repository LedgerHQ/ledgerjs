/********************************************************************************
 *   Ledger Node JS API
 *   (c) 2016-2017 Ledger
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ********************************************************************************/
//@flow

import HID from "node-hid";

import { defer } from "./utils";
import LedgerComm from "./LedgerComm";

export default class LedgerNode extends LedgerComm {
  device: HID.HID;
  ledgerTransport: boolean;
  timeout: number;
  debug: boolean;
  exchangeStack: Array<*>;

  constructor(
    device: HID.HID,
    ledgerTransport: boolean,
    timeout: number = 0,
    debug: boolean = false
  ) {
    super();
    this.device = device;
    this.ledgerTransport = ledgerTransport;
    this.timeout = timeout;
    this.exchangeStack = [];
    this.debug = debug;
  }

  static list_async = (): Promise<Array<string>> =>
    Promise.resolve(
      HID.devices()
        .filter(
          device =>
            (device.vendorId === 0x2581 && device.productId === 0x3b7c) ||
            device.vendorId === 0x2c97
        )
        .map(d => d.path)
    );

  static create_async = (
    timeout?: number,
    debug?: boolean
  ): Promise<LedgerNode> =>
    LedgerNode.list_async().then(result => {
      if (result.length === 0) {
        throw "No device found";
      }
      return new LedgerNode(new HID.HID(result[0]), true, timeout, debug);
    });

  exchange(apduHex: string, statusList: Array<number>): Promise<string> {
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
        throw "Invalid channel;";
      }
      if (data[offset++] !== (channel & 0xff)) {
        throw "Invalid channel";
      }
      if (data[offset++] !== 0x05) {
        throw "Invalid tag";
      }
      if (data[offset++] !== 0x00) {
        throw "Invalid sequence";
      }
      if (data[offset++] !== 0x00) {
        throw "Invalid sequence";
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
          throw "Invalid channel;";
        }
        if (data[offset++] !== (channel & 0xff)) {
          throw "Invalid channel";
        }
        if (data[offset++] !== 0x05) {
          throw "Invalid tag";
        }
        if (data[offset++] !== sequenceIdx >> 8) {
          throw "Invalid sequence";
        }
        if (data[offset++] !== (sequenceIdx & 0xff)) {
          throw "Invalid sequence";
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

    const apdu = Buffer.from(apduHex, "hex");

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
        deferred.reject("timeout");
      }, this.timeout);
    }

    // enter the exchange wait list
    this.exchangeStack.push(deferred);

    if (this.exchangeStack.length === 1) {
      const processNextExchange = () => {
        // don't pop it now, to avoid multiple at once
        const deferred = this.exchangeStack[0];

        const send_async = content => {
          if (this.debug) {
            console.log("=>" + content.toString("hex"));
          }
          const data = [0x00];
          for (let i = 0; i < content.length; i++) {
            data.push(content[i]);
          }
          this.device.write(data);
          return Promise.resolve(content.length);
        };

        const recv_async = () =>
          new Promise((resolve, reject) =>
            this.device.read((err, res) => {
              if (err || !res) reject(err);
              else {
                const buffer = Buffer.from(res);
                if (this.debug) {
                  console.log("<=" + buffer.toString("hex"));
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
            return send_async(block).then(() => {
              offsetSent += blockSize;
              return sendPart();
            });
          };

          const receivePart = () => {
            if (!this.ledgerTransport) {
              return recv_async().then(result => {
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
              return recv_async().then(result => {
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
            let status,
              response,
              resultBin = result;
            if (!this.ledgerTransport) {
              if (resultBin.length === 2 || resultBin[0] !== 0x61) {
                status = (resultBin[0] << 8) | resultBin[1];
                response = resultBin.toString("hex");
              } else {
                let size = resultBin[1];
                // fake T0
                if (size === 0) {
                  size = 256;
                }

                response = resultBin.toString("hex", 2);
                status = (resultBin[2 + size] << 8) | resultBin[2 + size + 1];
              }
            } else {
              response = resultBin.toString("hex");
              status =
                (resultBin[resultBin.length - 2] << 8) |
                resultBin[resultBin.length - 1];
            }
            // Check the status
            const statusFound = statusList.some(s => s === status);
            if (!statusFound) {
              deferred.reject("Invalid status " + status.toString(16));
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

  close_async(): Promise<void> {
    this.device.close();
    return Promise.resolve();
  }
}
