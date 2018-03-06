//@flow
import type { Unit } from "./types";
import numeral from "numeral";

export const parseCurrencyUnit = (unit: Unit, valueString: string): number =>
  Math.round(numeral(valueString).value() * 10 ** unit.magnitude);
