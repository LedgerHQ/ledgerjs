//@flow
import Transport from "@ledgerhq/hw-transport";

/**
 * HTTP transport implementation
 */
export default class HttpTransport extends Transport<string> {
  // this transport is not discoverable
  static list = (): * => Promise.resolve([]);
  static discover = () => ({ unsubscribe: () => {} });

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

  async exchange(apduHex: string, statusList: Array<number>): Promise<string> {
    const response = await fetch(this.url, {
      method: "POST",
      body: JSON.stringify({ apduHex, statusList })
    });
    if (response.status !== 200) {
      throw "failed to communicate to server. code=" + response.status;
    }
    const body = await response.json();
    if (body.error) throw body.error;
    return body.data;
  }

  setScrambleKey() {}

  close(): Promise<void> {
    return Promise.resolve();
  }
}
