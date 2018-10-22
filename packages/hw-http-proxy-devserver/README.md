<img src="https://user-images.githubusercontent.com/211411/34776833-6f1ef4da-f618-11e7-8b13-f0697901d6a8.png" height="100" />

## @ledgerhq/hw-http-proxy-devserver

Proxy a Ledger device plugged in USB over HTTP / WebSocket.

- Plug your Ledger device on your computer
- Run a HTTP server with the `ledger-hw-http-proxy-devserver` command
- Use `@ledgerhq/hw-transport-http` in your code like a normal transport so you can run Legder device APDU over http.

**Goal: This library is meant for DEV & testing purpose only. It is not designed to be used in PROD.**

### Setup

Install with one of these:

```sh
npm i -g @ledgerhq/hw-http-proxy-devserver
yarn global add @ledgerhq/hw-http-proxy-devserver
```

### Run the server

In a console, simply run:

```sh
ledger-hw-http-proxy-devserver
```

### hw-transport-http to communicate with the server

To communicate with this server, there is a dedicated Transport library. You can use it like any other Ledger transport like hw-transport-node-hid, hw-transport-u2f, ...

```js
import withStaticURL from "@ledgerhq/hw-transport-http";

// you can change localhost to a local IP (e.g. to use from a Phone)
const Transport = withStaticURL("ws://localhost:8435");

// ... normal @ledgerhq/* code

import AppBtc from "@ledgerhq/hw-app-btc";
const getBtcAddress = async () => {
  const transport = await Transport.create();
  const btc = new AppBtc(transport);
  const result = await btc.getWalletPublicKey("44'/0'/0'/0/0");
  return result.bitcoinAddress;
};
getBtcAddress().then(a => console.log(a));
```

## More information

[Github](https://github.com/LedgerHQ/ledgerjs/),
[API Doc](http://ledgerhq.github.io/ledgerjs/),
[Ledger Devs Slack](https://ledger-dev.slack.com/)
