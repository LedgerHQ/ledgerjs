// @flow
import * as icons from "./data/icons/react";
import coinTypeToIconName from "./coinTypeToIconName";

type Icon = React$ComponentType<{ size: number, color: string }>;

export function getIconByCoinType(coinType: number): ?Icon {
  return icons[coinTypeToIconName[coinType]];
}
