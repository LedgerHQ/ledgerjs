<img src="https://user-images.githubusercontent.com/211411/34776833-6f1ef4da-f618-11e7-8b13-f0697901d6a8.png" height="100" />

---

This repository hosts libraries to communicate with Ledger Nano / Nano S / Blue
applications. There are implementations for Node and Browser.

[![Ledger Devs Slack](https://img.shields.io/badge/Slack-LedgerDevs-yellow.svg?style=flat)](https://ledger-dev.slack.com/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

### Published Packages

| Package                                                                              | Version                                                                                                                                                   | Description                                                                                         |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [`create-dapp`](/packages/create-dapp)                                               | [![npm](https://img.shields.io/npm/v/create-dapp.svg)](https://www.npmjs.com/package/create-dapp)                                                         | Ledger DApp Ethereum starter kit                                                                    |
| [`@ledgerhq/web3-subprovider`](/packages/web3-subprovider)                           | [![npm](https://img.shields.io/npm/v/@ledgerhq/web3-subprovider.svg)](https://www.npmjs.com/package/@ledgerhq/web3-subprovider)                           | web3 subprovider implementation for web3-provider-engine                                            |
| **Apps**                                                                             |
| [`@ledgerhq/hw-app-eth`](/packages/hw-app-eth)                                       | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-app-eth.svg)](https://www.npmjs.com/package/@ledgerhq/hw-app-eth)                                       | Ethereum Application API                                                                            |
| [`@ledgerhq/hw-app-btc`](/packages/hw-app-btc)                                       | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-app-btc.svg)](https://www.npmjs.com/package/@ledgerhq/hw-app-btc)                                       | Bitcoin Application API                                                                             |
| [`@ledgerhq/hw-app-xrp`](/packages/hw-app-xrp)                                       | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-app-xrp.svg)](https://www.npmjs.com/package/@ledgerhq/hw-app-xrp)                                       | Ripple Application API                                                                              |
| [`@ledgerhq/hw-app-str`](/packages/hw-app-str)                                       | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-app-str.svg)](https://www.npmjs.com/package/@ledgerhq/hw-app-str)                                       | Stellar Application API                                                                             |
| **Transports**                                                                       |
| [`@ledgerhq/hw-transport-node-hid`](/packages/hw-transport-node-hid)                 | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-transport-node-hid.svg)](https://www.npmjs.com/package/@ledgerhq/hw-transport-node-hid)                 | Node implementation of the communication layer, using `node-hid` (USB)                              |
| [`@ledgerhq/hw-transport-u2f`](/packages/hw-transport-u2f)                           | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-transport-u2f.svg)](https://www.npmjs.com/package/@ledgerhq/hw-transport-u2f)                           | Web implementation of the communication layer, using [U2F api](https://github.com/grantila/u2f-api) |
| [`@ledgerhq/react-native-hw-transport-ble`](/packages/react-native-hw-transport-ble) | [![npm](https://img.shields.io/npm/v/@ledgerhq/react-native-hw-transport-ble.svg)](https://www.npmjs.com/package/@ledgerhq/react-native-hw-transport-ble) | BLE bluetooth for react-native communication layer                                                  |
| [`@ledgerhq/react-native-hid`](/packages/react-native-hid)                           | [![npm](https://img.shields.io/npm/v/@ledgerhq/react-native-hid.svg)](https://www.npmjs.com/package/@ledgerhq/react-native-hid)                           | USB hid for react-native communication layer                                                        |
| [`@ledgerhq/hw-transport-http`](/packages/hw-transport-http)                         | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-transport-http.svg)](https://www.npmjs.com/package/@ledgerhq/hw-transport-http)                         | communicate to the device over HTTP. **NB: DEV & testing purpose only. DO NOT use in PROD**                                                                 |
| [`@ledgerhq/hw-transport`](/packages/hw-transport)                                   | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-transport.svg)](https://www.npmjs.com/package/@ledgerhq/hw-transport)                                   | The generic interface of the communication layer                                                    |
| **internal utility libraries**                                                       |
| [`@ledgerhq/currencies`](/packages/currencies)                                       | [![npm](https://img.shields.io/npm/v/@ledgerhq/currencies.svg)](https://www.npmjs.com/package/@ledgerhq/currencies)                                       | deal with crypto currencies                                                                         |
| **Development Tools**                                                                |
| [`@ledgerhq/hw-http-proxy-devserver`](/packages/hw-http-proxy-devserver)             | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-http-proxy-devserver.svg)](https://www.npmjs.com/package/@ledgerhq/hw-http-proxy-devserver)             | HTTP server proxy to use with `hw-transport-node-hid` **NB: DEV & testing purpose only. DO NOT use in PROD**                           |
| [`@ledgerhq/hw-hid-cli`](/packages/hw-hid-cli)                                       | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-hid-cli.svg)](https://www.npmjs.com/package/@ledgerhq/hw-hid-cli)                                       | CLI utility to send APDU to the device via node-hid                                                 |
| [`@ledgerhq/hw-transport-mocker`](/packages/hw-transport-mocker)                     | [![npm](https://img.shields.io/npm/v/@ledgerhq/hw-transport-mocker.svg)](https://www.npmjs.com/package/@ledgerhq/hw-transport-mocker)                     | Tool used for test to record and replay APDU calls.                                                 |

## Examples

**Basic example:**

```js
import Transport from "@ledgerhq/hw-transport-node-hid";
// import Transport from "@ledgerhq/hw-transport-u2f"; // for browser
import AppBtc from "@ledgerhq/hw-app-btc";
const getBtcAddress = async () => {
  const transport = await Transport.create();
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

* **[API doc](http://ledgerhq.github.io/ledgerjs/)**

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

First of all, this ensure the libraries are correctly building, and passing lint and flow:

```
yarn test
```

**then to test on a real device...**

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

### Deploy

Checklist before deploying a new release:

* you have the right in the LedgerHQ org on NPM
* you have run `npm login` once (check `npm whoami`)
* Go to **master** branch
  * your master point on LedgerHQ repository (check with `git config remote.$(git config branch.master.remote).url` and fix it with `git branch --set-upstream master origin/master`)
  * you are in sync (`git pull`) and there is no changes in `git status`
* Run `yarn` once, there is still no changes in `git status`

**deploy a new release**

```
 yarn run publish
```

then, go to [/releases](https://github.com/LedgerHQ/ledgerjs/releases) and create a release with change logs.

**alternatively:**

deploy a canary release (beta, etc)

```
 yarn run publish -- -c beta
```

> NB: if there is a new package, AFAIK you need to manually `npm publish` it once on NPM.
