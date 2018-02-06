//@flow
import querystring from "querystring";
import type { Currency } from "./types";
import { findCurrencyByScheme } from "./data/cryptocurrencies";
// see https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki

type Data = {
  currency: Currency,
  address: string,
  amount?: number // IN SATOSHI !! not in actual 'real' value
  // ... any other field specific to a coin that will be put in query
};

export function encodeURIScheme(data: Data): ?string {
  const { currency, address, amount, ...specificFields } = data;
  const query = { ...specificFields };
  if (amount) {
    const { magnitude } = currency.units[0];
    query.amount = amount / 10 ** magnitude;
  }
  const queryStr = querystring.stringify(query);
  return currency.scheme + ":" + address + (queryStr ? "?" + queryStr : "");
}

export function decodeURIScheme(str: string): ?Data {
  const m = str.match(/([a-zA-Z]+):([^?]+)(\?(.+))?/);
  if (!m) throw new Error("invalid uri");
  const [, scheme, address, , queryStr] = m;
  const query = queryStr ? querystring.parse(queryStr) : {};
  const currency = findCurrencyByScheme(scheme);
  if (!currency) throw new Error("currency '" + scheme + "' not supported");
  const data: Data = {
    currency,
    address
  };
  const { amount, ...specificFields } = { ...query };
  Object.assign(data, specificFields);
  if (amount) {
    const amountFloat = parseFloat(amount);
    if (!isNaN(amountFloat) && amountFloat > 0) {
      const { magnitude } = currency.units[0];
      data.amount = amount * 10 ** magnitude;
    }
  }
  return data;
}
