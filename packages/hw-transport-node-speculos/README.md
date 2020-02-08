<img src="https://user-images.githubusercontent.com/211411/34776833-6f1ef4da-f618-11e7-8b13-f0697901d6a8.png" height="100" />

## @ledgerhq/hw-transport-node-speculos

A transport for https://github.com/LedgerHQ/speculos Nano simulator.

[Github](https://github.com/LedgerHQ/ledgerjs/),
[Ledger Devs Slack](https://ledger-dev.slack.com/)


### Getting started

- Install https://github.com/LedgerHQ/speculos
- Make sure to have a speculos running with a APDU port and (optionally) a buttons port available.

```js
import SpeculosTransport from "@ledgerhq/hw-transport-node-speculos";

async function exampleSimple() {
  const transport = await SpeculosTransport.open({ apduPort });
  const res = await transport.send(0xE0, 0x01, 0x00, 0x00);
}

async function exampleAdvanced() {
  const transport = await SpeculosTransport.open({ apduPort });
  setTimeout(() => {
    // in 1s i'll click on right button and release
    transport.button("Rr");
  }, 1000); // 1s is a tradeoff here. In future, we need to be able to "await & expect a text" but that will need a feature from speculos to notify us when text changes.
  // derivate btc address and ask for device verification
  const res = await transport.send(0xE0, 0x40, 0x01, 0x00, Buffer.from("058000002c8000000080000000000000000000000f"));
}
```

### With ledger-live CLI

It's working with SPECULOS_APDU_PORT and SPECULOS_HOST envs.

```sh
SPECULOS_APDU_PORT=40000 ledger-live sync -c btc
```

To make it work with Docker, I had to expose some port and do this:


```sh
docker run -it -p 40000:40000 -v "$(pwd)"/apps:/speculos/apps speculos /bin/bash

$ pipenv shell
$ ./speculos.py -m nanos ./apps/btc.elf --sdk 1.6 --seed "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about" --display headless --apdu-port 40000
```


## API
