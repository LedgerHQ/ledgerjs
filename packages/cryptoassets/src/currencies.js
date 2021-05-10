// @flow
/*
 * DEPRECATED => these will eventually be moved into an internal crypto-assets repo
 *
 * ~~ fields ~~
 *
 * id: use by convention lowercased coin name with _ instead of space. if a coin get later rename, we NEVER rename the id for backward compatibility.
 * coinType: use https://github.com/satoshilabs/slips/blob/master/slip-0044.md
 * family: group multiple coins together. For instance the "bitcoin" family includes bitcoin and all its derivated altcoins.
 * ticker: check this is the one used in exchanges (BTW our countervalues api will only support the new coin until we do a redeployment to support it (whitelist))
 * scheme is generally the id
 * color: is the dominant color of the currency logo, we will color the logo svg with it.
 * managerAppName: if any, is the exact name of the related Ledger's app in LL Manager.
 * blockAvgTime: the average time between 2 blocks. (check online / on explorers)
 * scheme: the well accepted unique id to use in uri scheme (e.g. bitcoin:...)
 * units: specify the coin different units. There MUST be at least one. convention: it is desc ordered by magnitude, the last unit is the most divisible unit (e.g. satoshi)
 * terminated: Present when we no longer support this specific coin.
 * Specific cases:
 *
 * if it's a testnet coin, use isTestnetFor field. testnet MUST only be added if we actually support it at ledger (in our explorer api)
 * if the coin is a fork of another coin and it must support the "split", add forkedFrom info.
 * if the coin is in bitcoin family, please provide bitcoinLikeInfo field
 * if the coin is in ethereum family, you must as well provide ethereumLikeInfo
 * if bitcoin family, supportsSegwit defines if it supports segwit.
 */

import type { CryptoCurrency, Unit } from "./types";

const makeTestnetUnit = (u) => ({
  ...u,
  code: `𝚝${u.code}`,
});

const bitcoinUnits: Unit[] = [
  {
    name: "bitcoin",
    code: "BTC",
    magnitude: 8,
  },
  {
    name: "mBTC",
    code: "mBTC",
    magnitude: 5,
  },
  {
    name: "bit",
    code: "bit",
    magnitude: 2,
  },
  {
    name: "satoshi",
    code: "sat",
    magnitude: 0,
  },
];

const ethereumUnits = (name, code) => [
  {
    name,
    code,
    magnitude: 18,
  },
  {
    name: "Gwei",
    code: "Gwei",
    magnitude: 9,
  },
  {
    name: "Mwei",
    code: "Mwei",
    magnitude: 6,
  },
  {
    name: "Kwei",
    code: "Kwei",
    magnitude: 3,
  },
  {
    name: "wei",
    code: "wei",
    magnitude: 0,
  },
];

const cryptocurrenciesById: { [name: string]: CryptoCurrency } = {
  aeternity: {
    type: "CryptoCurrency",
    id: "aeternity",
    coinType: 457,
    name: "æternity",
    managerAppName: "Aeternity",
    ticker: "AE",
    scheme: "aeternity",
    color: "#f7296e",
    family: "aeternity",
    units: [
      {
        name: "AE",
        code: "AE",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.aepps.com/#/tx/$hash",
      },
    ],
  },
  aion: {
    type: "CryptoCurrency",
    id: "aion",
    coinType: 425,
    name: "Aion",
    managerAppName: "Aion",
    ticker: "AION",
    scheme: "aion",
    color: "#000000",
    family: "aion",
    units: [
      {
        name: "AION",
        code: "AION",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  akroma: {
    type: "CryptoCurrency",
    id: "akroma",
    coinType: 200625,
    name: "Akroma",
    managerAppName: "Akroma",
    ticker: "AKA",
    scheme: "akroma",
    color: "#AA0087",
    family: "ethereum",
    units: [
      {
        name: "AKA",
        code: "AKA",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://akroma.io/explorer/transaction/$hash",
      },
    ],
  },
  algorand: {
    type: "CryptoCurrency",
    id: "algorand",
    coinType: 283,
    name: "Algorand",
    managerAppName: "Algorand",
    ticker: "ALGO",
    scheme: "algorand",
    color: "#000000",
    family: "algorand",
    units: [
      {
        name: "ALGO",
        code: "ALGO",
        magnitude: 6,
      },
      {
        name: "uALGO",
        code: "uALGO",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx:
          "https://goalseeker.purestake.io/algorand/mainnet/transaction/$hash",
      },
    ],
  },
  ark: {
    type: "CryptoCurrency",
    id: "ark",
    coinType: 111,
    name: "Ark",
    managerAppName: "Ark",
    ticker: "ARK",
    scheme: "ark",
    color: "#dd3333",
    family: "ark",
    units: [
      {
        name: "ARK",
        code: "ARK",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.ark.io/transaction/$hash",
      },
    ],
  },
  atheios: {
    type: "CryptoCurrency",
    id: "atheios",
    coinType: 1620,
    name: "Atheios",
    managerAppName: "Atheios",
    ticker: "ATH",
    scheme: "atheios",
    color: "#000000",
    family: "ethereum",
    units: [
      {
        name: "ATH",
        code: "ATH",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  banano: {
    type: "CryptoCurrency",
    id: "banano",
    coinType: 198,
    name: "Banano",
    managerAppName: "Banano",
    ticker: "BANANO",
    scheme: "banano",
    color: "#000000",
    family: "nano",
    units: [
      {
        name: "BANANO",
        code: "BANANO",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  bitcoin: {
    type: "CryptoCurrency",
    id: "bitcoin",
    coinType: 0,
    name: "Bitcoin",
    managerAppName: "Bitcoin",
    ticker: "BTC",
    scheme: "bitcoin",
    color: "#ffae35",
    symbol: "Ƀ",
    units: bitcoinUnits,
    supportsSegwit: true,
    supportsNativeSegwit: true,
    family: "bitcoin",
    blockAvgTime: 15 * 60,
    bitcoinLikeInfo: {
      P2PKH: 0,
      P2SH: 5,
      XPUBVersion: 0x0488b21e,
    },
    explorerViews: [
      {
        address: "https://blockstream.info/address/$address",
        tx: "https://blockstream.info/tx/$hash",
      },
      {
        address: "https://www.blockchain.com/btc/address/$address",
        tx: "https://blockchain.info/btc/tx/$hash",
      },
    ],
  },
  bitcoin_cash: {
    type: "CryptoCurrency",
    id: "bitcoin_cash",
    forkedFrom: "bitcoin",
    coinType: 145,
    name: "Bitcoin Cash",
    managerAppName: "Bitcoin Cash",
    ticker: "BCH",
    scheme: "bitcoincash",
    color: "#3ca569",
    family: "bitcoin",
    blockAvgTime: 15 * 60,
    bitcoinLikeInfo: {
      P2PKH: 0,
      P2SH: 5,
      XPUBVersion: 0x0488b21e,
    },
    units: [
      {
        name: "bitcoin cash",
        code: "BCH",
        magnitude: 8,
      },
      {
        name: "mBCH",
        code: "mBCH",
        magnitude: 5,
      },
      {
        name: "bit",
        code: "bit",
        magnitude: 2,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://blockchair.com/bitcoin-cash/transaction/$hash",
        address: "https://blockchair.com/bitcoin-cash/address/$address",
      },
    ],
  },
  bitcoin_gold: {
    type: "CryptoCurrency",
    id: "bitcoin_gold",
    forkedFrom: "bitcoin",
    coinType: 156,
    name: "Bitcoin Gold",
    managerAppName: "Bitcoin Gold",
    ticker: "BTG",
    scheme: "btg",
    color: "#132c47",
    supportsSegwit: true,
    family: "bitcoin",
    blockAvgTime: 15 * 60,
    bitcoinLikeInfo: {
      P2PKH: 38,
      P2SH: 23,
      XPUBVersion: 0x0488b21e,
    },
    units: [
      {
        name: "bitcoin gold",
        code: "BTG",
        magnitude: 8,
      },
      {
        name: "mBTG",
        code: "mBTG",
        magnitude: 5,
      },
      {
        name: "bit",
        code: "bit",
        magnitude: 2,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://btgexplorer.com/tx/$hash",
        address: "https://btgexplorer.com/address/$address",
      },
    ],
  },
  bitcoin_private: {
    type: "CryptoCurrency",
    id: "bitcoin_private",
    forkedFrom: "bitcoin",
    coinType: 183,
    name: "Bitcoin Private",
    managerAppName: "Bitcoin Private",
    ticker: "BTCP",
    scheme: "btcp",
    color: "#2F2D63",
    family: "bitcoin",
    blockAvgTime: 2.5 * 60,
    units: [
      {
        name: "bitcoin private",
        code: "BTCP",
        magnitude: 8,
      },
      {
        name: "mBTCP",
        code: "mBTCP",
        magnitude: 5,
      },
      {
        name: "bit",
        code: "bit",
        magnitude: 2,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.btcprivate.org/tx/$hash",
        address: "https://explorer.btcprivate.org/address/$address",
      },
    ],
  },
  bnb: {
    type: "CryptoCurrency",
    id: "bnb",
    coinType: 714,
    name: "BNB",
    managerAppName: "Binance Chain",
    ticker: "BNB",
    scheme: "bnb",
    color: "#F0B90A",
    family: "bnb",
    units: [
      {
        name: "BNB",
        code: "BNB",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  callisto: {
    type: "CryptoCurrency",
    id: "callisto",
    coinType: 820,
    name: "Callisto",
    managerAppName: "Callisto",
    ticker: "CLO",
    scheme: "callisto",
    color: "#000000",
    family: "ethereum",
    units: [
      {
        name: "CLO",
        code: "CLO",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  cardano: {
    type: "CryptoCurrency",
    id: "cardano",
    coinType: 1815,
    name: "Cardano",
    managerAppName: "Cardano ADA",
    ticker: "ADA",
    scheme: "cardano",
    color: "#0A1D2C",
    family: "cardano",
    blockAvgTime: 20,
    units: [
      {
        name: "ada",
        code: "ADA",
        magnitude: 6,
      },
      {
        name: "Lovelace",
        code: "Lovelace",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://cardanoexplorer.com/tx/$hash",
        address: "https://cardanoexplorer.com/address/$address",
      },
    ],
  },
  clubcoin: {
    terminated: {
      link: "https://support.ledger.com/",
    },
    type: "CryptoCurrency",
    id: "clubcoin",
    coinType: 79,
    name: "Clubcoin",
    managerAppName: "Clubcoin",
    ticker: "CLUB",
    scheme: "club",
    color: "#000000",
    family: "bitcoin",
    blockAvgTime: 140,
    bitcoinLikeInfo: {
      P2PKH: 28,
      P2SH: 85,
      XPUBVersion: 0x0488b21e,
      hasTimestamp: true,
    },
    units: [
      {
        name: "club",
        code: "CLUB",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://chainz.cryptoid.info/club/tx.dws?$hash.htm",
      },
    ],
  },
  cosmos: {
    type: "CryptoCurrency",
    id: "cosmos",
    coinType: 118,
    name: "Cosmos",
    managerAppName: "Cosmos",
    ticker: "ATOM",
    scheme: "cosmos",
    color: "#16192f",
    family: "cosmos",
    // FIXME: enable it back when confirmation number is fixed
    // blockAvgTime: 8,
    units: [
      {
        name: "Atom",
        code: "ATOM",
        magnitude: 6,
      },
      {
        name: "microAtom",
        code: "uatom",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://www.mintscan.io/txs/$hash",
        address: "https://www.mintscan.io/validators/$address",
      },
    ],
  },
  cosmos_testnet: {
    type: "CryptoCurrency",
    id: "cosmos_testnet",
    coinType: 118,
    name: "Cosmos (Testnet)",
    managerAppName: "Cosmos",
    ticker: "MUON",
    scheme: "cosmos_testnet",
    isTestnetFor: "cosmos",
    disableCountervalue: true,
    color: "#16192f",
    family: "cosmos",
    // FIXME: enable it back when confirmation number is fixed
    // blockAvgTime: 8,
    units: [
      {
        name: "Muon",
        code: "MUON",
        magnitude: 6,
      },
      {
        name: "microMuon",
        code: "umuon",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://testnet.mintscan.io/txs/$hash",
        address: "https://testnet.mintscan.io/validators/$address",
      },
    ],
  },
  dash: {
    type: "CryptoCurrency",
    id: "dash",
    coinType: 5,
    name: "Dash",
    managerAppName: "Dash",
    ticker: "DASH",
    scheme: "dash",
    color: "#0e76aa",
    family: "bitcoin",
    blockAvgTime: 150,
    bitcoinLikeInfo: {
      P2PKH: 76,
      P2SH: 16,
      XPUBVersion: 0x02fe52f8,
    },
    units: [
      {
        name: "dash",
        code: "DASH",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.dash.org/tx/$hash",
        address: "https://explorer.dash.org/address/$address",
      },
    ],
  },
  decred: {
    type: "CryptoCurrency",
    id: "decred",
    coinType: 42,
    name: "Decred",
    managerAppName: "Decred",
    ticker: "DCR",
    scheme: "decred",
    color: "#2f74fb",
    units: [
      {
        name: "decred",
        code: "DCR",
        magnitude: 8,
      },
      {
        name: "milli-decred",
        code: "mDCR",
        magnitude: 5,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    family: "bitcoin",
    blockAvgTime: 15 * 60,
    bitcoinLikeInfo: {
      P2PKH: 0x073f,
      P2SH: 0x071a,
      XPUBVersion: 0x02fda926,
    },
    explorerViews: [
      {
        tx: "https://mainnet.decred.org/tx/$hash",
        address: "https://mainnet.decred.org/address/$address",
      },
    ],
  },
  dexon: {
    type: "CryptoCurrency",
    id: "dexon",
    coinType: 237,
    name: "DEXON",
    managerAppName: "DEXON",
    ticker: "DXN",
    scheme: "dexon",
    color: "#000000",
    family: "ethereum",
    ethereumLikeInfo: {
      chainId: 237,
    },
    units: [
      {
        name: "dexon",
        code: "DXN",
        magnitude: 6,
      },
    ],
    explorerViews: [
      {
        tx: "https://dexonscan.app/transaction/$hash",
        address: "https://dexonscan.app/address/$address",
      },
    ],
  },
  digibyte: {
    type: "CryptoCurrency",
    id: "digibyte",
    coinType: 20,
    name: "DigiByte",
    managerAppName: "Digibyte",
    ticker: "DGB",
    scheme: "digibyte",
    color: "#0066cc",
    family: "bitcoin",
    supportsSegwit: true,
    supportsNativeSegwit: true,
    blockAvgTime: 60,
    bitcoinLikeInfo: {
      P2PKH: 30,
      P2SH: 63,
      XPUBVersion: 0x0488b21e,
    },
    units: [
      {
        name: "digibyte",
        code: "DGB",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://digiexplorer.info/tx/$hash",
        address: "https://digiexplorer.info/address/$address",
      },
    ],
  },
  dogecoin: {
    type: "CryptoCurrency",
    id: "dogecoin",
    coinType: 3,
    name: "Dogecoin",
    managerAppName: "Dogecoin",
    ticker: "DOGE",
    scheme: "dogecoin",
    color: "#65d196",
    family: "bitcoin",
    blockAvgTime: 60,
    bitcoinLikeInfo: {
      P2PKH: 30,
      P2SH: 22,
      XPUBVersion: 0x02facafd,
    },
    symbol: "Ð",
    units: [
      {
        name: "dogecoin",
        code: "DOGE",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://dogechain.info/tx/$hash",
        address: "https://dogechain.info/address/$address",
      },
    ],
  },
  elastos: {
    type: "CryptoCurrency",
    id: "elastos",
    coinType: 2305,
    name: "Elastos",
    managerAppName: "Elastos",
    ticker: "ELA",
    scheme: "elastos",
    color: "#000",
    family: "elastos",
    units: [
      {
        name: "ELA",
        code: "ELA",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  ellaism: {
    type: "CryptoCurrency",
    id: "ellaism",
    coinType: 163,
    name: "Ellaism",
    managerAppName: "Ellaism",
    ticker: "ELLA",
    scheme: "ellaism",
    color: "#000000",
    family: "ethereum",
    units: [
      {
        name: "ELLA",
        code: "ELLA",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  elrond: {
    type: "CryptoCurrency",
    id: "elrond",
    coinType: 508,
    name: "Elrond",
    managerAppName: "Elrond (eGLD)",
    ticker: "EGLD",
    scheme: "elrond",
    color: "#1b46c2",
    family: "elrond",
    blockAvgTime: 6,
    units: [
      {
        name: "EGLD",
        code: "egld",
        magnitude: 18,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.elrond.com/transactions/$hash",
        address: "https://explorer.elrond.com/accounts/$address",
      },
    ],
  },
  energywebchain: {
    type: "CryptoCurrency",
    id: "energywebchain",
    coinType: 246,
    name: "EnergyWebChain",
    managerAppName: "EnergyWebChain",
    ticker: "EWT",
    scheme: "energywebchain",
    color: "#000",
    family: "ethereum",
    ethereumLikeInfo: {
      chainId: 246,
    },
    units: [
      {
        name: "EWT",
        code: "EWT",
        magnitude: 18,
      },
    ],
    explorerViews: [],
  },
  eos: {
    type: "CryptoCurrency",
    id: "eos",
    coinType: 194,
    name: "EOS",
    managerAppName: "Eos",
    ticker: "EOS",
    scheme: "eos",
    color: "#000000",
    family: "eos",
    units: [
      {
        name: "EOS",
        code: "EOS",
        magnitude: 2,
      },
    ],
    explorerViews: [],
  },
  ethereum: {
    type: "CryptoCurrency",
    id: "ethereum",
    coinType: 60,
    name: "Ethereum",
    managerAppName: "Ethereum",
    ticker: "ETH",
    scheme: "ethereum",
    color: "#0ebdcd",
    symbol: "Ξ",
    units: ethereumUnits("ether", "ETH"),
    family: "ethereum",
    blockAvgTime: 15,
    ethereumLikeInfo: {
      chainId: 1,
    },
    explorerViews: [
      {
        tx: "https://etherscan.io/tx/$hash",
        address: "https://etherscan.io/address/$address",
        token: "https://etherscan.io/token/$contractAddress?a=$address",
      },
    ],
  },
  ethereum_classic: {
    type: "CryptoCurrency",
    id: "ethereum_classic",
    coinType: 61,
    name: "Ethereum Classic",
    managerAppName: "Ethereum Classic",
    ticker: "ETC",
    scheme: "ethereumclassic",
    color: "#3ca569",
    units: ethereumUnits("ETC", "ETC"),
    family: "ethereum",
    blockAvgTime: 15,
    ethereumLikeInfo: {
      chainId: 61,
    },
    explorerViews: [
      {
        tx: "https://blockscout.com/etc/mainnet/tx/$hash/internal-transactions",
        address:
          "https://blockscout.com/etc/mainnet/address/$address/transactions",
      },
    ],
  },
  ether1: {
    type: "CryptoCurrency",
    id: "ether1",
    coinType: 61,
    name: "Ether1",
    managerAppName: "Ether-1",
    ticker: "ETHO",
    scheme: "ether1",
    color: "#000000",
    units: ethereumUnits("ETHO", "ETHO"),
    family: "ethereum",
    blockAvgTime: 15,
    ethereumLikeInfo: {
      chainId: 1313114,
    },
    explorerViews: [],
  },
  ethergem: {
    type: "CryptoCurrency",
    id: "ethergem",
    coinType: 61,
    name: "EtherGem",
    managerAppName: "EtherGem",
    ticker: "EGEM",
    scheme: "ethergem",
    color: "#000000",
    units: ethereumUnits("EGEM", "EGEM"),
    family: "ethereum",
    blockAvgTime: 15,
    ethereumLikeInfo: {
      chainId: 1987,
    },
    explorerViews: [],
  },
  ethersocial: {
    type: "CryptoCurrency",
    id: "ethersocial",
    coinType: 61,
    name: "Ethersocial",
    managerAppName: "Ethersocial",
    ticker: "ESN",
    scheme: "ethersocial",
    color: "#000000",
    units: ethereumUnits("ESN", "ESN"),
    family: "ethereum",
    blockAvgTime: 15,
    ethereumLikeInfo: {
      chainId: 31102,
    },
    explorerViews: [],
  },
  expanse: {
    type: "CryptoCurrency",
    id: "expanse",
    coinType: 40,
    name: "Expanse",
    managerAppName: "Expanse",
    ticker: "EXP",
    scheme: "expanse",
    color: "#EE4500",
    family: "ethereum",
    units: [
      {
        name: "EXP",
        code: "EXP",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://gander.tech/tx/$hash",
      },
    ],
  },
  factom: {
    type: "CryptoCurrency",
    id: "factom",
    coinType: 131,
    name: "Factom",
    managerAppName: "Factom",
    ticker: "FCT",
    scheme: "factom",
    color: "#2F2879",
    family: "factom",
    units: [
      {
        name: "FCT",
        code: "FCT",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  fic: {
    type: "CryptoCurrency",
    id: "fic",
    coinType: 5248,
    name: "FIC",
    managerAppName: "FIC",
    ticker: "FIC",
    scheme: "fic",
    color: "#5157D8",
    family: "fic",
    units: [
      {
        name: "FIC",
        code: "FIC",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  flow: {
    type: "CryptoCurrency",
    id: "flow",
    coinType: 539,
    name: "Flow",
    managerAppName: "Flow",
    ticker: "FLOW",
    scheme: "flow",
    color: "#000",
    family: "flow",
    units: [
      {
        name: "FLOW",
        code: "FLOW",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  game_credits: {
    type: "CryptoCurrency",
    id: "game_credits",
    coinType: 101,
    name: "GameCredits",
    managerAppName: "GameCredits",
    ticker: "GAME",
    scheme: "game",
    color: "#24485D",
    family: "bitcoin",
    units: [
      {
        name: "GAME",
        code: "GAME",
        magnitude: 8,
      },
    ],
    bitcoinLikeInfo: {
      P2PKH: 38,
      P2SH: 62,
    },
    explorerViews: [],
  },
  gochain: {
    type: "CryptoCurrency",
    id: "gochain",
    coinType: 6060,
    name: "GoChain",
    managerAppName: "GoChain",
    ticker: "GO",
    scheme: "gochain",
    color: "#000000",
    family: "ethereum",
    units: [
      {
        name: "GO",
        code: "GO",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  groestlcoin: {
    type: "CryptoCurrency",
    id: "groestcoin",
    coinType: 17,
    name: "Groestlcoin",
    managerAppName: "Groestlcoin",
    ticker: "GRS",
    scheme: "groestcoin",
    color: "#0299C0",
    family: "groestcoin",
    blockAvgTime: 60,
    units: [
      {
        name: "GRS",
        code: "GRS",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://chainz.cryptoid.info/grs/tx.dws?$hash.htm",
      },
    ],
  },
  hcash: {
    type: "CryptoCurrency",
    id: "hcash",
    coinType: 171,
    name: "Hcash",
    managerAppName: "HCash",
    ticker: "HSR",
    scheme: "hcash",
    color: "#56438c",
    family: "bitcoin",
    blockAvgTime: 150,
    bitcoinLikeInfo: {
      P2PKH: 40,
      P2SH: 100,
      XPUBVersion: 0x0488c21e,
      hasTimestamp: true,
    },
    units: [
      {
        name: "hcash",
        code: "HSR",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [],
    terminated: {
      link: "https://support.ledger.com/hc/en-us/articles/115003917133",
    },
  },
  hedera: {
    type: "CryptoCurrency",
    id: "hedera",
    coinType: 3030,
    name: "Hedera",
    managerAppName: "Hedera",
    ticker: "HBAR",
    scheme: "hedera",
    color: "#000",
    family: "hedera",
    units: [
      {
        name: "HBAR",
        code: "HBAR",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  hpb: {
    type: "CryptoCurrency",
    id: "hpb",
    coinType: 269,
    name: "High Performance Blockchain",
    managerAppName: "HPB",
    ticker: "HPB",
    scheme: "hpb",
    color: "#3B3BE2",
    family: "ethereum",
    ethereumLikeInfo: {
      chainId: 269,
    },
    units: [
      {
        name: "hpb",
        code: "HPB",
        magnitude: 18,
      },
    ],
    blockAvgTime: 6,
    explorerViews: [
      {
        tx: "https://hpbscan.org/tx/$hash",
        address: "https://hpbscan.org/address/$address",
      },
    ],
  },
  hycon: {
    type: "CryptoCurrency",
    id: "hycon",
    coinType: 1397,
    name: "Hycon",
    managerAppName: "Hycon",
    ticker: "HYC",
    scheme: "hycon",
    color: "#00B3FF",
    family: "hycon",
    units: [
      {
        name: "HYCON",
        code: "HYCON",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.hycon.io/tx/$hash",
        address: "https://explorer.hycon.io/address/$address",
      },
    ],
  },
  icon: {
    type: "CryptoCurrency",
    id: "icon",
    coinType: 4801368,
    name: "ICON",
    managerAppName: "ICON",
    ticker: "ICX",
    scheme: "icon",
    color: "#00A3B4",
    family: "icon",
    units: [
      {
        name: "ICON",
        code: "ICON",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  iota: {
    type: "CryptoCurrency",
    id: "iota",
    coinType: 4218,
    name: "IOTA",
    managerAppName: "IOTA",
    ticker: "MIOTA",
    scheme: "iota",
    color: "#000000",
    family: "iota",
    units: [
      {
        name: "IOTA",
        code: "IOTA",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  iov: {
    type: "CryptoCurrency",
    id: "iov",
    coinType: 234,
    name: "IOV",
    managerAppName: "IOV",
    ticker: "IOV",
    scheme: "iov",
    color: "#000",
    family: "iov",
    units: [
      {
        name: "IOV",
        code: "IOV",
        magnitude: 6,
      },
    ],
    explorerViews: [],
  },
  kin: {
    type: "CryptoCurrency",
    id: "kin",
    coinType: 2017,
    name: "Kin",
    managerAppName: "Kin",
    ticker: "KIN",
    scheme: "kin",
    color: "#0C4DD6",
    family: "stellar",
    units: [
      {
        name: "KIN",
        code: "KIN",
        magnitude: 5,
      },
    ],
    explorerViews: [
      {
        tx:
          "https://www.kin.org/blockchainInfoPage/?&dataType=public&header=Transaction&id=$hash",
        address:
          "https://www.kin.org/blockchainAccount/?&dataType=public&header=accountID&id=$address",
      },
    ],
  },
  komodo: {
    type: "CryptoCurrency",
    id: "komodo",
    coinType: 141,
    name: "Komodo",
    managerAppName: "Komodo",
    ticker: "KMD",
    scheme: "komodo",
    color: "#326464",
    family: "bitcoin",
    blockAvgTime: 60,
    bitcoinLikeInfo: {
      P2PKH: 60,
      P2SH: 85,
      XPUBVersion: 0xf9eee48d,
    },
    units: [
      {
        name: "komodo",
        code: "KMD",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://kmdexplorer.io/tx/$hash",
        address: "https://kmdexplorer.io/address/$address",
      },
    ],
  },
  kusama: {
    type: "CryptoCurrency",
    id: "kusama",
    coinType: 434,
    name: "Kusama",
    managerAppName: "Kusama",
    ticker: "KSM",
    scheme: "kusama",
    color: "#000",
    family: "kusama",
    units: [
      {
        name: "KSM",
        code: "KSM",
        magnitude: 12,
      },
    ],
    explorerViews: [],
  },
  lbry: {
    type: "CryptoCurrency",
    id: "LBRY",
    coinType: 140,
    name: "LBRY",
    managerAppName: "LBRY",
    ticker: "LBRY",
    scheme: "LBRY",
    color: "#000",
    family: "bitcoin",
    units: [
      {
        name: "LBRY",
        code: "LBRY",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  litecoin: {
    type: "CryptoCurrency",
    id: "litecoin",
    coinType: 2,
    name: "Litecoin",
    managerAppName: "Litecoin",
    ticker: "LTC",
    scheme: "litecoin",
    color: "#cccccc",
    supportsSegwit: true,
    supportsNativeSegwit: true,
    family: "bitcoin",
    blockAvgTime: 5 * 60,
    bitcoinLikeInfo: {
      P2PKH: 48,
      P2SH: 50,
      XPUBVersion: 0x019da462,
    },
    symbol: "Ł",
    units: [
      {
        name: "litecoin",
        code: "LTC",
        magnitude: 8,
      },
      {
        name: "mLTC",
        code: "mLTC",
        magnitude: 5,
      },
      {
        name: "litoshi",
        code: "litoshi",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://live.blockcypher.com/ltc/tx/$hash",
        address: "https://live.blockcypher.com/ltc/address/$address",
      },
    ],
  },
  lisk: {
    type: "CryptoCurrency",
    id: "lisk",
    coinType: 134,
    name: "lisk",
    managerAppName: "Lisk",
    ticker: "LSK",
    scheme: "lisk",
    color: "#16213D",
    family: "lisk",
    units: [
      {
        name: "LSK",
        code: "LSK",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  mix: {
    type: "CryptoCurrency",
    id: "mix",
    coinType: 76,
    name: "MIX Blockchain",
    managerAppName: "Mix",
    ticker: "MIX",
    scheme: "mix",
    color: "#00C4DF",
    family: "ethereum",
    ethereumLikeInfo: {
      chainId: 76,
    },
    units: [
      {
        name: "MIX",
        code: "MIX",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  monero: {
    type: "CryptoCurrency",
    id: "monero",
    coinType: 128,
    name: "Monero",
    managerAppName: "Monero",
    ticker: "XMR",
    scheme: "monero",
    color: "#FF5900",
    family: "monero",
    units: [
      {
        name: "XMR",
        code: "XMR",
        magnitude: 12,
      },
    ],
    explorerViews: [
      {
        tx: "https://moneroblocks.info/tx/$hash",
      },
    ],
  },
  musicoin: {
    type: "CryptoCurrency",
    id: "musicoin",
    coinType: 184,
    name: "Musicoin",
    managerAppName: "Musicoin",
    ticker: "MUSIC",
    scheme: "musicoin",
    color: "#000000",
    family: "ethereum",
    ethereumLikeInfo: {
      chainId: 7762959,
    },
    units: [
      {
        name: "MUSIC",
        code: "MUSIC",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  nano: {
    type: "CryptoCurrency",
    id: "nano",
    coinType: 165,
    name: "Nano",
    managerAppName: "Nano",
    ticker: "NANO",
    scheme: "nano",
    color: "#4E8FB6",
    family: "nano",
    units: [
      {
        name: "NANO",
        code: "NANO",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://nanoexplorer.io/blocks/$hash",
      },
    ],
  },
  neo: {
    type: "CryptoCurrency",
    id: "neo",
    coinType: 888,
    name: "Neo",
    managerAppName: "NEO",
    ticker: "NEO",
    scheme: "neo",
    color: "#09C300",
    family: "neo",
    units: [
      {
        name: "NEO",
        code: "NEO",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://neotracker.io/tx/$hash",
      },
    ],
  },
  nimiq: {
    type: "CryptoCurrency",
    id: "nimiq",
    coinType: 242,
    name: "Nimiq",
    managerAppName: "Nimiq",
    ticker: "NIM",
    scheme: "nimiq",
    color: "#FFBE00",
    family: "nimiq",
    units: [
      {
        name: "NIM",
        code: "NIM",
        magnitude: 5,
      },
    ],
    explorerViews: [
      {
        tx: "https://nimiq.watch/#$hash",
      },
    ],
  },
  nix: {
    type: "CryptoCurrency",
    id: "nix",
    coinType: 400,
    name: "Nix",
    managerAppName: "NIX",
    ticker: "NIX",
    scheme: "nix",
    color: "#344cff",
    supportsSegwit: true,
    family: "bitcoin",
    blockAvgTime: 120,
    bitcoinLikeInfo: {
      P2PKH: 38,
      P2SH: 53,
    },
    units: [
      {
        name: "nix",
        code: "NIX",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://blockchain.nixplatform.io/tx/$hash",
      },
    ],
  },
  nos: {
    type: "CryptoCurrency",
    id: "nos",
    name: "NOS",
    coinType: 229,
    managerAppName: "NOS",
    ticker: "NOS",
    scheme: "nos",
    color: "#2B92D3",
    family: "nano",
    units: [
      {
        name: "NOS",
        code: "NOS",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  ontology: {
    type: "CryptoCurrency",
    id: "ontology",
    coinType: 1024,
    name: "Ontology",
    managerAppName: "ONT",
    ticker: "ONT",
    scheme: "ontology",
    color: "#00A6C2",
    family: "ontology",
    units: [
      {
        name: "ONT",
        code: "ONT",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.ont.io/transaction/$hash",
      },
    ],
  },
  particl: {
    type: "CryptoCurrency",
    id: "particl",
    coinType: 44,
    name: "Particl",
    managerAppName: "Particl",
    ticker: "PART",
    scheme: "particl",
    color: "#00E3A4",
    family: "particl",
    units: [
      {
        name: "PART",
        code: "PART",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.particl.io/tx/$hash",
      },
    ],
  },
  peercoin: {
    type: "CryptoCurrency",
    id: "peercoin",
    coinType: 6,
    name: "Peercoin",
    managerAppName: "Peercoin",
    ticker: "PPC",
    scheme: "peercoin",
    color: "#3cb054",
    family: "bitcoin",
    blockAvgTime: 450,
    bitcoinLikeInfo: {
      P2PKH: 55,
      P2SH: 117,
      XPUBVersion: 0xe6e8e9e5,
      hasTimestamp: true,
    },
    units: [
      {
        name: "peercoin",
        code: "PPC",
        magnitude: 6,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.peercoin.net/tx/$hash",
        address: "https://explorer.peercoin.net/address/$address",
      },
    ],
  },
  pirl: {
    type: "CryptoCurrency",
    id: "pirl",
    coinType: 164,
    name: "Pirl",
    managerAppName: "Pirl",
    ticker: "PIRL",
    scheme: "pirl",
    color: "#A2D729",
    family: "ethereum",
    units: [
      {
        name: "PIRL",
        code: "PIRL",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://poseidon.pirl.io/explorer/transaction/$hash",
      },
    ],
  },
  pivx: {
    type: "CryptoCurrency",
    id: "pivx",
    coinType: 77,
    name: "PivX",
    managerAppName: "PivX",
    ticker: "PIVX",
    scheme: "pivx",
    color: "#46385d",
    family: "bitcoin",
    blockAvgTime: 150,
    bitcoinLikeInfo: {
      P2PKH: 30,
      P2SH: 13,
      XPUBVersion: 0x022d2533,
    },
    units: [
      {
        name: "pivx",
        code: "PIVX",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://chainz.cryptoid.info/pivx/tx.dws?$hash.htm",
        address: "https://chainz.cryptoid.info/pivx/address.dws?$address.htm",
      },
    ],
  },
  poa: {
    type: "CryptoCurrency",
    id: "poa",
    coinType: 178,
    name: "POA",
    managerAppName: "POA",
    ticker: "POA",
    scheme: "poa",
    color: "#4D46BD",
    family: "ethereum",
    units: [
      {
        name: "POA",
        code: "POA",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://poaexplorer.com/tx/$hash",
      },
    ],
  },
  polkadot: {
    type: "CryptoCurrency",
    id: "polkadot",
    coinType: 354,
    name: "Polkadot",
    managerAppName: "Polkadot",
    ticker: "DOT",
    countervalueTicker: "PDOT",
    scheme: "polkadot",
    color: "#E6007A",
    family: "polkadot",
    units: [
      {
        name: "DOT",
        code: "DOT",
        magnitude: 10,
      },
      {
        name: "planck",
        code: "PLANCK",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        address: "https://polkadot.subscan.io/account/$address",
        tx: "https://polkadot.subscan.io/extrinsic/$hash",
      },
      {
        address: "https://polkascan.io/polkadot/account/$address",
        tx: "https://polkascan.io/polkadot/transaction/$hash",
      },
    ],
  },
  poswallet: {
    type: "CryptoCurrency",
    id: "poswallet",
    coinType: 47,
    name: "PosW",
    managerAppName: "PoSW",
    ticker: "POSW",
    scheme: "posw",
    color: "#000000", // FIXME
    family: "bitcoin",
    blockAvgTime: 60,
    bitcoinLikeInfo: {
      P2PKH: 55,
      P2SH: 85,
      XPUBVersion: 0x0488b21e,
      hasTimestamp: true,
    },
    units: [
      {
        name: "posw",
        code: "POSW",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [],
    terminated: {
      link: "https://support.ledger.com/hc/en-us/articles/115005175309",
    },
  },
  qrl: {
    type: "CryptoCurrency",
    id: "qrl",
    coinType: 238,
    name: "QRL",
    ticker: "QRL",
    managerAppName: "QRL",
    scheme: "qrl",
    color: "#1D2951",
    family: "qrl",
    blockAvgTime: 60,
    units: [
      {
        name: "QRL",
        code: "QRL",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.theqrl.org/tx/$hash",
        address: "https://explorer.theqrl.org/a/$address",
      },
    ],
  },
  qtum: {
    type: "CryptoCurrency",
    id: "qtum",
    coinType: 88,
    name: "Qtum",
    managerAppName: "Qtum",
    supportsSegwit: true,
    ticker: "QTUM",
    scheme: "qtum",
    color: "#2e9ad0",
    family: "bitcoin",
    blockAvgTime: 2 * 60,
    bitcoinLikeInfo: {
      P2PKH: 58,
      P2SH: 50,
      XPUBVersion: 0x0488b21e,
    },
    units: [
      {
        name: "qtum",
        code: "QTUM",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.qtum.org/tx/$hash",
        address: "https://explorer.qtum.org/address/$address",
      },
    ],
  },
  nem: {
    type: "CryptoCurrency",
    id: "nem",
    coinType: 43,
    name: "NEM",
    managerAppName: "NEM",
    ticker: "XEM",
    scheme: "nem",
    color: "#000",
    family: "nem",
    units: [
      {
        name: "XEM",
        code: "XEM",
        magnitude: 6,
      },
    ],
    explorerViews: [],
  },
  ravencoin: {
    type: "CryptoCurrency",
    id: "ravencoin",
    coinType: 175,
    name: "Ravencoin",
    managerAppName: "Ravencoin",
    ticker: "RVN",
    scheme: "ravencoin",
    color: "#000",
    family: "bitcoin",
    units: [
      {
        name: "RVN",
        code: "RVN",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  ripple: {
    type: "CryptoCurrency",
    id: "ripple",
    coinType: 144,
    name: "XRP",
    managerAppName: "XRP",
    ticker: "XRP",
    scheme: "ripple",
    color: "#27a2db",
    units: [
      {
        name: "XRP",
        code: "XRP",
        magnitude: 6,
      },
      {
        name: "drop",
        code: "drop",
        magnitude: 0,
      },
    ],
    family: "ripple",
    explorerViews: [
      {
        tx: "https://bithomp.com/explorer/$hash",
        address: "https://bithomp.com/explorer/$address",
      },
    ],
  },
  rise: {
    type: "CryptoCurrency",
    id: "rise",
    coinType: 1120,
    name: "Rise",
    managerAppName: "Rise",
    ticker: "RISE",
    scheme: "rise",
    color: "#FC1E4F",
    family: "rise",
    blockAvgTime: 30,
    units: [
      {
        name: "RISE",
        code: "RISE",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.rise.vision/tx/$hash",
        address: "https://explorer.rise.vision/tx/$address",
      },
    ],
  },
  reosc: {
    type: "CryptoCurrency",
    id: "reosc",
    coinType: 2894,
    name: "REOSC",
    managerAppName: "REOSC",
    ticker: "REOSC",
    scheme: "reosc",
    color: "#0E00FF",
    family: "ethereum",
    ethereumLikeInfo: {
      chainId: 2894,
    },
    units: [
      {
        name: "REOSC",
        code: "REOSC",
        magnitude: 16,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.reosc.io/tx/$hash",
        address: "https://explorer.reosc.io/addr/$address",
      },
    ],
  },
  resistance: {
    type: "CryptoCurrency",
    id: "resistance",
    coinType: 356,
    name: "Resistance",
    managerAppName: "Resistance",
    ticker: "RES",
    scheme: "resistance",
    color: "#000",
    family: "bitcoin",
    units: [
      {
        name: "RES",
        code: "RES",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  solana: {
    type: "CryptoCurrency",
    id: "solana",
    coinType: 501,
    name: "Solana",
    managerAppName: "Solana",
    ticker: "SOL",
    scheme: "solana",
    color: "#000",
    family: "solana",
    units: [
      {
        name: "SOL",
        code: "SOL",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  stakenet: {
    type: "CryptoCurrency",
    id: "stakenet",
    coinType: 384,
    name: "Stakenet",
    managerAppName: "XSN",
    ticker: "XSN",
    scheme: "xsn",
    color: "#141828",
    supportsSegwit: true,
    family: "bitcoin",
    blockAvgTime: 60,
    bitcoinLikeInfo: {
      P2PKH: 76,
      P2SH: 16,
      XPUBVersion: 0x0488b21e,
    },
    units: [
      {
        name: "xsn",
        code: "XSN",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://xsnexplorer.io/transactions/$hash",
        address: "https://xsnexplorer.io/addresses/$address",
      },
    ],
  },
  stratis: {
    type: "CryptoCurrency",
    id: "stratis",
    coinType: 105,
    name: "Stratis",
    managerAppName: "Stratis",
    ticker: "STRAT",
    scheme: "stratis",
    color: "#1382c6",
    family: "bitcoin",
    blockAvgTime: 150,
    bitcoinLikeInfo: {
      P2PKH: 63,
      P2SH: 125,
      XPUBVersion: 0x0488c21e,
      hasTimestamp: true,
    },
    units: [
      {
        name: "stratis",
        code: "STRAT",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://chainz.cryptoid.info/strat/tx.dws?$hash.htm",
        address: "https://chainz.cryptoid.info/strat/address.dws?$address.htm",
      },
    ],
  },
  stealthcoin: {
    type: "CryptoCurrency",
    id: "stealthcoin",
    coinType: 125,
    name: "Stealth",
    managerAppName: "Stealth",
    ticker: "XST",
    scheme: "stealth",
    color: "#000000",
    family: "bitcoin",
    blockAvgTime: 150,
    bitcoinLikeInfo: {
      P2PKH: 62,
      P2SH: 85,
      XPUBVersion: 0x8f624b66,
      hasTimestamp: false,
    },
    units: [
      {
        name: "stealth",
        code: "XST",
        magnitude: 6,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://chain.stealth.org/tx/$hash",
        address: "https://chain.stealth.org/address/$address",
      },
    ],
  },
  stellar: {
    type: "CryptoCurrency",
    id: "stellar",
    coinType: 148,
    name: "Stellar",
    managerAppName: "Stellar",
    ticker: "XLM",
    scheme: "stellar",
    color: "#000000",
    family: "stellar",
    units: [
      {
        name: "Lumen",
        code: "XLM",
        magnitude: 7,
      },
      {
        name: "stroop",
        code: "stroop",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://stellar.expert/explorer/public/tx/$hash",
      },
    ],
  },
  tezos: {
    type: "CryptoCurrency",
    id: "tezos",
    coinType: 1729,
    name: "Tezos",
    managerAppName: "Tezos Wallet",
    ticker: "XTZ",
    scheme: "tezos",
    color: "#007BFF",
    family: "tezos",
    blockAvgTime: 60,
    units: [
      {
        name: "XTZ",
        code: "XTZ",
        magnitude: 6,
      },
    ],
    explorerViews: [
      {
        tx: "https://tzstats.com/operation/$hash",
        address: "https://tzstats.com/account/$address",
      },
    ],
  },
  thundercore: {
    type: "CryptoCurrency",
    id: "thundercore",
    coinType: 1001,
    name: "Thundercore",
    managerAppName: "Thundercore",
    ticker: "TT",
    scheme: "thundercore",
    color: "#000",
    family: "ethereum",
    ethereumLikeInfo: {
      chainId: 108,
    },
    units: [
      {
        name: "TT",
        code: "TT",
        magnitude: 18,
      },
    ],
    explorerViews: [],
  },
  tomo: {
    type: "CryptoCurrency",
    id: "tomo",
    coinType: 889,
    name: "TomoChain",
    managerAppName: "TomoChain",
    ticker: "TOMO",
    scheme: "tomo",
    color: "#FF9933",
    family: "ethereum",
    ethereumLikeInfo: {
      chainId: 88,
    },
    blockAvgTime: 2,
    units: [
      {
        name: "TOMO",
        code: "TOMO",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://scan.tomochain.com/txs/$hash",
      },
    ],
  },
  tron: {
    type: "CryptoCurrency",
    id: "tron",
    coinType: 195,
    name: "Tron",
    managerAppName: "Tron",
    ticker: "TRX",
    scheme: "tron",
    color: "#D9012C",
    family: "tron",
    blockAvgTime: 3,
    units: [
      {
        name: "TRX",
        code: "TRX",
        magnitude: 6,
      },
    ],
    explorerViews: [
      {
        tx: "https://tronscan.org/#/transaction/$hash",
        address: "https://tronscan.org/#/address/$address",
      },
    ],
  },
  ubiq: {
    type: "CryptoCurrency",
    id: "ubiq",
    coinType: 108,
    name: "Ubiq",
    managerAppName: "Ubiq",
    ticker: "UBQ",
    scheme: "ubiq",
    color: "#02e785",
    family: "ethereum",
    ethereumLikeInfo: {
      chainId: 8,
    },
    blockAvgTime: 88,
    units: [
      {
        name: "ubiq",
        code: "UBQ",
        magnitude: 18,
      },
      {
        name: "Gwei",
        code: "Gwei",
        magnitude: 9,
      },
      {
        name: "Mwei",
        code: "Mwei",
        magnitude: 6,
      },
      {
        name: "Kwei",
        code: "Kwei",
        magnitude: 3,
      },
      {
        name: "wei",
        code: "wei",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://ubiqscan.io/tx/$hash",
      },
    ],
  },
  vechain: {
    type: "CryptoCurrency",
    id: "vechain",
    coinType: 818,
    name: "VeChain",
    managerAppName: "VeChain",
    ticker: "VET",
    scheme: "vechain",
    color: "#00C2FF",
    family: "vechain",
    units: [
      {
        name: "VET",
        code: "VET",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://explore.veforge.com/transactions/$hash",
      },
    ],
  },
  vertcoin: {
    type: "CryptoCurrency",
    id: "vertcoin",
    coinType: 28,
    name: "Vertcoin",
    managerAppName: "Vertcoin",
    ticker: "VTC",
    scheme: "vertcoin",
    color: "#1b5c2e",
    supportsSegwit: true,
    family: "bitcoin",
    blockAvgTime: 150,
    bitcoinLikeInfo: {
      P2PKH: 71,
      P2SH: 5,
      XPUBVersion: 0x0488b21e,
    },
    units: [
      {
        name: "vertcoin",
        code: "VTC",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://www.coinexplorer.net/VTC/transaction/$hash",
        address: "https://www.coinexplorer.net/VTC/address/$address",
      },
    ],
  },
  viacoin: {
    type: "CryptoCurrency",
    id: "viacoin",
    coinType: 14,
    name: "Viacoin",
    managerAppName: "Viacoin",
    ticker: "VIA",
    scheme: "viacoin",
    color: "#414141",
    supportsSegwit: true,
    family: "bitcoin",
    blockAvgTime: 24,
    bitcoinLikeInfo: {
      P2PKH: 71,
      P2SH: 33,
      XPUBVersion: 0x0488b21e,
    },
    units: [
      {
        name: "viacoin",
        code: "VIA",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.viacoin.org/tx/$hash",
        address: "https://explorer.viacoin.org/address/$address",
      },
    ],
  },
  wanchain: {
    type: "CryptoCurrency",
    id: "wanchain",
    coinType: 5718350,
    name: "Wanchain",
    managerAppName: "Wanchain",
    ticker: "WAN",
    scheme: "wanchain",
    color: "#276097",
    family: "ethereum",
    units: [
      {
        name: "WAN",
        code: "WAN",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.wanchain.org/block/trans/$hash",
      },
    ],
  },
  waves: {
    type: "CryptoCurrency",
    id: "waves",
    coinType: 5741564,
    name: "Waves",
    managerAppName: "Waves",
    ticker: "WAVES",
    scheme: "waves",
    color: "#004FFF",
    family: "waves",
    units: [
      {
        name: "WAVES",
        code: "WAVES",
        magnitude: 8,
      },
    ],
    explorerViews: [],
  },
  zcash: {
    type: "CryptoCurrency",
    id: "zcash",
    coinType: 133,
    name: "Zcash",
    managerAppName: "Zcash",
    ticker: "ZEC",
    scheme: "zcash",
    color: "#3790ca",
    family: "bitcoin",
    blockAvgTime: 150,
    bitcoinLikeInfo: {
      P2PKH: 0x1cb8,
      P2SH: 0x1cbd,
      XPUBVersion: 0x0488b21e,
    },
    units: [
      {
        name: "zcash",
        code: "ZEC",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://chain.so/tx/ZEC/$hash",
        address: "https://chain.so/address/ZEC/$address",
      },
    ],
  },
  zclassic: {
    type: "CryptoCurrency",
    id: "zclassic",
    coinType: 147,
    name: "ZClassic",
    managerAppName: "ZClassic",
    ticker: "ZCL",
    scheme: "zclassic",
    color: "#CF6031",
    family: "bitcoin",
    blockAvgTime: 150,
    bitcoinLikeInfo: {
      P2PKH: 0x1cb8,
      P2SH: 0x1cbd,
    },
    units: [
      {
        name: "zclassic",
        code: "ZCL",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://zcl.tokenview.com/en/tx/$hash",
        address: "https://zcl.tokenview.com/en/address/$address",
      },
    ],
  },
  zcoin: {
    type: "CryptoCurrency",
    id: "zcoin",
    coinType: 136,
    name: "ZCoin",
    managerAppName: "Zcoin",
    ticker: "XZC",
    scheme: "zcoin",
    color: "#00C027",
    family: "bitcoin",
    units: [
      {
        name: "XZC",
        code: "XZC",
        magnitude: 8,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.zcoin.io/tx/$hash",
      },
    ],
  },
  zencash: {
    type: "CryptoCurrency",
    id: "zencash",
    coinType: 121,
    name: "Horizen",
    managerAppName: "Horizen",
    ticker: "ZEN",
    scheme: "zencash",
    color: "#152f5c",
    family: "bitcoin",
    blockAvgTime: 150,
    bitcoinLikeInfo: {
      P2PKH: 0x2089,
      P2SH: 0x2096,
      XPUBVersion: 0x0488b21e,
    },
    units: [
      {
        name: "zencash",
        code: "ZEN",
        magnitude: 8,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.zensystem.io/tx/$hash",
        address: "https://explorer.zensystem.io/address/$address",
      },
    ],
  },
  zilliqa: {
    type: "CryptoCurrency",
    id: "zilliqa",
    coinType: 313,
    name: "Zilliqa",
    managerAppName: "Zilliqa",
    ticker: "ZIL",
    scheme: "zilliqa",
    color: "#000",
    family: "zilliqa",
    units: [
      {
        name: "ZIL",
        code: "ZIL",
        magnitude: 12,
      },
    ],
    explorerViews: [],
  },
  crypto_org: {
    type: "CryptoCurrency",
    id: "crypto_org",
    coinType: 394,
    name: "Crypto.org Coin",
    managerAppName: "Crypto.org Chain",
    ticker: "CRO",
    scheme: "crypto_org",
    color: "#0e1c37",
    family: "crypto_org",
    units: [
      {
        name: "CRO",
        code: "cro",
        magnitude: 8,
      },
      {
        name: "baseCRO",
        code: "basecro",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        tx: "https://crypto.org/explorer/tx/$hash",
        address: "https://crypto.org/explorer/account/$address",
      },
    ],
  },
  // Testnets
  bitcoin_testnet: {
    type: "CryptoCurrency",
    id: "bitcoin_testnet",
    coinType: 1,
    name: "Bitcoin Testnet",
    managerAppName: "Bitcoin Test",
    ticker: "BTC",
    scheme: "testnet",
    color: "#00ff00",
    symbol: "Ƀ",
    units: bitcoinUnits.map(makeTestnetUnit),
    deviceTicker: "TEST",
    supportsSegwit: true,
    supportsNativeSegwit: true,
    isTestnetFor: "bitcoin",
    disableCountervalue: true,
    family: "bitcoin",
    blockAvgTime: 15 * 60,
    bitcoinLikeInfo: {
      P2PKH: 111,
      P2SH: 196,
      XPUBVersion: 0x043587cf,
    },
    explorerViews: [
      {
        tx: "https://live.blockcypher.com/btc-testnet/tx/$hash",
        address: "https://live.blockcypher.com/btc-testnet/address/$address",
      },
    ],
  },
  ethereum_ropsten: {
    type: "CryptoCurrency",
    id: "ethereum_ropsten",
    coinType: 60,
    name: "Ethereum Ropsten",
    managerAppName: "Ethereum",
    ticker: "ETH",
    deviceTicker: "ETH",
    scheme: "ethereum_ropsten",
    color: "#00ff00",
    units: ethereumUnits("ether", "ETH").map(makeTestnetUnit),
    isTestnetFor: "ethereum",
    disableCountervalue: true,
    family: "ethereum",
    blockAvgTime: 15,
    ethereumLikeInfo: {
      chainId: 3, // ropsten
    },
    explorerViews: [
      {
        tx: "https://ropsten.etherscan.io/tx/$hash",
        address: "https://ropsten.etherscan.io/address/$address",
      },
    ],
  },
  stacks: {
    type: "CryptoCurrency",
    id: "stacks",
    coinType: 5757,
    name: "stacks",
    managerAppName: "Stacks",
    ticker: "STX",
    scheme: "stacks",
    color: "#000",
    family: "stacks",
    disableCountervalue: true, // currently not available as countervalue and ticker collides with token Stox(STX)
    units: [
      {
        name: "STX",
        code: "STX",
        magnitude: 6,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.stacks.co/txid/$hash",
        address: "https://explorer.stacks.co/address/$address",
      },
    ],
  },
  crypto_org_croeseid: {
    type: "CryptoCurrency",
    id: "crypto_org_croeseid",
    coinType: 394,
    name: "Crypto.org Croeseid Coin",
    managerAppName: "Crypto.org Chain",
    ticker: "CRO",
    scheme: "crypto_org_croeseid",
    color: "#0e1c37",
    family: "crypto_org",
    units: [
      {
        name: "TCRO",
        code: "tcro",
        magnitude: 8,
      },
      {
        name: "baseTCRO",
        code: "basetcro",
        magnitude: 0,
      },
    ],
    isTestnetFor: "crypto_org",
    explorerViews: [
      {
        tx: "https://crypto.org/explorer/croeseid/tx/$hash",
        address: "https://crypto.org/explorer/croeseid/account/$address",
      },
    ],
  },
};

const cryptocurrenciesByScheme: { [_: string]: CryptoCurrency } = {};
const cryptocurrenciesByTicker: { [_: string]: CryptoCurrency } = {};
const cryptocurrenciesArray = [];
const prodCryptoArray = [];
const cryptocurrenciesArrayWithoutTerminated = [];
const prodCryptoArrayWithoutTerminated = [];

for (const id in cryptocurrenciesById) {
  const definition = cryptocurrenciesById[id];
  registerCryptoCurrency(id, definition);
}

/**
 *
 */
export type CryptoCurrencyObjMap<F> = $Exact<
  $ObjMap<typeof cryptocurrenciesById, F>
>;

/**
 *
 */
export type CryptoCurrencyConfig<C> = CryptoCurrencyObjMap<(*) => C>;

/**
 *
 */
export type CryptoCurrencyIds = $Keys<typeof cryptocurrenciesById>;

/**
 *
 * @param {string} id
 * @param {CryptoCurrency} currency
 */
export function registerCryptoCurrency(id: string, currency: CryptoCurrency) {
  cryptocurrenciesById[currency.id] = currency;
  cryptocurrenciesByScheme[currency.scheme] = currency;
  if (!currency.isTestnetFor) {
    cryptocurrenciesByTicker[currency.ticker] = currency;
    prodCryptoArray.push(currency);
    if (!currency.terminated) {
      prodCryptoArrayWithoutTerminated.push(currency);
    }
  }
  cryptocurrenciesArray.push(currency);
  if (!currency.terminated) {
    cryptocurrenciesArrayWithoutTerminated.push(currency);
  }
}

/**
 *
 * @param {*} withDevCrypto
 * @param {*} withTerminated
 */
export function listCryptoCurrencies(
  withDevCrypto: boolean = false,
  withTerminated: boolean = false
): CryptoCurrency[] {
  return withTerminated
    ? withDevCrypto
      ? cryptocurrenciesArray
      : prodCryptoArray
    : withDevCrypto
    ? cryptocurrenciesArrayWithoutTerminated
    : prodCryptoArrayWithoutTerminated;
}

/**
 *
 * @param {*} f
 */
export function findCryptoCurrency(
  f: (CryptoCurrency) => boolean
): ?CryptoCurrency {
  return cryptocurrenciesArray.find(f);
}

/**
 *
 * @param {*} scheme
 */
export function findCryptoCurrencyByScheme(scheme: string): ?CryptoCurrency {
  return cryptocurrenciesByScheme[scheme];
}

/**
 *
 * @param {*} ticker
 */
export function findCryptoCurrencyByTicker(ticker: string): ?CryptoCurrency {
  return cryptocurrenciesByTicker[ticker];
}

/**
 *
 * @param {*} id
 */
export function findCryptoCurrencyById(id: string): ?CryptoCurrency {
  return cryptocurrenciesById[id];
}

/**
 *
 * @param {*} keyword
 */
export const findCryptoCurrencyByKeyword = (
  keyword: string
): ?CryptoCurrency => {
  const r = findCryptoCurrency((c) => {
    const search = keyword.replace(/ /, "").toLowerCase();
    return (
      c.id === search ||
      c.name.replace(/ /, "").toLowerCase() === search ||
      (c.managerAppName &&
        c.managerAppName.replace(/ /, "").toLowerCase() === search) ||
      c.ticker.toLowerCase() === search
    );
  });
  return r;
};

/**
 *
 * @param {*} id
 */
export const hasCryptoCurrencyId = (id: string): boolean =>
  id in cryptocurrenciesById;

/**
 *
 * @param {*} id
 */
export function getCryptoCurrencyById(id: string): CryptoCurrency {
  const currency = findCryptoCurrencyById(id);
  if (!currency) {
    throw new Error(`currency with id "${id}" not found`);
  }
  return currency;
}
