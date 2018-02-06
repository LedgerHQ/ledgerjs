//@flow
import type { Currency } from "../types";

const bitcoinUnits = [
  {
    name: "bitcoin",
    code: "BTC",
    symbol: "Ƀ",
    magnitude: 8
  },
  {
    name: "mBTC",
    code: "mBTC",
    symbol: "Ƀ",
    magnitude: 5
  },
  {
    name: "bit",
    code: "bit",
    symbol: "Ƀ",
    magnitude: 2
  },
  {
    name: "satoshi",
    code: "satoshi",
    symbol: "Ƀ",
    magnitude: 0
  }
];

const cryptocurrenciesArray: Currency[] = [
  {
    coinType: 0,
    name: "bitcoin",
    scheme: "bitcoin",
    units: bitcoinUnits
  },
  {
    coinType: 1,
    name: "testnet",
    scheme: "bitcoin",
    units: bitcoinUnits
  },
  {
    coinType: 2,
    name: "litecoin",
    scheme: "litecoin",
    units: [
      {
        name: "litecoin",
        code: "LTC",
        symbol: "Ł",
        magnitude: 8
      }
    ]
  },
  {
    coinType: 3,
    name: "dogecoin",
    scheme: "dogecoin",
    units: [
      {
        name: "dogecoin",
        code: "DOGE",
        symbol: "Ð",
        magnitude: 8
      }
    ]
  },
  {
    coinType: 5,
    name: "dash",
    scheme: "dash",
    units: [
      {
        name: "dash",
        code: "DASH",
        magnitude: 8
      }
    ]
  },
  {
    coinType: 6,
    name: "peercoin",
    scheme: "peercoin",
    units: [
      {
        name: "Peercoin",
        code: "PPC",
        magnitude: 8
      }
    ]
  },
  {
    coinType: 47,
    name: "posw",
    scheme: "poswallet",
    units: [
      {
        name: "posw",
        code: "POSW",
        magnitude: 8
      }
    ]
  },
  {
    coinType: 79,
    name: "clubcoin",
    scheme: "clubcoin",
    units: [
      {
        name: "club",
        code: "CLUB",
        magnitude: 8
      }
    ]
  },
  {
    coinType: 105,
    name: "stratis",
    scheme: "stratis",
    units: [
      {
        name: "stratis",
        code: "STRAT",
        magnitude: 8
      }
    ]
  },
  {
    coinType: 133,
    name: "zcash",
    scheme: "zcash",
    units: [
      {
        name: "Zcash",
        code: "ZEC",
        magnitude: 8
      }
    ]
  },
  {
    coinType: 141,
    name: "komodo",
    scheme: "komodo",
    units: [
      {
        name: "komodo",
        code: "KMD",
        magnitude: 8
      }
    ]
  }
];

const cryptocurrencies: { [_: string]: Currency } = {};
cryptocurrenciesArray.forEach(c => {
  cryptocurrencies[String(c.coinType)] = c;
});

export function listCurrencies(): Currency[] {
  return cryptocurrenciesArray;
}

export function findCurrencyByScheme(scheme: string): ?Currency {
  return cryptocurrenciesArray.find(c => c.scheme === scheme);
}

export function hasCurrencyByCoinType(coinType: number): boolean {
  return String(coinType) in cryptocurrencies;
}

export function getCurrencyByCoinType(coinType: number): Currency {
  const currency = cryptocurrencies[String(coinType)];
  if (!currency) {
    throw new Error(`currency with coin type "${coinType}" not found`);
  }
  return currency;
}
