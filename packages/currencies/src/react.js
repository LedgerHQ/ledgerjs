// @flow

import * as icons from "./data/icons";

const iconsByCoinType = {
  "0": icons.btc,
  "1": icons.btc,
  "2": icons.ltc,
  "3": icons.dogecoin,
  "5": icons.dash
};

type Icon = React$ComponentType<{ size: number }>;

export function getIconByCoinType(coinType: number): ?Icon {
  return iconsByCoinType[coinType];
}
