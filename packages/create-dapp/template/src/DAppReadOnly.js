// @flow
import { Component } from "react";
import contract from "truffle-contract";
import SimpleStorageContract from "./dapp/build/contracts/SimpleStorage.json";
import { getReadOnlyWeb3 } from "./wallets";

/**
 * this is a simpler way to show use the contracts
 * without being logged in via metamask or ledger device.
 * NB: we can't sign transaction but we can still read the contract.
 */
export default class DappReadOnly extends Component<*, *> {
  state = {
    value: null
  };

  valueChangedEvent: *;

  async componentDidMount() {
    const web3 = await getReadOnlyWeb3();
    const simpleStorageContract = contract(SimpleStorageContract);
    simpleStorageContract.setProvider(web3.currentProvider);
    const simpleStorage = await simpleStorageContract.deployed();
    const value = await simpleStorage.get();
    this.setState({ value });
    this.valueChangedEvent = simpleStorage.ValueChanged();
    this.valueChangedEvent.watch((error, r) => {
      if (!error) {
        this.setState({
          value: r.args.value
        });
      }
    });
  }

  componentWillUnmount() {
    this.valueChangedEvent.stopWatching();
  }

  render() {
    const { value } = this.state;
    return "value: " + (value ? value.toString() : "...");
  }
}
