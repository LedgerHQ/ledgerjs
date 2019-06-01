// @flow
// import { DisconnectedDevice } from "@ledgerhq/errors";

export const remapError = (error: ?Error) => {
  if (!error || !error.message) return error;
  console.error("TO REMAP!", error);
  // TODO
  /*
  if (
    error.message.includes("was disconnected") ||
    error.message.includes("not found")
  ) {
    return new DisconnectedDevice();
  }
  */
  return error;
};

export const rethrowError = (e: ?Error) => {
  throw remapError(e);
};
