import { Component } from "react";
import SimpleStorageContract from "./SimpleStoreContract";
import { getReadOnlyWeb3 } from "./wallets";

/**
 * this is a simpler way to show use the contracts
 * without being logged in via metamask or ledger device.
 * NB: we can't sign transaction but we can still read the contract.
 */
export default class DappReadOnly extends Component {
  state = {
    value: null
  };

  async componentDidMount() {
    const web3 = await getReadOnlyWeb3();
    const simpleStorage = await SimpleStorageContract.createWithWeb3(web3);
    const value = await simpleStorage.get();
    this.setState({ value });
    this.valueChangedSubscription = simpleStorage.listenValueChanged(value => {
      this.setState({ value });
    });
  }

  componentWillUnmount() {
    this.valueChangedSubscription();
  }

  render() {
    const { value } = this.state;
    return "value: " + (value !== null ? value : "...");
  }
}
