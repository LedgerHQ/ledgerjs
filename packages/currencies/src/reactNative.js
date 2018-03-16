// @flow
import * as icons from "./data/icons/reactNative";
import coinTypeToIconName from "./coinTypeToIconName";

type Icon = React$ComponentType<{ size: number, color: string }>;

export function getIconByCoinType(coinType: number): ?Icon {
  return icons[coinTypeToIconName[coinType]];
}
