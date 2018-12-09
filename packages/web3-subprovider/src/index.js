//@flow
import AppEth from "@ledgerhq/hw-app-eth";
import type Transport from "@ledgerhq/hw-transport";
import HookedWalletSubprovider from "web3-provider-engine/dist/es5/subproviders/hooked-wallet";
import stripHexPrefix from "strip-hex-prefix";
import EthereumTx from "ethereumjs-tx";

const allowedHdPaths = ["44'/1'", "44'/60'", "44'/61'"];

function makeError(msg, id) {
  const err = new Error(msg);
  // $FlowFixMe
  err.id = id;
  return err;
}

function obtainPathComponentsFromDerivationPath(derivationPath) {
  // check if derivation path follows 44'/60'/x'/n pattern
  const regExp = /^(44'\/(?:1|60|61)'\/\d+'?\/)(\d+)$/;
  const matchResult = regExp.exec(derivationPath);
  if (matchResult === null) {
    throw makeError(
      "To get multiple accounts your derivation path must follow pattern 44'/60|61'/x'/n ",
      "InvalidDerivationPath"
    );
  }
  return { basePath: matchResult[1], index: parseInt(matchResult[2], 10) };
}

/**
 */
type SubproviderOptions = {
  // refer to https://github.com/ethereum/EIPs/blob/master/EIPS/eip-155.md
  networkId: number,
  // derivation path
  path?: string,
  // should use actively validate on the device
  askConfirm?: boolean,
  // number of accounts to derivate
  accountsLength?: number,
  // offset index to use to start derivating the accounts
  accountsOffset?: number
};

const defaultOptions = {
  networkId: 1, // mainnet
  path: "44'/60'/0'/0", // ledger default derivation path
  askConfirm: false,
  accountsLength: 1,
  accountsOffset: 0
};

/**
 * Create a HookedWalletSubprovider for Ledger devices.
 * @param getTransport gets lazily called each time the device is needed. It is a function that returns a Transport instance. You can typically give `()=>TransportU2F.create()`
 * @example
import Web3 from "web3";
import createLedgerSubprovider from "@ledgerhq/web3-subprovider";
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import ProviderEngine from "web3-provider-engine";
import RpcSubprovider from "web3-provider-engine/subproviders/rpc";
const engine = new ProviderEngine();
const getTransport = () => TransportU2F.create();
const ledger = createLedgerSubprovider(getTransport, {
  accountsLength: 5
});
engine.addProvider(ledger);
engine.addProvider(new RpcSubprovider({ rpcUrl }));
engine.start();
const web3 = new Web3(engine);
 */
export default function createLedgerSubprovider(
  getTransport: () => Transport<*>,
  options?: SubproviderOptions
): HookedWalletSubprovider {
  const { networkId, path, askConfirm, accountsLength, accountsOffset } = {
    ...defaultOptions,
    ...options
  };
  if (!allowedHdPaths.some(hdPref => path.startsWith(hdPref))) {
    throw makeError(
      "Ledger derivation path allowed are " +
        allowedHdPaths.join(", ") +
        ". " +
        path +
        " is not supported",
      "InvalidDerivationPath"
    );
  }

  const pathComponents = obtainPathComponentsFromDerivationPath(path);

  const addressToPathMap = {};

  async function getAccounts() {
    const transport = await getTransport();
    try {
      const eth = new AppEth(transport);
      const addresses = {};
      for (let i = accountsOffset; i < accountsOffset + accountsLength; i++) {
        const path =
          pathComponents.basePath + (pathComponents.index + i).toString();
        const address = await eth.getAddress(path, askConfirm, false);
        addresses[path] = address.address;
        addressToPathMap[address.address.toLowerCase()] = path;
      }
      return addresses;
    } finally {
      transport.close();
    }
  }

  async function signPersonalMessage(msgData) {
    const path = addressToPathMap[msgData.from.toLowerCase()];
    if (!path) throw new Error("address unknown '" + msgData.from + "'");
    const transport = await getTransport();
    try {
      const eth = new AppEth(transport);
      const result = await eth.signPersonalMessage(
        path,
        stripHexPrefix(msgData.data)
      );
      const v = parseInt(result.v, 10) - 27;
      let vHex = v.toString(16);
      if (vHex.length < 2) {
        vHex = `0${v}`;
      }
      return `0x${result.r}${result.s}${vHex}`;
    } finally {
      transport.close();
    }
  }

  async function signTransaction(txData) {
    const path = addressToPathMap[txData.from.toLowerCase()];
    if (!path) throw new Error("address unknown '" + txData.from + "'");
    const transport = await getTransport();
    try {
      const eth = new AppEth(transport);
      const tx = new EthereumTx(txData);

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
        throw makeError(
          "Invalid networkId signature returned. Expected: " +
            networkId +
            ", Got: " +
            signedChainId,
          "InvalidNetworkId"
        );
      }

      return `0x${tx.serialize().toString("hex")}`;
    } finally {
      transport.close();
    }
  }

  const subprovider = new HookedWalletSubprovider({
    getAccounts: callback => {
      getAccounts()
        .then(res => callback(null, Object.values(res)))
        .catch(err => callback(err, null));
    },
    signPersonalMessage: (txData, callback) => {
      signPersonalMessage(txData)
        .then(res => callback(null, res))
        .catch(err => callback(err, null));
    },
    signTransaction: (txData, callback) => {
      signTransaction(txData)
        .then(res => callback(null, res))
        .catch(err => callback(err, null));
    }
  });

  return subprovider;
}
