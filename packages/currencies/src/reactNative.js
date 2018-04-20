// @flow
import * as icons from "./data/icons/reactNative";
import coinTypeToIconName from "./coinTypeToIconName";
import type { Currency } from "./types";

type Icon = React$ComponentType<{ size: number, color: string }>;

export function getIconByCoinType(coinType: number): ?Icon {
  console.warn("DEPRECATED: getIconByCoinType: use getCurrencyIcon instead");
  return icons[coinTypeToIconName[coinType]];
}

export function getCurrencyIcon(currency: Currency): ?Icon {
  return icons[coinTypeToIconName[currency.coinType]];
}
