//@flow
import type { Fiat } from "./data/fiat";

export type Rate = {
  value: number,
  fiat: Fiat
};

export type Unit = {
  // display name of a given unit (exemple: satoshi)
  name: string,
  // string to use when formatting the unit. like 'BTC' or 'USD'
  code: string,
  // number of digits after the '.'
  magnitude: number,
  // a shorter version of code using the symbol of the currency. like Ƀ
  symbol?: string,
  // should it always print all digits even if they are 0 (usually: true for fiats, false for cryptos)
  showAllDigits?: boolean
};

export type UnitValue = { value: number, unit: Unit };

export type Currency = {
  // coinType is an identifier specified by https://github.com/satoshilabs/slips/blob/master/slip-0044.md
  coinType: number,
  // display name of a currency
  name: string,
  // the scheme name to use when formatting an URI (without the ':')
  scheme: string,
  // used for UI
  color: string,
  // all units of a currency (e.g. Bitcoin have bitcoin, mBTC, bit, satoshi)
  // IMPORTANT: by convention, [0] is the default and have "highest" magnitude
  units: Unit[]
  // NB more field will come as we need them. basically see https://github.com/LedgerHQ/ledger-wallet-chrome/blob/487a8c86726f92dd49eb284fe12c49f4d3410d69/app/src/bitcoin/networks.coffee
};

export type CurrencyEntity = Currency;
