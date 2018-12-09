//@flow
import Transport, { TransportError } from "@ledgerhq/hw-transport";
import axios from "axios";

/**
 * HTTP transport implementation
 */
export default class HttpTransport extends Transport<string> {
  static isSupported = (): Promise<boolean> =>
    Promise.resolve(typeof fetch === "function");

  // this transport is not discoverable
  static list = (): * => Promise.resolve([]);
  static listen = (_observer: *) => ({
    unsubscribe: () => {}
  });

  static check = async (url: string, timeout: number = 5000) => {
    const response = await axios({ url, timeout });
    if (response.status !== 200) {
      throw new TransportError(
        "failed to access HttpTransport(" +
          url +
          "): status " +
          response.status,
        "HttpTransportNotAccessible"
      );
    }
  };

  static async open(url: string, timeout?: number) {
    await HttpTransport.check(url, timeout);
    return new HttpTransport(url);
  }

  url: string;

  constructor(url: string) {
    super();
    this.url = url;
  }

  async exchange(apdu: Buffer): Promise<Buffer> {
    const response = await axios({
      method: "POST",
      url: this.url,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      data: JSON.stringify({ apduHex: apdu.toString("hex") })
    });
    if (response.status !== 200) {
      throw new TransportError(
        "failed to communicate to server. code=" + response.status,
        "HttpTransportStatus" + response.status
      );
    }
    const body = await response.data;
    if (body.error) throw body.error;
    return Buffer.from(body.data, "hex");
  }

  setScrambleKey() {}

  close(): Promise<void> {
    return Promise.resolve();
  }
}
