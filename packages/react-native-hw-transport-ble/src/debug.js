// @flow
import { Subject, Observable } from "rxjs";
import { shareReplay, map } from "rxjs/operators";

export type LogWithoutId = {
  type: string,
  message?: string
};

export type Log = {
  id: string,
  date: Date
} & LogWithoutId;

export const logSubject: Subject<LogWithoutId> = new Subject();

let id = 0;

/**
 * @example
 * import { logsObservable } from "@ledgerhq/react-native-hw-transport-ble/lib/debug";
 *
 * logsObservable.subscribe(e => console.log(e));
 */
export const logsObservable: Observable<Log> = logSubject.pipe(
  map(l => ({ id: String(++id), date: new Date(), ...l })),
  shareReplay(1000)
);

logsObservable.subscribe();
