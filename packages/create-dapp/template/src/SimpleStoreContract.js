import createContract from "truffle-contract";

// our example includes a simple contract that allows to set and restore a value.
import SimpleStorageJSON from "./dapp/build/contracts/SimpleStorage.json";

export default class SimpleStorageContract {
  static async createWithWeb3(web3) {
    // initialize the contract and retrieve the deployed version
    const contract = createContract(SimpleStorageJSON);
    contract.setProvider(web3.currentProvider);
    const contractResolved = await contract.deployed();
    return new SimpleStorageContract(contractResolved);
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

  // we can also listen to the ValueChanged event
  listenValueChanged(fn) {
    const event = this.contract.ValueChanged();
    event.watch((error, result) => {
      if (!error) {
        fn(result.args.value.toNumber());
      }
    });
    return () => event.stopWatching();
  }
}
