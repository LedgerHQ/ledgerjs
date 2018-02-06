//@flow
import { getFiatUnit } from "./data/fiat";
import type { Rate, UnitValue } from "./types";

// calculate the counter value at a specific rate
export default (rate: Rate, value: number): UnitValue => {
  const unit = getFiatUnit(rate.fiat);
  return {
    value: Math.round(rate.value * value),
    unit
  };
};
