import Transport from "@ledgerhq/hw-transport";
import AppEth from "@ledgerhq/hw-app-eth";
import { TransportError } from "@ledgerhq/errors";
import stripHexPrefix from "strip-hex-prefix";
import { FakeTxData, Transaction as EthereumTx } from "ethereumjs-tx";
import {
  JsonRpcRequest,
  PendingJsonRpcResponse,
  JsonRpcMiddleware,
  createAsyncMiddleware,
} from "json-rpc-engine";

export interface LedgerMiddleware
  extends JsonRpcMiddleware<unknown, string | string[]> {
  close: () => void;
}

export interface MiddlewareOptions {
  // refer to https://github.com/ethereum/EIPs/blob/master/EIPS/eip-155.md
  networkId?: number;
  // derivation path schemes (with a x in the path)
  paths?: string[];
  // should use actively validate on the device
  askConfirm?: boolean;
  // number of accounts to derivate
  accountsLength?: number;
  // offset index to use to start derivating the accounts
  accountsOffset?: number;
}

const methods = ["eth_accounts", "eth_sign", "eth_signTransaction"];
const defaultOptions = {
  networkId: 1, // mainnet
  paths: ["44'/60'/x'/0/0", "44'/60'/0'/x"], // ledger live derivation path
  askConfirm: false,
  accountsLength: 1,
  accountsOffset: 0,
};

/**
 * Create a JSON RPC middleware for Ledger devices.
 * @param getTransport gets lazily called the first time the device is needed. It is a function that returns a Transport instance. You can typically give `()=>TransportUSB.create()`
 * @example
import Web3 from "web3";
import { JsonRpcEngine } from "json-rpc-engine";
import { providerFromEngine } from "eth-json-rpc-middleware";
import createInfuraMiddleware from "eth-json-rpc-infura";
import createLedgerMiddleware from "@ledgerhq/json-rpc";
import TransportUSB from "@ledgerhq/hw-transport-webusb";
const getTransport = () => TransportUSB.create();
const engine = new JsonRpcEngine();
const ledger = createLedgerMiddleware(getTransport, {
  accountsLength: 5
});
const infura = createInfuraMiddleware({
  network: 'mainnet',
  projectId: 'example',
})

engine.push(ledger);
engine.push(infura);
const web3 = new Web3(providerFromEngine(engine));
 */
export default function createLedgerMiddleware(
  getTransport: () => Promise<Transport>,
  options?: MiddlewareOptions
): LedgerMiddleware {
  const { networkId, paths, askConfirm, accountsLength, accountsOffset } = {
    ...defaultOptions,
    ...options,
  };

  const addressToPathMap: Record<string, string> = {};
  let transport: Transport;

  async function getAccounts(res: PendingJsonRpcResponse<string | string[]>) {
    if (!transport) {
      transport = await getTransport();
    }

    const eth = new AppEth(transport);
    const addresses: string[] = [];
    for (let i = accountsOffset; i < accountsOffset + accountsLength; i++) {
      const x = Math.floor(i / paths.length);
      const pathIndex = i - paths.length * x;
      const path = paths[pathIndex].replace("x", String(x));
      const address = await eth.getAddress(path, askConfirm, false);
      addressToPathMap[address.address.toLowerCase()] = path;
      addresses.push(address.address);
    }

    res.result = addresses;
  }

  async function sign(
    req: JsonRpcRequest<string[]>,
    res: PendingJsonRpcResponse<string | string[]>
  ) {
    const [from, data] = req.params || [];
    const path = addressToPathMap[from.toLowerCase()];
    if (!path) throw new Error("address unknown '" + from + "'");
    if (!transport) {
      transport = await getTransport();
    }

    const eth = new AppEth(transport);
    const result = await eth.signPersonalMessage(path, stripHexPrefix(data));
    const v = result.v - 27;
    let vHex = v.toString(16);
    if (vHex.length < 2) {
      vHex = `0${v}`;
    }
    res.result = `0x${result.r}${result.s}${vHex}`;
  }

  async function signTransaction(
    req: JsonRpcRequest<FakeTxData[]>,
    res: PendingJsonRpcResponse<string | string[]>
  ) {
    const [txData] = req.params || [];
    if (!txData || !txData.from) {
      throw new Error("Invalid txData");
    }

    if (typeof txData.from !== "string") {
      throw new Error("Unsupported from type");
    }

    const path = addressToPathMap[txData.from.toLowerCase()];
    if (!path) throw new Error("address unknown '" + txData.from + "'");
    if (!transport) {
      transport = await getTransport();
    }

    const eth = new AppEth(transport);
    const tx = new EthereumTx(txData, { chain: networkId });

    // Set the EIP155 bits
    tx.raw[6] = Buffer.from([networkId]); // v
    tx.raw[7] = Buffer.from([]); // r
    tx.raw[8] = Buffer.from([]); // s

    // Pass hex-rlp to ledger for signing
    const result = await eth.signTransaction(
      path,
      tx.serialize().toString("hex")
    );

    // Store signature in transaction
    tx.v = Buffer.from(result.v, "hex");
    tx.r = Buffer.from(result.r, "hex");
    tx.s = Buffer.from(result.s, "hex");

    // EIP155: v should be chain_id * 2 + {35, 36}
    const signedChainId = Math.floor((tx.v[0] - 35) / 2);
    const validChainId = networkId & 0xff; // FIXME this is to fixed a current workaround that app don't support > 0xff
    if (signedChainId !== validChainId) {
      throw new TransportError(
        "Invalid networkId signature returned. Expected: " +
          networkId +
          ", Got: " +
          signedChainId,
        "InvalidNetworkId"
      );
    }

    res.result = `0x${tx.serialize().toString("hex")}`;
  }

  const middleware = createAsyncMiddleware<unknown, string | string[]>(
    async (req, res, next) => {
      if (!methods.includes(req.method)) {
        return next();
      }

      switch (req.method) {
        case "eth_accounts":
          return getAccounts(res);
        case "eth_sign":
          return sign(req as JsonRpcRequest<string[]>, res);
        case "eth_signTransaction":
          return signTransaction(req as JsonRpcRequest<FakeTxData[]>, res);
      }
    }
  );

  Object.defineProperty(middleware, "close", {
    value() {
      if (transport) {
        transport.close();
      }
    },
  });

  return middleware as LedgerMiddleware;
}
