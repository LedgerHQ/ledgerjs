// @flow
import { Observable } from "rxjs";
import type { Characteristic } from "./types";
import { logSubject } from "./debug";

export const monitorCharacteristic = (
  characteristic: Characteristic
): Observable<Buffer> =>
  Observable.create(o => {
    logSubject.next({
      type: "verbose",
      message: "start monitor " + characteristic.uuid
    });

    function onCharacteristicValueChanged(event) {
      const characteristic = event.target;
      if (characteristic.value) {
        o.next(Buffer.from(characteristic.value.buffer));
      }
    }

    characteristic.startNotifications().then(() => {
      characteristic.addEventListener(
        "characteristicvaluechanged",
        onCharacteristicValueChanged
      );
    });

    return () => {
      logSubject.next({
        type: "verbose",
        message: "end monitor " + characteristic.uuid
      });
      characteristic.stopNotifications();
    };
  });
