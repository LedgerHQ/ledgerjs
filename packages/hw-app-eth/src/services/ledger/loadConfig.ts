import type { LoadConfig } from "../types";

export const defaultLoadConfig: LoadConfig = {
  strictMode: false,
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
