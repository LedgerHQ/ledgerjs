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

// This define the generic interface to share between node/u2f impl

export default class LedgerComm {
  // Flow types of functions to implement
  static +list_async: () => Promise<Array<string>>;
  static +create_async: (
    timeout?: number,
    debug?: boolean
  ) => Promise<LedgerComm>;
  +exchange: (apduHex: string, statusList: Array<number>) => Promise<string>;
  +setScrambleKey: string => void;
  +close_async: () => Promise<void>;
}
