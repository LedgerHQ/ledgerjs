//@flow

import { sign, isSupported } from "u2f-api";
import Transport from "@ledgerhq/hw-transport";
import { log } from "@ledgerhq/logs";
import { TransportError } from "@ledgerhq/errors";

function wrapU2FTransportError(originalError, message, id) {
  const err = new TransportError(message, id);
  // $FlowFixMe
  err.originalError = originalError;
  return err;
}

function wrapApdu(apdu: Buffer, key: Buffer) {
  const result = Buffer.alloc(apdu.length);
  for (let i = 0; i < apdu.length; i++) {
    result[i] = apdu[i] ^ key[i % key.length];
  }
  return result;
}

// Convert from normal to web-safe, strip trailing "="s
const webSafe64 = (base64: string) =>
  base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

// Convert from web-safe to normal, add trailing "="s
const normal64 = (base64: string) =>
  base64.replace(/-/g, "+").replace(/_/g, "/") +
  "==".substring(0, (3 * base64.length) % 4);

function attemptExchange(
  apdu: Buffer,
  timeoutMillis: number,
  scrambleKey: Buffer,
  unwrap: boolean
): Promise<Buffer> {
  const keyHandle = wrapApdu(apdu, scrambleKey);
  const challenge = Buffer.from(
    "0000000000000000000000000000000000000000000000000000000000000000",
    "hex"
  );
  const signRequest = {
    version: "U2F_V2",
    keyHandle: webSafe64(keyHandle.toString("base64")),
    challenge: webSafe64(challenge.toString("base64")),
    appId: location.origin,
  };
  log("apdu", "=> " + apdu.toString("hex"));
  return sign(signRequest, timeoutMillis / 1000).then((response) => {
    const { signatureData } = response;
    if (typeof signatureData === "string") {
      const data = Buffer.from(normal64(signatureData), "base64");
      let result;
      if (!unwrap) {
        result = data;
      } else {
        result = data.slice(5);
      }
      log("apdu", "<= " + result.toString("hex"));
      return result;
    } else {
      throw response;
    }
  });
}

let transportInstances = [];

function emitDisconnect() {
  transportInstances.forEach((t) => t.emit("disconnect"));
  transportInstances = [];
}

function isTimeoutU2FError(u2fError) {
  return u2fError.metaData.code === 5;
}

/**
 * U2F web Transport implementation
 * @example
 * import TransportU2F from "@ledgerhq/hw-transport-u2f";
 * ...
 * TransportU2F.create().then(transport => ...)
 */
export default class TransportU2F extends Transport<null> {
  static isSupported = isSupported;

  /*
   */
  static list = (): * =>
    // this transport is not discoverable but we are going to guess if it is here with isSupported()
    isSupported().then((supported) => (supported ? [null] : []));

  /*
   */
  static listen = (observer: *) => {
    let unsubscribed = false;
    isSupported().then((supported) => {
      if (unsubscribed) return;
      if (supported) {
        observer.next({ type: "add", descriptor: null });
        observer.complete();
      } else {
        observer.error(
          new TransportError(
            "U2F browser support is needed for Ledger. " +
              "Please use Chrome, Opera or Firefox with a U2F extension. " +
              "Also make sure you're on an HTTPS connection",
            "U2FNotSupported"
          )
        );
      }
    });
    return {
      unsubscribe: () => {
        unsubscribed = true;
      },
    };
  };

  scrambleKey: Buffer;

  unwrap: boolean = true;

  /**
   * static function to create a new Transport from a connected Ledger device discoverable via U2F (browser support)
   */
  static async open(_: *, _openTimeout?: number = 5000): Promise<TransportU2F> {
    return new TransportU2F();
  }

  constructor() {
    super();
    transportInstances.push(this);
  }

  /**
   * Exchange with the device using APDU protocol.
   * @param apdu
   * @returns a promise of apdu response
   */
  async exchange(apdu: Buffer): Promise<Buffer> {
    try {
      return await attemptExchange(
        apdu,
        this.exchangeTimeout,
        this.scrambleKey,
        this.unwrap
      );
    } catch (e) {
      const isU2FError = typeof e.metaData === "object";
      if (isU2FError) {
        if (isTimeoutU2FError(e)) {
          emitDisconnect();
        }
        // the wrapping make error more usable and "printable" to the end user.
        throw wrapU2FTransportError(
          e,
          "Failed to sign with Ledger device: U2F " + e.metaData.type,
          "U2F_" + e.metaData.code
        );
      } else {
        throw e;
      }
    }
  }

  /**
   */
  setScrambleKey(scrambleKey: string) {
    this.scrambleKey = Buffer.from(scrambleKey, "ascii");
  }

  /**
   */
  setUnwrap(unwrap: boolean) {
    this.unwrap = unwrap;
  }

  close(): Promise<void> {
    // u2f have no way to clean things up
    return Promise.resolve();
  }
}
