// @flow
import type { TokenCurrency, CryptoCurrency } from "./types";
import { getCryptoCurrencyById } from "./currencies";

import erc20tokens from "../data/erc20";
import trc10tokens from "../data/trc10";
import trc20tokens from "../data/trc20";
import asatokens from "../data/asa";

const emptyArray = [];
const tokensArray: TokenCurrency[] = [];
const tokensArrayWithDelisted: TokenCurrency[] = [];
const tokensByCryptoCurrency: { [_: string]: TokenCurrency[] } = {};
const tokensByCryptoCurrencyWithDelisted: { [_: string]: TokenCurrency[] } = {};
const tokensById: { [_: string]: TokenCurrency } = {};
const tokensByTicker: { [_: string]: TokenCurrency } = {};
const tokensByAddress: { [_: string]: TokenCurrency } = {};

addTokens(erc20tokens.map(convertERC20));
addTokens(trc10tokens.map(convertTRONTokens("trc10")));
addTokens(trc20tokens.map(convertTRONTokens("trc20")));
addTokens(asatokens.map(convertAlgorandASATokens));

type TokensListOptions = {
  withDelisted: boolean,
};

const defaultTokenListOptions: TokensListOptions = {
  withDelisted: false,
};

/**
 *
 */
export function listTokens(
  options?: $Shape<TokensListOptions>
): TokenCurrency[] {
  const { withDelisted } = { ...defaultTokenListOptions, ...options };
  return withDelisted ? tokensArrayWithDelisted : tokensArray;
}

/**
 *
 */
export function listTokensForCryptoCurrency(
  currency: CryptoCurrency,
  options?: $Shape<TokensListOptions>
): TokenCurrency[] {
  const { withDelisted } = { ...defaultTokenListOptions, ...options };
  if (withDelisted) {
    return tokensByCryptoCurrencyWithDelisted[currency.id] || emptyArray;
  }
  return tokensByCryptoCurrency[currency.id] || emptyArray;
}

/**
 *
 */
export function listTokenTypesForCryptoCurrency(
  currency: CryptoCurrency
): string[] {
  return listTokensForCryptoCurrency(currency).reduce((acc, cur) => {
    const tokenType = cur.tokenType;

    if (acc.indexOf(tokenType) < 0) {
      return [...acc, tokenType];
    }

    return acc;
  }, []);
}

/**
 *
 */
export function findTokenByTicker(ticker: string): ?TokenCurrency {
  return tokensByTicker[ticker];
}

/**
 *
 */
export function findTokenById(id: string): ?TokenCurrency {
  return tokensById[id];
}

/**
 *
 */
export function findTokenByAddress(address: string): ?TokenCurrency {
  return tokensByAddress[address.toLowerCase()];
}

/**
 *
 */
export const hasTokenId = (id: string): boolean => id in tokensById;

/**
 *
 */
export function getTokenById(id: string): TokenCurrency {
  const currency = findTokenById(id);
  if (!currency) {
    throw new Error(`token with id "${id}" not found`);
  }
  return currency;
}

/**
 * if a given token account is a token that can be used in compound, give the associated compound token (cToken)
 * @param {*} token
 */
export function findCompoundToken(token: TokenCurrency): ?TokenCurrency {
  // TODO can be optimized by generating a direct map
  return listTokensForCryptoCurrency(token.parentCurrency, {
    withDelisted: true,
  }).find((t) => t.compoundFor === token.id);
}

function comparePriority(a: TokenCurrency, b: TokenCurrency) {
  return Number(!!b.disableCountervalue) - Number(!!a.disableCountervalue);
}

function addTokens(list: TokenCurrency[]) {
  list.forEach((token) => {
    if (!token.delisted) tokensArray.push(token);
    tokensArrayWithDelisted.push(token);
    tokensById[token.id] = token;

    if (
      !tokensByTicker[token.ticker] ||
      comparePriority(token, tokensByTicker[token.ticker]) > 0
    ) {
      tokensByTicker[token.ticker] = token;
    }

    tokensByAddress[token.contractAddress.toLowerCase()] = token;
    const { parentCurrency } = token;
    if (!(parentCurrency.id in tokensByCryptoCurrency)) {
      tokensByCryptoCurrency[parentCurrency.id] = [];
    }
    if (!(parentCurrency.id in tokensByCryptoCurrencyWithDelisted)) {
      tokensByCryptoCurrencyWithDelisted[parentCurrency.id] = [];
    }
    if (!token.delisted) tokensByCryptoCurrency[parentCurrency.id].push(token);
    tokensByCryptoCurrencyWithDelisted[parentCurrency.id].push(token);
  });
}

function convertERC20([
  parentCurrencyId,
  token,
  ticker,
  magnitude,
  name,
  ledgerSignature,
  contractAddress,
  disableCountervalue,
  delisted,
  countervalueTicker,
  compoundFor,
]): TokenCurrency {
  const parentCurrency = getCryptoCurrencyById(parentCurrencyId);
  return {
    type: "TokenCurrency",
    id: parentCurrencyId + "/erc20/" + token,
    ledgerSignature,
    contractAddress,
    parentCurrency,
    tokenType: "erc20",
    name,
    ticker,
    delisted,
    disableCountervalue: !!parentCurrency.isTestnetFor || !!disableCountervalue,
    countervalueTicker,
    compoundFor: compoundFor
      ? parentCurrencyId + "/erc20/" + compoundFor
      : undefined,
    units: [
      {
        name,
        code: ticker,
        magnitude,
      },
    ],
  };
}

function convertAlgorandASATokens([
  id,
  abbr,
  name,
  contractAddress,
  precision,
  enableCountervalues,
]): TokenCurrency {
  return {
    type: "TokenCurrency",
    id: `algorand/asa/${id}`,
    contractAddress,
    parentCurrency: getCryptoCurrencyById("algorand"),
    tokenType: "asa",
    name,
    ticker: abbr,
    disableCountervalue: !enableCountervalues,
    units: [
      {
        name,
        code: abbr,
        magnitude: precision,
      },
    ],
  };
}
function convertTRONTokens(type: "trc10" | "trc20") {
  return ([
    id,
    abbr,
    name,
    contractAddress,
    precision,
    delisted,
    ledgerSignature,
    enableCountervalues,
  ]): TokenCurrency => ({
    type: "TokenCurrency",
    id: `tron/${type}/${id}`,
    contractAddress,
    parentCurrency: getCryptoCurrencyById("tron"),
    tokenType: type,
    name,
    ticker: abbr,
    delisted,
    disableCountervalue: !enableCountervalues,
    ledgerSignature,
    units: [
      {
        name,
        code: abbr,
        magnitude: precision,
      },
    ],
  });
}
