export type LedgerEthTransactionResolution = {
  // device serialized data that contains ERC20 data (hex format)
  erc20Tokens: Array<string>;
  // device serialized data that contains NFT data (hex format)
  nfts: Array<string>;
  // device serialized data that contains external plugin data (hex format)
  externalPlugin: Array<{ payload: string; signature: string }>;
  // device serialized data that contains plugin data (hex format)
  plugin: Array<string>;
};

export type LoadConfig = {
  nftExplorerBaseURL?: string | null;
  // example of payload https://cdn.live.ledger.com/plugins/ethereum/1.json
  // fetch against an api (base url is an api that hosts /plugins/ethereum/${chainId}.json )
  // set to null will disable it
  pluginBaseURL?: string | null;
  // provide manually some extra plugins to add for the resolution (e.g. for dev purpose)
  // object will be merged with the returned value of the Ledger cdn payload
  extraPlugins?: any | null;
};

export type Resolution = {
  nft: boolean,
  plugin: boolean,
  erc20: boolean,
};

export type LedgerEthTransactionService = {
  resolveTransaction: (
    rawTxHex: string,
    loadConfig: LoadConfig,
    resolution: Resolution,
  ) => Promise<LedgerEthTransactionResolution>;
};
