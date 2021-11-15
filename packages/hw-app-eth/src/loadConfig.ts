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

const defaultLoadConfig = {
  nftExplorerBaseURL: null, // set a value when an official production endpoint is released
  pluginBaseURL: "https://cdn.live.ledger.com",
  extraPlugins: null,
};

export function getLoadConfig(userLoadConfig?: LoadConfig): LoadConfig {
  return {
    ...defaultLoadConfig,
    ...userLoadConfig,
  };
}
