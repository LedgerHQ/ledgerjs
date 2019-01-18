// @flow
import { Subject, Observable } from "rxjs";
// $FlowFixMe
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

export const logsObservable: Observable<Log> = logSubject.pipe(
  map(l => ({ id: String(++id), date: new Date(), ...l })),
  shareReplay(1000)
);

logsObservable.subscribe(e => {
  if (global.__ledgerDebug) {
    global.__ledgerDebug(
      e.date.toISOString() + " " + e.type + ": " + String(e.message)
    );
  }
});
