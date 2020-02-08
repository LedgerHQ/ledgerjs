//@flow
import net from "net";
import Transport from "@ledgerhq/hw-transport";
import {
  DisconnectedDevice,
  DisconnectedDeviceDuringOperation,
  TransportError
} from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";

/**
 *
 */
export type SpeculosTransportOpts = {
  apduPort: number,
  buttonPort?: number,
  host?: string
};

/**
 * Speculos TCP transport implementation
 *
 * @example
 * import SpeculosTransport from "@ledgerhq/hw-transport-node-speculos";
 * const transport = await SpeculosTransport.open({ apduPort });
 * const res = await transport.send(0xE0, 0x01, 0, 0);
 */
export default class SpeculosTransport extends Transport<SpeculosTransportOpts> {
  static isSupported = (): Promise<boolean> => Promise.resolve(true);

  // this transport is not discoverable
  static list = (): * => Promise.resolve([]);
  static listen = (_observer: *) => ({
    unsubscribe: () => {}
  });

  /**
   *
   */
  static open = (opts: SpeculosTransportOpts): Promise<SpeculosTransport> =>
    new Promise((resolve, reject) => {
      const socket = new net.Socket();
      socket.on("error", e => {
        socket.destroy();
        reject(e);
      });
      socket.on("end", () => {
        reject(new DisconnectedDevice("tcp closed"));
      });
      socket.connect(opts.apduPort, opts.host || "127.0.0.1", () => {
        // we delay a bit the transport creation to make sure the tcp does not hang up
        setTimeout(() => {
          resolve(new SpeculosTransport(socket, opts));
        }, 100);
      });
    });

  socket: net.Socket;
  opts: SpeculosTransportOpts;
  rejectExchange: Error => void = _e => {};
  resolveExchange: Buffer => void = _b => {};

  constructor(socket: net.Socket, opts: SpeculosTransportOpts) {
    super();
    this.opts = opts;
    this.socket = socket;
    socket.on("error", e => {
      this.emit("disconnect", new DisconnectedDevice(e.message));
      this.rejectExchange(e);
      this.socket.destroy();
    });
    socket.on("end", () => {
      this.emit("disconnect", new DisconnectedDevice());
      this.rejectExchange(new DisconnectedDeviceDuringOperation());
    });
    socket.on("data", data => {
      try {
        this.resolveExchange(decodeAPDUPayload(data));
      } catch (e) {
        this.rejectExchange(e);
      }
    });
  }

  /**
   * Send a speculos button command
   * typically "Ll" would press and release the left button
   * typically "Rr" would press and release the right button
   * @param {*} command
   */
  button = (command: string): Promise<void> =>
    new Promise((resolve, reject) => {
      const { buttonPort, host } = this.opts;
      if (!buttonPort) throw new Error("buttonPort is missing");
      const socket = new net.Socket();
      socket.on("error", e => {
        socket.destroy();
        reject(e);
      });
      socket.connect(buttonPort, host || "127.0.0.1", () => {
        socket.write(Buffer.from(command, "ascii"));
        socket.destroy();
        resolve();
      });
    });

  async exchange(apdu: Buffer): Promise<Buffer> {
    const hex = apdu.toString("hex");
    log("apdu", "=> " + hex);
    const encoded = encodeAPDU(apdu);
    const res = await new Promise((resolve, reject) => {
      this.rejectExchange = reject;
      this.resolveExchange = resolve;
      this.socket.write(encoded);
    });
    log("apdu", "<= " + res.toString("hex"));
    return res;
  }

  setScrambleKey() {}

  async close() {
    this.socket.destroy();
    return Promise.resolve(true);
  }
}

function encodeAPDU(apdu: Buffer) {
  const size = Buffer.allocUnsafe(4);
  size.writeUIntBE(apdu.length, 0, 4);
  return Buffer.concat([size, apdu]);
}

function decodeAPDUPayload(data: Buffer) {
  const dataLength = data.readUIntBE(0, 4); // 4 bytes tells the data length
  const size = dataLength + 2; // size does not include the status code so we add 2
  const payload = data.slice(4);
  if (payload.length !== size) {
    throw new TransportError(
      `Expected payload of length ${size} but got ${payload.length}`
    );
  }
  return payload;
}
