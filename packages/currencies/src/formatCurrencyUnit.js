//@flow
import type { Unit } from "./types";
import memoize from "lodash/memoize";

const nonBreakableSpace = " ";
const defaultFormatOptions = {
  locale: "en-EN",
  showCode: false,
  alwaysShowSign: false,
  // override showAllDigits of the unit
  showAllDigits: false,
  disableRounding: false
};

type FormatFragment =
  | { kind: "value", value: string }
  | { kind: "sign", value: string }
  | { kind: "code", value: string }
  | { kind: "separator", value: string };

const getFragPositions = memoize((locale: string): Array<*> => {
  const res = (-1).toLocaleString(locale, {
    currency: "USD",
    style: "currency"
  });
  const frags = [];
  let mandatoryFrags = 0;
  for (let i = 0; i < res.length; i++) {
    const c = res[i];
    if (c === "$") {
      // force code to be surround by separators. we'll dedup later
      frags.push("separator");
      frags.push("code");
      frags.push("separator");
      mandatoryFrags++;
    } else if (c === "-") {
      frags.push("sign");
      mandatoryFrags++;
    } else if (c === "1") {
      frags.push("value");
      mandatoryFrags++;
    } else if (/\s/.test(c)) {
      frags.push("separator");
    }
    if (mandatoryFrags === 3) return frags;
  }
  return frags;
});

export function formatCurrencyUnitFragment(
  unit: Unit,
  value: number,
  options?: $Shape<typeof defaultFormatOptions>
): FormatFragment[] {
  const { showCode, alwaysShowSign, showAllDigits, locale, disableRounding } = {
    ...defaultFormatOptions,
    ...unit,
    ...options
  };
  const { magnitude, code } = unit;
  const floatValue = value / 10 ** magnitude;
  const floatValueAbs = Math.abs(floatValue);
  const minimumFractionDigits = showAllDigits ? magnitude : 0;
  const maximumFractionDigits = disableRounding
    ? magnitude
    : Math.max(
        minimumFractionDigits,
        Math.max(
          0,
          // dynamic max number of digits based on the value itself. to only show significant part
          Math.min(4 - Math.round(Math.log10(floatValueAbs)), magnitude)
        )
      );

  const fragValueByKind = {
    sign:
      alwaysShowSign || floatValue < 0 ? (floatValue < 0 ? "-" : "+") : null,
    code: showCode ? code : null,
    value: floatValueAbs.toLocaleString(locale, {
      maximumFractionDigits,
      minimumFractionDigits
    }),
    separator: nonBreakableSpace
  };

  const frags = [];
  let nonSepIndex = -1,
    sepConsumed = true;
  getFragPositions(locale).forEach(kind => {
    const value = fragValueByKind[kind];
    if (!value) return;
    const isSep = kind === "separator";
    if (sepConsumed && isSep) return;
    sepConsumed = isSep;
    if (!isSep) nonSepIndex = frags.length;
    // $FlowFixMe
    frags.push({ kind, value });
  });
  frags.splice(nonSepIndex + 1); // remove extra space at the end
  return frags;
}

// simplification of formatCurrencyUnitFragment if no fragmented styles is needed
export function formatCurrencyUnit(
  unit: Unit,
  value: number,
  options?: $Shape<typeof defaultFormatOptions>
): string {
  return formatCurrencyUnitFragment(unit, value, options)
    .map(f => f.value)
    .join("");
}
