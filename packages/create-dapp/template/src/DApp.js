// @flow
import React, { Component } from "react";
import contract from "truffle-contract";
import type Web3 from "web3";
import "./DApp.css";

// our example includes a simple contract that allows to set and restore a value.
import SimpleStorageContract from "./dapp/build/contracts/SimpleStorage.json";

/**
 * define our actual DApp that works with a web3 instance on a given account.
 */
export default class DApp extends Component<
  {
    web3: Web3,
    account: string,
    onLogout: () => void
  },
  *
> {
  state = {
    storageValue: 0,
    localInputValue: 0,
    simpleStorage: null,
    error: null,
    pending: false
  };

  valueChangedEvent: *;

  async componentDidMount() {
    // initialize the contract and retrieve the deployed version
    const { web3 } = this.props;
    const simpleStorageContract = contract(SimpleStorageContract);
    simpleStorageContract.setProvider(web3.currentProvider);
    const simpleStorage = await simpleStorageContract.deployed();

    // retrieve the value of the contract
    const result = await simpleStorage.get();
    const storageValue = result.c[0];
    this.setState({
      simpleStorage,
      storageValue,
      localInputValue: storageValue
    });

    // and plug to the ValueChanged event
    this.valueChangedEvent = simpleStorage.ValueChanged();
    this.valueChangedEvent.watch((error, result) => {
      if (error) {
        this.setState({ error });
      } else {
        this.setState({ error: null, storageValue: result.args.value.c[0] });
      }
    });
  }

  componentWillUnmount() {
    try {
      this.valueChangedEvent.stopWatching();
    } catch (e) {
      // NB MetaMask currently have an error thrown
      console.error(e);
    }
  }

  onChangeInput = (e: *) => {
    this.setState({ localInputValue: parseInt(e.target.value, 10) });
  };

  onSetButton = async () => {
    const { simpleStorage, localInputValue } = this.state;
    const { account } = this.props;
    if (!simpleStorage) return;
    this.setState({ error: null, pending: true });
    try {
      // call the set function on the contract with our new value
      await simpleStorage.set(localInputValue, { from: account });
      // NB at this stage we don't have the transaction confirmed yet,
      // but we move on by optimistically setting the new value
      this.setState({
        error: null,
        storageValue: localInputValue,
        pending: false
      });
    } catch (error) {
      this.setState({ error, pending: false });
    }
  };

  render() {
    const { account, onLogout } = this.props;
    const {
      simpleStorage,
      storageValue,
      localInputValue,
      error,
      pending
    } = this.state;

    if (!simpleStorage) {
      return (
        <div className="App">
          <div className="loading">Loading...</div>
        </div>
      );
    }

    return (
      <div className="DApp">
        <p>
          Account <code>{account}</code>{" "}
          <button onClick={onLogout}>Logout</button>
        </p>
        <p>
          The stored value is: <strong>{storageValue}</strong>
        </p>
        <label>
          <input
            type="number"
            value={localInputValue}
            onChange={this.onChangeInput}
          />
          <button
            onClick={this.onSetButton}
            disabled={pending || localInputValue === storageValue}
          >
            SET
          </button>
        </label>
        {error ? (
          <div className="error">
            {String((error && error.message) || error)}
          </div>
        ) : null}
      </div>
    );
  }
}
