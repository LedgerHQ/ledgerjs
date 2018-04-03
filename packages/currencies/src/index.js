//@flow

import { encodeURIScheme, decodeURIScheme } from "./CurrencyURIScheme";

import { listFiats, getFiatUnit, hasFiatUnit } from "./data/fiat";

import {
  listCurrencies,
  getCurrencyByCoinType,
  getDefaultUnitByCoinType,
  hasCurrencyByCoinType
} from "./data/cryptocurrencies";

import { parseCurrencyUnit } from "./parseCurrencyUnit";

import { chopCurrencyUnitDecimals } from "./chopCurrencyUnitDecimals";

import {
  formatCurrencyUnit,
  formatCurrencyUnitFragment
} from "./formatCurrencyUnit";

import { formatShort } from "./formatShort";

import countervalueForRate from "./countervalueForRate";

export {
  listFiats,
  listCurrencies,
  getFiatUnit,
  hasFiatUnit,
  parseCurrencyUnit,
  chopCurrencyUnitDecimals,
  formatCurrencyUnit,
  formatCurrencyUnitFragment,
  formatShort,
  getCurrencyByCoinType,
  getDefaultUnitByCoinType,
  hasCurrencyByCoinType,
  countervalueForRate,
  encodeURIScheme,
  decodeURIScheme
};

export type { Currency, Unit, Rate, UnitValue } from "./types";
