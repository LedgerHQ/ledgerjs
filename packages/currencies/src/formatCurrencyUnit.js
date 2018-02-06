//@flow
import type { Unit } from "./types";

const nonBreakableSpace = " ";
const defaultFormatOptions = {
  showCode: false,
  alwaysShowSign: false,
  // override showAllDigits of the unit
  showAllDigits: false
};

type FormatFragment =
  | { kind: "value", value: string }
  | { kind: "sign", value: string }
  | { kind: "code", value: string };

export function formatCurrencyUnitFragment(
  unit: Unit,
  value: number,
  options?: $Shape<typeof defaultFormatOptions>
): FormatFragment[] {
  const { showCode, alwaysShowSign, showAllDigits } = {
    ...defaultFormatOptions,
    ...unit,
    ...options
  };
  const { magnitude, code } = unit;
  const floatValue = value / 10 ** magnitude;
  const minimumFractionDigits = showAllDigits ? magnitude : 0;
  const maximumFractionDigits = Math.max(
    minimumFractionDigits,
    Math.max(
      0,
      // dynamic max number of digits based on the value itself. to only show significant part
      Math.min(4 - Math.round(Math.log10(Math.abs(floatValue))), magnitude)
    )
  );

  const frags = [];
  if (alwaysShowSign && floatValue > 0) {
    frags.push({ kind: "sign", value: "+" });
  }
  if (showCode) {
    frags.push({ kind: "code", value: code });
  }
  // TODO in case of negative value, we don't have it fragmented in a "sign"
  frags.push({
    kind: "value",
    value: floatValue.toLocaleString("en-EN", {
      maximumFractionDigits,
      minimumFractionDigits
    })
  });
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
    .join(nonBreakableSpace);
}
