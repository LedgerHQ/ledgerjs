import Web3 from "web3";
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import createLedgerSubprovider from "@ledgerhq/web3-subprovider";
import ProviderEngine from "web3-provider-engine";
import FetchSubprovider from "web3-provider-engine/subproviders/fetch";

// we are branching the configuration based on development mode.
const DEV = process.env.NODE_ENV === "development";
const rpcUrl = DEV ? "http://127.0.0.1:8545" : "https://mainnet.infura.io";
const networkId = DEV ? 1337 : 1;

export const getReadOnlyWeb3 = async () => {
  const engine = new ProviderEngine();
  engine.addProvider(new FetchSubprovider({ rpcUrl }));
  engine.start();
  return new Web3(engine);
};

// we define all wallets exposing a way to get a web3 instance. feel free to adapt.
export default [
  {
    name: "Ledger device",
    // create a web3 with the ledger device
    getWeb3: async () => {
      const engine = new ProviderEngine();
      const getTransport = () => TransportU2F.create();
      const ledger = await createLedgerSubprovider(getTransport, {
        networkId,
        accountsLength: 5
      });
      engine.addProvider(ledger);
      engine.addProvider(new FetchSubprovider({ rpcUrl }));
      engine.start();
      return new Web3(engine);
    }
  },
  {
    name: "web3 runtime (MetaMask / Mist)",
    // detect extension like Mist/MetaMask
    getWeb3: async () => {
      const web3 = window.web3;
      if (!web3) throw new Error("no web3 instance found in runtime");
      return new Web3(web3.currentProvider);
    }
  }
];
