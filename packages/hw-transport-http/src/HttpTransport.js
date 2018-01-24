//@flow
import Transport, { TransportError } from "@ledgerhq/hw-transport";
import withStaticURL from "./withStaticURL";
export { withStaticURL };

/**
 * HTTP transport implementation
 */
// NOTE in the future we might want to do WebSocket, because we could have the disconnect lifecycle hooked.
export default class HttpTransport extends Transport<string> {
  // this transport is not discoverable
  static list = (): * => Promise.resolve([]);
  static listen = (_observer: *) => ({
    unsubscribe: () => {}
  });

  static async open(url: string, timeout?: number) {
    const response = await fetch(url, { timeout });
    if (response.status !== 200) {
      throw new TransportError(
        "failed to access HttpTransport(" +
          url +
          "): status " +
          response.status,
        "HttpTransportNotAccessible"
      );
    }
    return new HttpTransport(url);
  }

  url: string;

  /**
   * The full url of an http server.
   * * a GET is expected to return a 200 status on this url.
   * * a POST is expected to accept { apduHex, statusList } object in body and
       returns { data, error } where either data is filled with an hex result
       or error is filled with a text error.
   * @example
   * new HttpTransport("http://192.168.0.1/")
   */
  constructor(url: string) {
    super();
    this.url = url;
  }

  async exchange(apdu: Buffer): Promise<Buffer> {
    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ apduHex: apdu.toString("hex") })
    });
    if (response.status !== 200) {
      throw new TransportError(
        "failed to communicate to server. code=" + response.status,
        "HttpTransportStatus" + response.status
      );
    }
    const body = await response.json();
    if (body.error) throw body.error;
    return Buffer.from(body.data, "hex");
  }

  setScrambleKey() {}

  close(): Promise<void> {
    return Promise.resolve();
  }
}
