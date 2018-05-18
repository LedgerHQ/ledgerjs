//@flow
import type { Currency, Unit } from "../types";

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
    ticker: "BTC",
    scheme: "bitcoin",
    apiName: "btc",
    color: "#ffae35",
    xpub: 0x0488b21e,
    isSegwitSupported: true,
    handleFeePerByte: true,
    bitcoinjs: {
      bech32: "bc",
      bip32: {
        private: 76066276,
        public: 76067358
      },
      messagePrefix: "Bitcoin Signed Message:",
      pubKeyHash: 0,
      scriptHash: 5,
      wif: 128
    },
    units: bitcoinUnits
  },
  {
    coinType: 1,
    name: "Bitcoin Testnet",
    ticker: "BTC",
    scheme: "bitcoin",
    apiName: "btc_testnet",
    color: "#ffae35",
    xpub: 0x043587cf,
    isSegwitSupported: true,
    handleFeePerByte: true,
    bitcoinjs: {
      bech32: "bc",
      bip32: {
        private: 70615956,
        public: 70617039
      },
      messagePrefix: "Bitcoin Signed Message:",
      pubKeyHash: 111,
      scriptHash: 196,
      wif: 239
    },
    units: bitcoinUnits
  },
  {
    coinType: 145,
    name: "Bitcoin Cash",
    ticker: "BCH",
    scheme: "bitcoin",
    apiName: "abc",
    color: "#85bb65",
    xpub: 0x0488b21e,
    sigHashType: 0x41,
    isSegwitSupported: true,
    handleFeePerByte: true,
    bitcoinjs: {
      bech32: "bc",
      bip32: {
        private: 76066276,
        public: 76067358
      },
      messagePrefix: "Bitcoin Signed Message:",
      pubKeyHash: 0,
      scriptHash: 5,
      wif: 128
    },
    units: [
      {
        name: "bitcoin cash",
        code: "BCH",
        symbol: "Ƀ",
        magnitude: 8
      },
      {
        name: "mBCH",
        code: "mBCH",
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
    ]
  },
  {
    coinType: 156,
    name: "Bitcoin Gold",
    ticker: "BTG",
    scheme: "bitcoin",
    apiName: "btg",
    color: "#132c47",
    xpub: 76067358,
    sigHashType: 0x41,
    isSegwitSupported: true,
    handleFeePerByte: true,
    areTransactionTimestamped: false,
    bitcoinjs: {
      messagePrefix: "Bitcoin gold Signed Message:",
      bip32: {
        public: 76067358,
        private: 76066276
      },
      pubKeyHash: 38,
      scriptHash: 23,
      wif: 128
    },
    units: [
      {
        name: "bitcoin gold",
        code: "BTG",
        symbol: "Ƀ",
        magnitude: 8
      },
      {
        name: "mBTG",
        code: "mBTG",
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
    ]
  },
  {
    coinType: 2,
    name: "Litecoin",
    ticker: "LTC",
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
    ticker: "DOGE",
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
    ticker: "DASH",
    scheme: "dash",
    apiName: "dash",
    color: "#0e76aa",
    xpub: 50221816,
    isSegwitSupported: false,
    handleFeePerByte: false,
    areTransactionTimestamped: false,
    bitcoinjs: {
      messagePrefix: "DarkCoin Signed Message:",
      bip32: {
        public: 50221816,
        private: 87393172
      },
      pubKeyHash: 76,
      scriptHash: 16,
      wif: 128
    },
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
    ticker: "PPC",
    scheme: "peercoin",
    apiName: "ppc",
    color: "#3cb054",
    xpub: 3874023909,
    isSegwitSupported: false,
    handleFeePerByte: false,
    areTransactionTimestamped: true,
    bitcoinjs: {
      messagePrefix: "PPCoin Signed Message:",
      bip32: {
        public: 3874023909,
        private: 87393172
      },
      pubKeyHash: 55,
      scriptHash: 117,
      wif: 128
    },
    units: [
      {
        name: "peercoin",
        code: "PPC",
        magnitude: 6
      }
    ]
  },
  {
      coinType: 57,
      name: "Syscoin",
      ticker: "SYS",
      scheme: "syscoin",
      apiName: "sys",
      color: "#008dd1",
      xpub: 0x0488B21E,
      isSegwitSupported: false,
      handleFeePerByte: false,
      areTransactionTimestamped: false,
      bitcoinjs: {
          messagePrefix: "Syscoin Signed Message:",
          bip32: {
              private: 76066276,
              public: 76067358
          },
          pubKeyHash: 63,
          scriptHash: 5,
          wif: 128
      },
      units: [
          {
              name: "syscoin",
              code: "SYS",
              magnitude: 8
          }
      ]
  },
  {
    coinType: 105,
    name: "Stratis",
    ticker: "STRAT",
    scheme: "stratis",
    apiName: "strat",
    color: "#1382c6",
    xpub: 76071454,
    isSegwitSupported: false,
    handleFeePerByte: false,
    areTransactionTimestamped: true,
    bitcoinjs: {
      messagePrefix: "Stratis Signed Message:",
      bip32: {
        public: 76071454,
        private: 87393172
      },
      pubKeyHash: 63,
      scriptHash: 125,
      wif: 128
    },
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
    ticker: "ZEC",
    scheme: "zcash",
    apiName: "zec",
    color: "#3790ca",
    xpub: 76067358,
    isSegwitSupported: false,
    handleFeePerByte: false,
    areTransactionTimestamped: false,
    bitcoinjs: {
      messagePrefix: "Zcash Signed Message:",
      bip32: {
        public: 76067358,
        private: 87393172
      },
      pubKeyHash: new Uint8Array([0x1c, 0xb8]) /*7352*/,
      scriptHash: new Uint8Array([0x1c, 0xbd]) /*7357*/,
      wif: 128
    },
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
    ticker: "KMD",
    scheme: "komodo",
    apiName: "kmd",
    color: "#326464",
    xpub: 4193182861,
    isSegwitSupported: false,
    handleFeePerByte: false,
    areTransactionTimestamped: false,
    bitcoinjs: {
      messagePrefix: "Komodo Signed Message:",
      bip32: {
        public: 4193182861,
        private: 87393172
      },
      pubKeyHash: 60,
      scriptHash: 85,
      wif: 128
    },
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

export function getDefaultUnitByCoinType(coinType: number): Unit {
  const currency = getCurrencyByCoinType(coinType);

  // get unit with max magnitude
  const unit = currency.units.reduce(
    (acc, cur) => (!acc || acc.magnitude < cur.magnitude ? cur : acc),
    null
  );

  if (!unit) {
    throw new Error(`default unit for coin type "${coinType}" not found`);
  }
  return unit;
}
