export const CLA = 0xd7;

export const INS_GET_EXT_PUBLIC_KEY = 0x10;
export const INS_DERIVE_ADDRESS = 0x11;
export const INS_ATTEST_UTXO = 0x20;

export const INS_SET_ATTEST_KEY = 0xF3;

export const ERRORS = {
  INVALID_PARAMETERS: "0x6e05",
  INVALID_STATE: "0x6e06",
  INVALID_DATA: "0x6e07",
  REJECTED_BY_POLICY: "0x6e10",

  RE_SELECTED_ERRORS: /Ledger device:.*0x6e0[4-9]/
};
