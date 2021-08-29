import {
  JsonRpcEngine,
  JsonRpcMiddleware,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from "json-rpc-engine";
import SafeEventEmitter from "@metamask/safe-event-emitter";
import Transport from "@ledgerhq/hw-transport";
import createLedgerMiddleware, { MiddlewareOptions } from ".";

type BlockData = string | string[];
type Block = Record<string, BlockData>;
type SendCallBack = (err: unknown, providerRes: unknown) => void;
type SendAsyncCallBack = (
  err: Error,
  providerRes: PendingJsonRpcResponse<Block>
) => void;

interface Provider extends SafeEventEmitter {
  sendAsync: (
    req: JsonRpcRequest<string[]>,
    callback: SendAsyncCallBack
  ) => void;
  send: (req: JsonRpcRequest<string[]>, callback: SendCallBack) => void;
  disconnect(): void;
}

/**
 * Create a JSON RPC provider for Ledger devices.
 * @param getTransport gets lazily called the first time the device is needed. It is a function that returns a Transport instance. You can typically give `()=>TransportUSB.create()`
 * @example
import Web3 from "web3";
import createInfuraMiddleware from "eth-json-rpc-infura";
import createLedgerProvider from "@ledgerhq/json-rpc/lib/createProvider";
import TransportUSB from "@ledgerhq/hw-transport-webusb";
const getTransport = () => TransportUSB.create();
const infura = createInfuraMiddleware({
  network: 'mainnet',
  projectId: 'example',
})
const provider = createLedgerMiddleware(getTransport, infura, {
  accountsLength: 5
});

const web3 = new Web3(provider);
 */
export default function createProvider(
  getTransport: () => Promise<Transport>,
  middleware:
    | JsonRpcMiddleware<unknown, unknown>
    | JsonRpcMiddleware<unknown, unknown>[],
  options?: MiddlewareOptions
): Provider {
  const engine = new JsonRpcEngine();
  const ledger = createLedgerMiddleware(getTransport, options);
  engine.push(ledger);
  if (Array.isArray(middleware)) {
    middleware.forEach(engine.push);
  } else {
    engine.push(middleware);
  }
  return providerFromEngine(engine, ledger.close);
}

function providerFromEngine(
  engine: JsonRpcEngine,
  disconnect: () => void
): Provider {
  const provider = new SafeEventEmitter() as Provider;
  provider.disconnect = disconnect;
  // handle both rpc send methods
  provider.sendAsync = engine.handle.bind(engine);
  provider.send = (
    req: JsonRpcRequest<string[]>,
    callback: (error: unknown, providerRes: unknown) => void
  ) => {
    if (typeof callback !== "function") {
      // eslint-disable-next-line quotes
      throw new Error('Must provide callback to "send" method.');
    }
    engine.handle(req, callback);
  };
  // forward notifications
  if (engine.on) {
    engine.on("notification", (message: string) => {
      provider.emit("data", null, message);
    });
  }
  return provider;
}
