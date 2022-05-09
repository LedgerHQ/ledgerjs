import Transport from "@ledgerhq/hw-transport";

export const CLA = 0xff;
export const CHUNK_SIZE = 250;
export const APP_KEY = "ETH";

export const HASH_MAX_LENGTH = 63;

export const INS = {
  GET_VERSION: 0x00,
  GET_ADDR: 0x01,
  SIGN: 0x02,
  SIGN_FELT: 0x20,
};

export const PAYLOAD_TYPE = {
  INIT: 0x00,
  ADD: 0x01,
  LAST: 0x02,
};

export const P1_VALUES = {
  ONLY_RETRIEVE: 0x00,
  SHOW_ADDRESS_IN_DEVICE: 0x01,
};

export enum LedgerError {
  U2FUnknown = 1,
  U2FBadRequest = 2,
  U2FConfigurationUnsupported = 3,
  U2FDeviceIneligible = 4,
  U2FTimeout = 5,
  Timeout = 14,
  NoErrors = 0x9000,
  DeviceIsBusy = 0x9001,
  ErrorDerivingKeys = 0x6802,
  ExecutionError = 0x6400,
  WrongLength = 0x6700,
  EmptyBuffer = 0x6982,
  OutputBufferTooSmall = 0x6983,
  DataIsInvalid = 0x6984,
  ConditionsNotSatisfied = 0x6985,
  TransactionRejected = 0x6986,
  BadKeyHandle = 0x6a80,
  InvalidP1P2 = 0x6b00,
  InstructionNotSupported = 0x6d00,
  AppDoesNotSeemToBeOpen = 0x6e00,
  UnknownError = 0x6f00,
  SignVerifyError = 0x6f01,
}

export const ERROR_DESCRIPTION = {
  [LedgerError.U2FUnknown]: "U2F: Unknown",
  [LedgerError.U2FBadRequest]: "U2F: Bad request",
  [LedgerError.U2FConfigurationUnsupported]: "U2F: Configuration unsupported",
  [LedgerError.U2FDeviceIneligible]: "U2F: Device Ineligible",
  [LedgerError.U2FTimeout]: "U2F: Timeout",
  [LedgerError.Timeout]: "Timeout",
  [LedgerError.NoErrors]: "No errors",
  [LedgerError.DeviceIsBusy]: "Device is busy",
  [LedgerError.ErrorDerivingKeys]: "Error deriving keys",
  [LedgerError.ExecutionError]: "Execution Error",
  [LedgerError.WrongLength]: "Wrong Length",
  [LedgerError.EmptyBuffer]: "Empty Buffer",
  [LedgerError.OutputBufferTooSmall]: "Output buffer too small",
  [LedgerError.DataIsInvalid]: "Data is invalid",
  [LedgerError.ConditionsNotSatisfied]: "Conditions not satisfied",
  [LedgerError.TransactionRejected]: "Transaction rejected",
  [LedgerError.BadKeyHandle]: "Bad key handle",
  [LedgerError.InvalidP1P2]: "Invalid P1/P2",
  [LedgerError.InstructionNotSupported]: "Instruction not supported",
  [LedgerError.AppDoesNotSeemToBeOpen]: "App does not seem to be open",
  [LedgerError.UnknownError]: "Unknown error",
  [LedgerError.SignVerifyError]: "Sign/verify error",
};

export function errorCodeToString(statusCode: LedgerError) {
  if (statusCode in ERROR_DESCRIPTION) return ERROR_DESCRIPTION[statusCode];
  return `Unknown Status Code: ${statusCode}`;
}

function isDict(v: any) {
  return (
    typeof v === "object" &&
    v !== null &&
    !(v instanceof Array) &&
    !(v instanceof Date)
  );
}

export function processErrorResponse(response?: any) {
  if (response) {
    if (isDict(response)) {
      if (Object.prototype.hasOwnProperty.call(response, "statusCode")) {
        return {
          returnCode: response.statusCode,
          errorMessage: errorCodeToString(response.statusCode),
        };
      }

      if (
        Object.prototype.hasOwnProperty.call(response, "returnCode") &&
        Object.prototype.hasOwnProperty.call(response, "errorMessage")
      ) {
        return response;
      }
    }
    return {
      returnCode: 0xffff,
      errorMessage: response.toString(),
    };
  }

  return {
    returnCode: 0xffff,
    errorMessage: response.toString(),
  };
}

export async function getVersion(transport: Transport) {
  return transport.send(CLA, INS.GET_VERSION, 0, 0).then((response) => {
    const errorCodeData = response.slice(-2);
    const returnCode = (errorCodeData[0] * 256 +
      errorCodeData[1]) as LedgerError;

    let targetId = 0;
    if (response.length >= 9) {
      /* eslint-disable no-bitwise */
      targetId =
        (response[5] << 24) +
        (response[6] << 16) +
        (response[7] << 8) +
        (response[8] << 0);
      /* eslint-enable no-bitwise */
    }

    return {
      returnCode,
      errorMessage: errorCodeToString(returnCode),
      testMode: response[0] !== 0,
      major: response[1],
      minor: response[2],
      patch: response[3],
      deviceLocked: response[4] === 1,
      targetId: targetId.toString(16),
    };
  }, processErrorResponse);
}
