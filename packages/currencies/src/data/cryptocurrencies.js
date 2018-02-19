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
    name: "Bitcoin",
    scheme: "bitcoin",
    color: "#ffae35",
    units: bitcoinUnits
  },
  {
    coinType: 1,
    name: "Bitcoin Testnet",
    scheme: "bitcoin",
    color: "#ffae35",
    units: bitcoinUnits
  },
  {
    coinType: 2,
    name: "Litecoin",
    scheme: "litecoin",
    color: "#cccccc",
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
    name: "Dogecoin",
    scheme: "dogecoin",
    color: "#65d196",
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
    name: "Dash",
    scheme: "dash",
    color: "#0e76aa",
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
    name: "Peercoin",
    scheme: "peercoin",
    color: "#3cb054",
    units: [
      {
        name: "peercoin",
        code: "PPC",
        magnitude: 8
      }
    ]
  },
  {
    coinType: 105,
    name: "Stratis",
    scheme: "stratis",
    color: "#1382c6",
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
    name: "Zcash",
    scheme: "zcash",
    color: "#3790ca",
    units: [
      {
        name: "zcash",
        code: "ZEC",
        magnitude: 8
      }
    ]
  },
  {
    coinType: 141,
    name: "Komodo",
    scheme: "komodo",
    color: "#326464",
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
