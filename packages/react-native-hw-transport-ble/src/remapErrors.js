// @flow
import { DisconnectedDevice } from "@ledgerhq/errors";

export const remapError = (error: ?Error) => {
  if (!error || !error.message) return error;
  if (error.message.includes("was disconnected")) {
    return new DisconnectedDevice();
  }
  return error;
};

export const rethrowError = (e: ?Error) => {
  throw remapError(e);
};

export const decoratePromiseErrors = <A>(promise: Promise<A>): Promise<A> =>
  promise.catch(rethrowError);
