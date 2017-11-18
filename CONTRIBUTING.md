# Contributing

:+1::tada: First off, thanks for taking the time to contribute! :tada::+1:

This repository hosts the `ledgerco` library for node.js and browser.

## Getting started

* Clone the project: `git clone git@github.com:LedgerHQ/ledger-node-js-api.git`
* Install Node dependencies: `npm install`
* Bootstrap (this basically sync flow-typed): `npm run bootstrap`

## JavaScript styleguide

* ES6+ features.
* [prettier](https://prettier.io/) for formatting convention. You can run `npm
  run prettier`.
* ESLint is used to enhance code quality. Check with `npm run lint`.
* Flowtype is used to typecheck the library. Check with `npm run flow`.

> NB. for the 3 points above, the best is to have integration of Prettier,
> ESlint, Flowtype in your text editor (there are plugin for most editors). The
> easiest might be to use Atom with Nuclide plugin.

## Build the project

```
npm run build
```

there is also a watch mode (only for dev):

```
npm run watch
```

## Test the project

Plug a device like the Nano S and open Bitcoin app.

Then run the test and accept the commands on the devices for the tests to
continue.

```
npm test
```

You can also test on the web. To do so, you need to open `test/index.html` on a
HTTPS page and make sure to configure your device app with "Browser support" set
to "YES".
