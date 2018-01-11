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

import invariant from "invariant";

/**
 * Comm defines the generic interface to share between node/u2f impl
 */
export default class Comm {
  // methods to implement

  /**
   * attempt to create a Comm instance
   * @param timeout a maximum time in milliseconds to wait
   * @param debug enable debug logging mode
   * @return a Promise of Comm instance
   */
  static +create: (timeout?: number, debug?: boolean) => Promise<Comm>;

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
   * @return a Promise that ends when the comm is closed.
   */
  +close: () => Promise<void>;

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
}
