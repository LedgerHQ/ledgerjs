//@flow
import Transport, { TransportError } from "@ledgerhq/hw-transport";

const WebSocket = global.WebSocket || require("ws");

/**
 * WebSocket transport implementation
 */
export default class WebSocketTransport extends Transport<string> {
  static isSupported = (): Promise<boolean> =>
    Promise.resolve(typeof WebSocket === "function");

  // this transport is not discoverable
  static list = (): * => Promise.resolve([]);
  static listen = (_observer: *) => ({
    unsubscribe: () => {}
  });

  static check = async (url: string, timeout: number = 5000) =>
    new Promise((resolve, reject) => {
      const socket = new WebSocket(url);
      let success = false;
      setTimeout(() => {
        socket.close();
      }, timeout);
      socket.onopen = () => {
        success = true;
        socket.close();
      };
      socket.onclose = () => {
        if (success) resolve();
        else {
          reject(
            new TransportError(
              "failed to access WebSocketTransport(" + url + ")",
              "WebSocketTransportNotAccessible"
            )
          );
        }
      };
      socket.onerror = () => {
        reject(
          new TransportError(
            "failed to access WebSocketTransport(" + url + "): error",
            "WebSocketTransportNotAccessible"
          )
        );
      };
    });

  static async open(url: string) {
    const exchangeMethods = await new Promise((resolve, reject) => {
      try {
        const socket = new WebSocket(url);
        const exchangeMethods = {
          resolveExchange: (_b: Buffer) => {},
          rejectExchange: (_e: TransportError) => {},
          onDisconnect: () => {},
          close: () => socket.close(),
          send: msg => socket.send(msg)
        };
        socket.onopen = () => {
          socket.send("open");
        };
        socket.onerror = e => {
          exchangeMethods.onDisconnect();
          reject(e);
        };
        socket.onclose = () => {
          exchangeMethods.onDisconnect();
          reject(new TransportError("OpenFailed", "OpenFailed"));
        };
        socket.onmessage = e => {
          if (typeof e.data !== "string") return;
          const data = JSON.parse(e.data);
          switch (data.type) {
            case "opened":
              return resolve(exchangeMethods);
            case "error":
              reject(new Error(data.error));
              return exchangeMethods.rejectExchange(
                new TransportError(data.error, "WSError")
              );
            case "response":
              return exchangeMethods.resolveExchange(
                Buffer.from(data.data, "hex")
              );
          }
        };
      } catch (e) {
        reject(e);
      }
    });
    return new WebSocketTransport(exchangeMethods);
  }

  hook: *;

  constructor(hook: *) {
    super();
    this.hook = hook;
    hook.onDisconnect = () => {
      this.emit("disconnect");
      this.hook.rejectExchange(
        new TransportError("WebSocket disconnected", "WSDisconnect")
      );
    };
  }

  exchange(apdu: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.hook.rejectExchange = (e: TransportError) => reject(e);
      this.hook.resolveExchange = (b: Buffer) => resolve(b);
      this.hook.send(apdu.toString("hex"));
    });
  }

  setScrambleKey() {}

  async close() {
    this.hook.close();
    return new Promise(success => {
      setTimeout(success, 200);
    });
  }
}
