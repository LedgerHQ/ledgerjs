// @flow

import HttpTransport from "./HttpTransport";
export default (urlArg: ?string) => {
  const url = urlArg;
  if (!url) return HttpTransport; // by default, HttpTransport don't yield anything in list/listen
  class StaticHttpTransport extends HttpTransport {
    static list = (): * => HttpTransport.open(url).then(() => [url], () => []);
    static listen = (observer: *) => {
      let unsubscribed = false;

      function attemptToConnect() {
        if (unsubscribed) return;
        HttpTransport.open(url, 5000).then(
          () => {
            if (unsubscribed) return;
            observer.next({ type: "add", descriptor: url });
            observer.complete();
          },
          () => {
            if (unsubscribed) return;
            setTimeout(attemptToConnect, 1000);
          }
        );
      }
      attemptToConnect();
      return {
        unsubscribe: () => {
          unsubscribed = true;
        }
      };
    };
  }
  return StaticHttpTransport;
};
