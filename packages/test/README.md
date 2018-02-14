## Snapshot Testing

We have test snapshots to check our libraries still yield the same result as before and detect regression.

What we do is we basically record the `apdu => response` of all the tests we have. and then, we can replay it headlessly in our CI.

To generate snapshots you MUST setup a Nano S with following seed:

```
abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about
```

Select 12 words, enter 11 times `abandon` and one time `about`.

> This is the seed phrase we are going to use everywhere. Obviously don't use it to store your funds (unless testnet).

### Generate it

```
yarn run test-node -- snapshot
```

### Test with the snapshot

```
yarn run test-snapshot
```

### Notes on tradeoffs

Currently, you have to run all tests and manually validate on the device and switch apps. We will try to improve this in the future so you can test partially and regenerate part of the snapshots that interest you.

For now you will have to run them all for generating the snapshots.
