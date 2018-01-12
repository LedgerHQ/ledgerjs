<img src="https://user-images.githubusercontent.com/211411/34776833-6f1ef4da-f618-11e7-8b13-f0697901d6a8.png" height="100" />

---

This repository hosts libraries to communicate with Ledger Nano / Nano S / Blue
applications. There are implementations for Node and Browser.

[![Ledger Devs Slack](https://img.shields.io/badge/Slack-LedgerDevs-yellow.svg?style=flat)](https://ledger-dev.slack.com/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

### Published Packages

| Package                                                              | Version                                                                                                                                   | Description                                                                                         |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [`@ledgerhq/hw-app-eth`](/packages/hw-app-eth)                       | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-eth.svg)](https://www.npmjs.com/package/@ledgerhq/hw-app-eth)                           | Ethereum Application API                                                                            |
| [`@ledgerhq/hw-app-btc`](/packages/hw-app-btc)                       | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-btc.svg)](https://www.npmjs.com/package/@ledgerhq/hw-app-btc)                           | Bitcoin Application API                                                                             |
| [`@ledgerhq/hw-transport-node-hid`](/packages/hw-transport-node-hid) | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-transport-node-hid.svg)](https://www.npmjs.com/package/@ledgerhq/hw-transport-node-hid) | Node implementation of the communication layer, using `node-hid` (USB)                              |
| [`@ledgerhq/hw-transport-u2f`](/packages/hw-transport-u2f)           | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-transport-u2f.svg)](https://www.npmjs.com/package/@ledgerhq/hw-transport-u2f)           | Web implementation of the communication layer, using [U2F api](https://github.com/grantila/u2f-api) |
| [`@ledgerhq/hw-transport`](/packages/hw-transport)                   | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-transport.svg)](https://www.npmjs.com/package/@ledgerhq/hw-transport)                   | The generic interface of the communication layer                                                    |

## Examples

**Basic example:**

```js
import Transport from "@ledgerhq/hw-transport-node-hid";
// import Transport from "@ledgerhq/hw-comm-u2f"; // for browser
import AppBtc from "@ledgerhq/hw-app-btc";
const getBtcAddress = async () => {
  const devices = await Transport.list();
  if (devices.length === 0) throw "no device";
  const transport = await Transport.open(devices[0]);
  const btc = new AppBtc(transport);
  const result = await btc.getWalletPublicKey("44'/0'/0'/0");
  return result.bitcoinAddress;
};
getBtcAddress().then(a => console.log(a));
```

> When using in a browser, make sure to set up "Browser mode" in the application
> settings on the device if available.

**More advanced examples:**

* TODO

## Documentation

* **[API doc](/API.md)**

## Contributing

Please read our [contribution guidelines](./CONTRIBUTING.md) before getting
started.

**You need to have a recent [Node.js](https://nodejs.org/) and
[Yarn](https://yarnpkg.com/) installed.**

### Install dependencies

```bash
yarn
```

### Build

Build all packages

```bash
yarn run build
```

### Lint

Lint all packages

```bash
yarn run lint
```

### Run Tests

Plug a device like the Nano S and open Bitcoin app.

Then run the test and accept the commands on the devices for the tests to
continue.

```bash
yarn run test-node
```

You can also test on the web:

```bash
yarn run test-browser
```

> make sure to configure your device app with "Browser support" set to "YES".
