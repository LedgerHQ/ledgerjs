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
    storageValue: 1,
    localInputValue: 1,
    gasPriceGWEI: 1,
    simpleStorage: null,
    error: null,
    pending: false,
    tx: null
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
    // in truffle-contract, uint values are BigNumber instance so need to convert in our example:
    const storageValue = result.toNumber();
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
        this.setState({
          error: null,
          storageValue: result.args.value.toNumber()
        });
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

  onChangeGasInput = (e: *) => {
    this.setState({ gasPriceGWEI: parseInt(e.target.value, 10) });
  };

  onSetButton = async () => {
    const { simpleStorage, localInputValue, gasPriceGWEI } = this.state;
    const { account } = this.props;
    if (!simpleStorage) return;
    this.setState({ error: null, pending: true });
    try {
      // estimate the gas limit cost we will need for the contract call
      const estimatedGas = await simpleStorage.set.estimateGas(
        localInputValue,
        {
          from: account
        }
      );
      // and add 50% to make sure it does not go out of gas
      const gasCost = 1.5 * estimatedGas;
      // the gas price is configurable by the user. converting it in wei
      const gasPrice = gasPriceGWEI * 1000000000;
      // call the set function on the contract with our new value
      const res = await simpleStorage.set(localInputValue, {
        from: account,
        gasPrice,
        gasCost
      });
      // NB at this stage we don't have the transaction confirmed yet,
      // but we move on by optimistically setting the new value
      this.setState({
        error: null,
        storageValue: localInputValue,
        pending: false,
        tx: res.tx
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
      gasPriceGWEI,
      error,
      pending,
      tx
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
          <label>
            <span>Set new Value</span>
            <input
              type="number"
              min={1}
              step={1}
              value={localInputValue}
              onChange={this.onChangeInput}
            />
            {pending ? (
              "..."
            ) : (
              <button
                onClick={this.onSetButton}
                disabled={localInputValue === storageValue}
              >
                SET
              </button>
            )}
          </label>
        </p>
        <p>
          <label>
            <span>Gas Price (GWEI)</span>
            <input
              type="number"
              min={1}
              value={gasPriceGWEI}
              onChange={this.onChangeGasInput}
            />
          </label>
        </p>
        <p>{tx ? "Transaction: " + tx : null}</p>
        {error ? (
          <div className="error">
            {String((error && error.message) || error)}
          </div>
        ) : null}
      </div>
    );
  }
}
