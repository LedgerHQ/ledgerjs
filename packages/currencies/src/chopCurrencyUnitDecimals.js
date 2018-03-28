//@flow
import type { Unit } from "./types";
import { getSeparators } from "./parseCurrencyUnit";

const defaultFormatOptions = {
  locale: "en-EN"
};

// remove the extra decimals that can't be represented in unit
// this function will preserve the string characters
// for instance EUR 1,230.00234 will be transformed to EUR 1,230.00
export const chopCurrencyUnitDecimals = (
  unit: Unit,
  valueString: string,
  options?: $Shape<typeof defaultFormatOptions>
): string => {
  const { locale } = {
    ...defaultFormatOptions,
    ...options
  };
  const sep = getSeparators(locale);
  let str = "",
    decimals = -1;
  for (let i = 0; i < valueString.length; i++) {
    let c = valueString[i];
    if (decimals >= 0 && /[0-9]/.test(c)) {
      decimals++;
      if (decimals > unit.magnitude) {
        continue;
      }
    } else if (c === sep.decimal) {
      decimals = 0;
    }
    str += c;
  }
  return str;
};
