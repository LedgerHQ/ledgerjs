# Prepare transition to incoming Ledger ETH app update

There is going to be some minor changes in how the Ledger ETH Nano app works regarding ERC20.

## Why

- We are innovating to reduce the size of ETH app [following our users feedback](https://www.ledger.fr/2019/02/14/righting-our-1-5-5-nano-s-firmware-update/).
- We support more and more ERC20 and hardcoding that data in the app does not scale.

## How

Instead of the ETH app to hardcode ERC20 informations (like ticker, decimals, contract address,..) you will have to provide this data verified with Ledger's signature.

### using LedgerJS

Make sure to be up to date with [`@ledgerhq/hw-app-eth`](https://github.com/LedgerHQ/ledgerjs/tree/master/packages/hw-app-eth) (must be `>= 4.39`).

The library now includes `provideERC20TokenInformation`, a new method that you need to call **just before** signing an ERC20 transaction to provide that ERC20 informations.

> ERC20 data can be retrieved from `@ledgerhq/hw-app-eth/erc20`.

Example:

```js
import { byContractAddress } from "@ledgerhq/hw-app-eth/erc20";
const zrxInfo = byContractAddress("0xe41d2489571d322189246dafa5ebde1f4699f498");
if (zrxInfo) await appEth.provideERC20TokenInformation(zrxInfo);
const signed = await appEth.signTransaction(path, rawTxHex);
```

> If you do so, the JS bundle size will increase by about ~150kb with today's data (compressed in the most possible way). An alternative is for you to host this yourself and query your API (or include it among your data).

NB: we might update the ERC20 data over the next months to add more tokens,...

### not using LedgerJS

You can take a look at [LedgerJS implementation](https://github.com/LedgerHQ/ledgerjs/tree/master/packages/hw-app-eth) as well as taking a look at the [ETH app documentation](https://github.com/LedgerHQ/ledger-app-eth/blob/externalize-erc20/doc/ethapp.asc).

## Scenarios

We will now explain the behavior of each case weither you update to `provideERC20TokenInformation` or not and weither the user have an old ETH app or not.

### old ETH app, old ledger codebase

no problem. It's what we have today. Since the old ETH app have the ERC20 data, it just works.

### old ETH app, new ledger codebase

If you do migrate to the suggested solution BUT user still come back with an old version of their nano app, **there is no impact at all**. The call to `provideERC20TokenInformation` will silently fail to be backward compatible.

### new ETH app, old ledgerjs codebase

In this case, the ETH app will still be able to sign ERC20 transactions, however user will not anymore see an amount with a ticker but instead will see a contract address (the ERC20 contract). It is basically like using a non recognized ERC20 as of today.

**=> solution is to migrate to the suggested code above.**

### new ETH app, new ledgerjs codebase

We are all set!
