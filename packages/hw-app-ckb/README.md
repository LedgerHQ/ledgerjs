[Github](https://github.com/LedgerHQ/ledgerjs/),
[Ledger Devs Slack](https://ledger-dev.slack.com/)

## @ledgerhq/hw-app-ckb

Ledger Hardware Wallet CKB JavaScript bindings.

## Using LedgerJS for XTZ

Here is a sample app for Node:

```
let Transport = require("@ledgerhq/hw-transport-node-hid").default;
let Ckb = require("@ledgerhq/hw-app-ckb").default;

const getWalletId = async () => {
  const transport = await Transport.create();
  const ckb = new Ckb(transport);
  const result = await ckb.getWalletId();
  return result;
};

const signTransaction = async () => {
  const transport = await Transport.create();
  const ckb = new Ckb(transport);
  const result = await ckb.signTransaction("44'/309'/0'/1/0", "0342397c7a82e1f7509513642e573020aeb0aea36ac087139085e42d480cd08520070000d2e495a7ab40156d0a7c35b73d2530a3470fc8700002000000cda3081bd81219ec494b29068dcfd19e427fed9a66abcdc9e9e99ca6478f60e9080000d2e495a7ab40156d0a7c35b73d2530a3470fc870d0860303c80100c0ba99060000e7670f32038107a59a2b9cfefae36ea21f5aa63c00");
  return result.signature;
};

const getVersion = async () => {
  const transport = await Transport.create();
  const ckb = new Ckb(transport);
  const versionInfo = await ckb.getAppConfiguration();
  return versionInfo;
};

const getAddress = async () => {
  const transport = await Transport.create();
  const ckb = new Ckb(transport);
  const result = await ckb.getWalletPublicKey("44'/309'/0'/1/0");
  return result;
};

const doAll = async () => {
    walletId = await getWalletId();
    console.log(walletId);
    version = await getAppConfiguration();
    console.log(version);
    address = await getWalletPublicKey();;
    console.log(address);
    signature = await signTransaction();
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
