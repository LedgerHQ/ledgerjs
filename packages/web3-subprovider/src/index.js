//@flow
import AppEth from "@ledgerhq/hw-app-eth";
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import { TransportError } from "@ledgerhq/hw-transport";
import HookedWalletSubprovider from "web3-provider-engine/subproviders/hooked-wallet";
import stripHexPrefix from "strip-hex-prefix";
import EthereumTx from "ethereumjs-tx";

const allowedHdPaths = ["44'/60'", "44'/61'"];

function obtainPathComponentsFromDerivationPath(derivationPath) {
  // check if derivation path follows 44'/60'/x'/n pattern
  const regExp = /^(44'\/6[0|1]'\/\d+'?\/)(\d+)$/;
  const matchResult = regExp.exec(derivationPath);
  if (matchResult === null) {
    throw new TransportError(
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
  accountsOffset?: number,
  // timeout to wait the device
  timeout?: number
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
 * @example
import Web3 from "web3";
import createLedgerSubprovider from "@ledgerhq/web3-subprovider";
import ProviderEngine from "web3-provider-engine";
import RpcSubprovider from "web3-provider-engine/subproviders/rpc";
const engine = new ProviderEngine();
const ledger = await createLedgerSubprovider({
  accountsLength: 5
});
engine.addProvider(ledger);
engine.addProvider(new RpcSubprovider({ rpcUrl }));
engine.start();
const web3 = new Web3(engine);
 */
export default async function createLedgerSubprovider(
  options?: SubproviderOptions
): Promise<HookedWalletSubprovider> {
  const {
    networkId,
    path,
    askConfirm,
    accountsLength,
    accountsOffset,
    timeout
  } = {
    ...defaultOptions,
    ...options
  };
  if (!allowedHdPaths.some(hdPref => path.startsWith(hdPref))) {
    throw new TransportError(
      "Ledger derivation path allowed are " +
        allowedHdPaths.join(", ") +
        ". " +
        path +
        " is not supported",
      "InvalidDerivationPath"
    );
  }
  const supported = await TransportU2F.isSupported();
  if (!supported)
    throw new TransportError(
      "U2F is not supported by your browser",
      "U2FNotSupported"
    );
  const transport = await TransportU2F.create(timeout);
  const eth = new AppEth(transport);

  const pathComponents = obtainPathComponentsFromDerivationPath(path);

  async function getAccounts() {
    const addresses = {};
    for (let i = accountsOffset; i < accountsOffset + accountsLength; i++) {
      const path =
        pathComponents.basePath + (pathComponents.index + i).toString();
      const address = await eth.getAddress(path, askConfirm, false);
      addresses[path] = address.address;
    }
    return addresses;
  }

  async function signPersonalMessage(msgData) {
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
  }

  async function signTransaction(txData) {
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
      throw new TransportError(
        "Invalid networkId signature returned. Expected: " +
          networkId +
          ", Got: " +
          signedChainId,
        "InvalidNetworkId"
      );
    }

    return `0x${tx.serialize().toString("hex")}`;
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
