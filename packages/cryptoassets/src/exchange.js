//@flow

import coins from "../data/exchange/erc20";
import erc20 from "../data/exchange/coins";

const all = [...coins, ...erc20];

const configs = {};
for (const [id, config, signature] of all) {
  configs[id] = { config, signature };
}

/**
 *
 */
export const findExchangeCurrencyConfig = (
  id: string
): ?{ config: string, signature: string } => configs[id];
