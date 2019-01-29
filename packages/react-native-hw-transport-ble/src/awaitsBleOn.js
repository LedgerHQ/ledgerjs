// @flow

import { BluetoothRequired } from "@ledgerhq/errors";
import { logSubject } from "./debug";
import timer from "./timer";
import type { BleManager } from "./types";

export const awaitsBleOn = (bleManager: BleManager, ms: number = 3000) =>
  new Promise((resolve, reject) => {
    let done = false;
    let lastState = "Unknown";

    const stateSub = bleManager.onStateChange(state => {
      lastState = state;
      logSubject.next({ type: "verbose", message: `ble state -> ${state}` });
      if (state === "PoweredOn") {
        if (done) return;
        removeTimeout();
        done = true;
        stateSub.remove();
        resolve();
      }
    }, true);

    const removeTimeout = timer.timeout(() => {
      if (done) return;
      stateSub.remove();
      reject(new BluetoothRequired("", { state: lastState }));
    }, ms);
  });
