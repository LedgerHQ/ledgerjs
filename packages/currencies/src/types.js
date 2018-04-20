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

export type FiatUnit = Unit & {
  ticker: string
};

export type UnitValue = {| value: number, unit: Unit |};

export type BitcoinJS = {|
  bech32?: string,
  bip32: {
    private: number,
    public: number
  },
  messagePrefix: string,
  pubKeyHash: number | Uint8Array,
  scriptHash: number | Uint8Array,
  wif: number
|};

export type Currency = {|
  // unique internal id of a crypto currency
  id: string,
  // coinType is an identifier specified by https://github.com/satoshilabs/slips/blob/master/slip-0044.md
  coinType: number,
  // display name of a currency
  name: string,
  // the ticker name in exchanges / countervalue apis (e.g. BTC)
  ticker: string,
  // the scheme name to use when formatting an URI (without the ':')
  scheme: string,
  // used for UI
  color: string,
  // all units of a currency (e.g. Bitcoin have bitcoin, mBTC, bit, satoshi)
  // IMPORTANT: by convention, [0] is the default and have "highest" magnitude
  units: Unit[],
  // TODO: document apiName
  apiName?: string,
  // TODO: document xpub
  xpub?: number,
  // TODO: document isSegwitSupported
  isSegwitSupported?: boolean,
  // TODO: document handleFeePerByte
  handleFeePerByte?: boolean,
  // TODO: document areTransactionTimestamped
  areTransactionTimestamped?: boolean,
  // TODO: document sigHashType
  sigHashType?: number,
  // TODO: document bitcoinjs
  bitcoinjs?: BitcoinJS
|};

export type CurrencyEntity = Currency;
