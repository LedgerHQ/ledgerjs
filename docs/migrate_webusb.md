`@ledgerhq/hw-transport-u2f` and `@ledgerhq/hw-transport-webauthn` has been deprecated.

**We strongly advise to migrate to [`@ledgerhq/hw-transport-webusb`](../packages/hw-transport-webusb) or [`@ledgerhq/hw-transport-webhid`](../packages/hw-transport-webusb).**

## Why is it deprecated?

- U2F is a technology that were used by Ledger in 2016-2018 in order to achieve Web integrations of our devices. It was implemented at the time there were no other alternative and no way to do "HID" or "WebUSB" technologies.
- WebHID and WebUSB are technologies that are a better alternative and more designed to be used for bi-directional communication with USB hardwares.
- Since then, Google has been advising us to move away from this approach. Moreover, Chromium made it unbearable to keep using this "U2F hack" with agressive pop ups that happens, typically on Windows.
- U2F channel was a "fire and forget" protocol without even the capacity to know if a device is plugged or disconnected.
- We may eventually remove the support of U2F channel on our devices, especially if the security problems of U2F are getting higher. For now, nothing is planned.

## What is the solution and its differences

The solution we suggest is to use either `@ledgerhq/hw-transport-webusb` or `@ledgerhq/hw-transport-webhid`. Today, in December 2020, both have relatively the same level of support: only on Chromium based browsers.

The main difference relies in the fact we get a connection lifecycle with a device. **This works with a browser Permission, so the security is getting better for the user**. The challenge for your side, on integration side, is that you must use the Transport in the context of a User Event Click. Because technically, we can only open the device in context of a click of a button, typically a "Sign Transaction" button you may have in your interface.

You can see integrations of WebUSB at https://github.com/LedgerHQ/ledgerjs-examples

## What about Firefox then?

We have no solution for Firefox support at the moment. We hope Mozilla will eventually support WebUSB.

## Where are the U2F implementation now?

We have moved them to https://github.com/LedgerHQ/ledgerjs-legacy .