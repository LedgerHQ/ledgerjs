<img src="https://user-images.githubusercontent.com/211411/34776833-6f1ef4da-f618-11e7-8b13-f0697901d6a8.png" height="100" />

## @ledgerhq/hw-app-xtz

Library for Ledger Hardware Wallets.

[Github](https://github.com/LedgerHQ/ledgerjs/),
[API Doc](http://ledgerhq.github.io/ledgerjs/),
[Ledger Devs Slack](https://ledger-dev.slack.com/)

## Using LedgerJS for XTZ

Here is a sample app for Node:

```
let Transport = require("@ledgerhq/hw-transport-node-hid").default;
let App = require("@ledgerhq/hw-app-xtz").default;

const getAddress = async () => {
  const transport = await Transport.create();
  const xtz = new App(transport);
  const result = await xtz.getAddress("44'/1729'/0'/0'", true);
  return result.publicKey;
};

const signOperation = async () => {
  const transport = await Transport.create();
  const xtz = new App(transport);
  const result = await xtz.signOperation("44'/1729'/0'/0'", "0342397c7a82e1f7509513642e573020aeb0aea36ac087139085e42d480cd08520070000d2e495a7ab40156d0a7c35b73d2530a3470fc8700002000000cda3081bd81219ec494b29068dcfd19e427fed9a66abcdc9e9e99ca6478f60e9080000d2e495a7ab40156d0a7c35b73d2530a3470fc870d0860303c80100c0ba99060000e7670f32038107a59a2b9cfefae36ea21f5aa63c00");
  return result.signature;
};

const getVersion = async () => {
  const transport = await Transport.create();
  const xtz = new App(transport);
  const versionInfo = await xtz.getVersion();
  return versionInfo;
};

const doAll = async () => {
    version = await getVersion();
    console.log(version);
    address = await getAddress();
    console.log(address);
    signature = await signOperation();
    console.log(signature);
};

doAll().catch(err => console.log(err));
```

To get this to work with a dev checkout of the LedgerJS repo, make sure that
you have appropriate dependencies in your `package.json`, either by using
`yarn add file:.../path` or `yarn link`. Make sure that you `yarn install`
*and* `yarn build` the LedgerJS packages, as `yarn build` will be necessary
to translate the Javascript into a form acceptable by Node.

If you want to use web instead, replace `hw-transport-node-hid` with `hw-transport-u2f`
and run `npx webpack`.
