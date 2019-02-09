<img src="https://user-images.githubusercontent.com/211411/34776833-6f1ef4da-f618-11e7-8b13-f0697901d6a8.png" height="100" />

[Github](https://github.com/LedgerHQ/ledgerjs/),
[API Doc](http://ledgerhq.github.io/ledgerjs/),
[Ledger Devs Slack](https://ledger-dev.slack.com/)

## @ledgerhq/react-native-hw-transport-ble

Bluetooth BLE transport for React Native.

### Pre-requisite

- [Install and link library `react-native-ble-plx`, configure your app for Bluetooth permissions](https://github.com/Polidea/react-native-ble-plx) (Open the link for documentation)
- **You should use a recent version of JavaScriptCore** instead of React Native's default one. You can simply set up [jsc-android](https://www.npmjs.com/package/jsc-android). Otherwise, if you keep React Native one's you will fall into this error https://github.com/facebook/react-native/issues/15902 (you can alternatively figure out the polyfill to install). In future, we expect React Native to upgrade JSC.
- You need to set up a **Buffer** polyfill. You can simply have a `polyfill.js` that you `import "./polyfill";` at first line of your entry point with `global.Buffer = require("buffer").Buffer;`.

### Getting started

`@ledgerhq/react-native-hw-transport-ble` works like any of our `@ledgerhq/hw-transport` libraries.

The difference here is that the listen() is costy and you likely don't want to always scan for devices, you would better save a selected device as "known" to suggest it to user later.

> Important: you will also have to deal with specifics of Bluetooth BLE, for instance, you need to request the LOCATION permission on Android!

Here is a gist of the most important parts required.

### Check for Bluetooth state

```js
import TransportBLE from "@ledgerhq/react-native-hw-transport-ble";

const subscription = TransportBLE.observeState({
  next: e => syncWithUI(e.available),
  complete: () => {},
  error: () => {}
});
```

**when Bluetooth is available we can continue to...**

### Scan for devices

```js
const subscription = TransportBLE.listen({
  complete: () => {
    this.setState({ refreshing: false });
  },
  next: e => {
    if (e.type === "add") {
      const device = e.descriptor;
      addDeviceToTheUI(device);
    }
  },
  error: error => {
    this.setState({ error, refreshing: false });
  }
});

// NB we also recommend the use of RxJS, you can just wrap it like so:
// Observable.create(TransportBLE.listen).subscribe({ ... })
// In the future of ledgerjs, we might directly returns Observable.
```

This is the basic idea, obviously you need to call this code in your logic and implement `addDeviceToTheUI(device)`.

In that `device` object, you can typically use two fields:

- `device.id`: a unique identifier of the device that can later be given to `TransportBLE.open(id)`
- `device.name`: the name of the device (e.g. `NanoX A4F5`)

**With this device we can now...**

### Connect to known device

```js
const transport = await TransportBLE.open(device);
// OR
const transport = await TransportBLE.open(deviceId); // deviceId can come from persisted state. It's unique per device
```

**and now we can just use the transport like any other Ledger transport!**

### Full example

[Here is a full example that you can use as boilerplate](https://github.com/LedgerHQ/ble-integration-examples/tree/master/react-native)
