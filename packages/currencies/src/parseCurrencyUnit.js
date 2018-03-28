//@flow
import type { Unit } from "./types";
import memoize from "lodash/memoize";

const defaultFormatOptions = {
  locale: "en-EN"
};

// returns decimal and thousands separator
export const getSeparators = memoize((locale: string): {
  decimal: ?string,
  thousands: ?string
} => {
  const res = (10000.2).toLocaleString(locale);
  let decimal, thousands;
  for (let i = 0; i < res.length; i++) {
    const c = res[i];
    if (/[0-9]/.test(c)) continue;
    if (!thousands) {
      thousands = c;
    } else {
      decimal = c;
    }
  }
  return { decimal, thousands };
});

export const parseCurrencyUnit = (
  unit: Unit,
  valueString: string,
  options?: $Shape<typeof defaultFormatOptions>
): number => {
  const { locale } = {
    ...defaultFormatOptions,
    ...options
  };
  const sep = getSeparators(locale);
  let str = "";
  for (let i = 0; i < valueString.length; i++) {
    let c = valueString[i];
    if (c !== sep.thousands) {
      str += c === sep.decimal ? "." : c;
    }
  }
  const value = parseFloat(str);
  if (isNaN(value)) return 0;
  return Math.round(value * 10 ** unit.magnitude);
};
