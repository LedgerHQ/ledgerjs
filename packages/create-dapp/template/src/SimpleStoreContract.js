import { useEffect, useState } from "react";
import createContract from "truffle-contract";

// our example includes a simple contract that allows to set and restore a value.
import SimpleStorageJSON from "./dapp/build/contracts/SimpleStorage.json";

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

export default class SimpleStorageContract {
  static async createWithWeb3(web3) {
    // initialize the contract and retrieve the deployed version
    const SimpleStorage = createContract(SimpleStorageJSON);
    SimpleStorage.setProvider(web3.currentProvider);
    const contract = contractAddress
      ? await SimpleStorage.at(contractAddress)
      : await SimpleStorage.deployed();
    return new SimpleStorageContract(contract);
  }

  constructor(contract) {
    this.contract = contract;
  }

  async get() {
    // retrieve the value of the contract
    const result = await this.contract.get();
    // in truffle-contract, uint values are BigNumber instance so need to convert in our example:
    return result.toNumber();
  }

  async set(value, account, gasPriceGWEI) {
    // estimate the gas limit cost we will need for the contract call
    const estimatedGas = await this.contract.set.estimateGas(value, {
      from: account
    });
    // and add 50% to make sure it does not go out of gas
    const gasCost = 1.5 * estimatedGas;
    // the gas price is configurable by the user. converting it in wei
    const gasPrice = gasPriceGWEI * 1000000000;
    // call the set function on the contract with our new value
    const res = await this.contract.set(value, {
      from: account,
      gasPrice,
      gasCost
    });
    return res;
  }
}

export const useSimpleStorageContract = web3 => {
  const [simpleStorage, setSimpleStorage] = useState(null);

  useEffect(() => {
    if (!web3) return;

    let unmounted;

    async function main() {
      const simpleStorage = await SimpleStorageContract.createWithWeb3(web3);
      if (unmounted) return;
      setSimpleStorage(simpleStorage);
    }
    main();

    return () => {
      unmounted = true;
    };
  }, [web3]);

  return simpleStorage;
};

export const useSimpleStorageValue = simpleStorage => {
  const [value, setValue] = useState(null);

  useEffect(() => {
    if (!simpleStorage) return;

    let unmounted;

    async function main() {
      const value = await simpleStorage.get();
      if (unmounted) return;
      setValue(value);
    }
    main();

    return () => {
      unmounted = true;
    };
  }, [simpleStorage]);

  return value;
};
