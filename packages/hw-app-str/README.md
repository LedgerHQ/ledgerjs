<img src="https://user-images.githubusercontent.com/211411/34776833-6f1ef4da-f618-11e7-8b13-f0697901d6a8.png" height="100" />

## Ledger Stellar app API

## Usage


```js
import Transport from "@ledgerhq/hw-transport-node-hid";
// import Transport from "@ledgerhq/hw-transport-u2f"; // for browser
import Str from "@ledgerhq/hw-app-str";

const getStrAppVersion = async () => {
    const transport = await Transport.create();
    const str = new Str(transport);
    const result = await str.getAppConfiguration();
    return result.version;
}
getStrAppVersion().then(v => console.log(v));

const getStrPublicKey = async () => {
  const transport = await Transport.create();
  const str = new Str(transport);
  const result = await str.getPublicKey("44'/148'/0'");
  return result.publicKey;
};
getStrPublicKey().then(pk => console.log(pk));

const signStrTransaction = async () => {
  const transaction = ...;
  const transport = await Transport.create();
  const str = new Str(transport);
  const result = await str.signTransaction("44'/148'/0'", transaction.signatureBase());
  
  // add signature to transaction
  const keyPair = StellarSdk.Keypair.fromPublicKey(publicKey);
  const hint = keyPair.signatureHint();
  const decorated = new StellarSdk.xdr.DecoratedSignature({hint: hint, signature: signature});
  transaction.signatures.push(decorated);
  
  return transaction;
}
signStrTransaction().then(s => console.log(s.toString('hex')));
```


[Github](https://github.com/LedgerHQ/ledgerjs/),
[API Doc](http://ledgerhq.github.io/ledgerjs/),
[Ledger Devs Slack](https://ledger-dev.slack.com/)
