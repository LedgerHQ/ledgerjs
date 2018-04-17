<img src="https://user-images.githubusercontent.com/211411/34776833-6f1ef4da-f618-11e7-8b13-f0697901d6a8.png" height="100" />

## @ledgerhq/hw-app-ada

Library for Ledger Hardware Wallets.

[Github](https://github.com/LedgerHQ/ledgerjs/),
[API Doc](http://ledgerhq.github.io/ledgerjs/),
[Ledger Devs Slack](https://ledger-dev.slack.com/)

### Application

This library is compatible with the [Cardano ADA Ledger Application](https://github.com/HiddenField/ledger-cardano-app).

### Tests

As well as the tests in `@ledgerhq/test`, automated end-to-end tests are provided here using [mocha](https://mochajs.org/).

#### Core Tests

Core tests are provided for testing the base functionality of the device.

First, ensure you have a **test** build installed on the device (see ledger app respository for details). Then run:

```shell
yarn run core-test
```

#### API Tests

These test the production API and can be run either on a production build or headlessly for fully-automated testing.

For tests which require user interaction, ensure you have a standard production build of the app and run:

```shell
yarn run api-test
```

For headless tests, ensure you have a **headless** build installed on the device (see ledger app repository for details). Then run:

```shell
yarn run api-test --headless
```
