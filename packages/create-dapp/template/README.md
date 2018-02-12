# Ledger DApp Ethereum starter kit

Welcome to Ledger DApp starter kit, web app backed by Ethereum smart contract. Out of the box support of Ledger devices and MetaMask.

This is a normal `create-react-app` project bootstrapped with a `truffle` project under `src/dapp`.

## Pre-requisite documentation to read

* React: https://reactjs.org
* Solidity: https://solidity.readthedocs.io
* web3.js: https://github.com/ethereum/web3.js
* truffle-contract: https://github.com/trufflesuite/truffle-contract

## Pre-requisite tools to install

```
npm install -g truffle ganache-cli
```

## Develop

Run a development Ethereum network:

```
ganache-cli --networkId 1337
```

> Alternatively you can run on Ethereum testnet.

Run the truffle tool, to generate and compile the contracts. **NB: the truffle project lives under src/dapp**

```
cd src/dapp
truffle compile
truffle deploy --network development
```

> Adapt the deploy based on your need. Read truffle documentation for more information.

Run the web app:

```
npm start
```

> Read create-react-app documentation for more information.
