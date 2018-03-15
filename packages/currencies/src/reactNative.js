// @flow
import * as icons from "./data/icons/reactNative";

const iconsByCoinType = {
  "0": icons.bitcoin,
  "1": icons.bitcoin,
  "2": icons.litecoin,
  "3": icons.dogecoin,
  "5": icons.dash
};

type Icon = React$ComponentType<{ size: number, color: string }>;

export function getIconByCoinType(coinType: number): ?Icon {
  return iconsByCoinType[coinType];
}
