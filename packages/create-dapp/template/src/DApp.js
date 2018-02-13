import React, { Component } from "react";
import PropTypes from "prop-types";
import SimpleStorageContract from "./SimpleStoreContract";
import "./DApp.css";

/**
 * define our actual DApp that works with a web3 instance on a given account.
 */
export default class DApp extends Component {
  static propTypes = {
    web3: PropTypes.object.isRequired,
    account: PropTypes.string.isRequired,
    onLogout: PropTypes.func.isRequired
  };
  state = {
    storageValue: 1,
    localInputValue: 1,
    gasPriceGWEI: 1,
    simpleStorage: null,
    error: null,
    pending: false,
    tx: null
  };

  async componentDidMount() {
    // initialize the contract and retrieve the deployed version
    const { web3 } = this.props;
    const simpleStorage = await SimpleStorageContract.createWithWeb3(web3);

    const storageValue = await simpleStorage.get();
    this.setState({
      simpleStorage,
      storageValue,
      localInputValue: storageValue
    });

    // and plug to the ValueChanged event
    this.valueChangedSubscription = simpleStorage.listenValueChanged(
      storageValue => {
        this.setState({ storageValue });
      }
    );
  }

  componentWillUnmount() {
    try {
      this.valueChangedSubscription();
    } catch (e) {
      // NB MetaMask currently have an error thrown
      console.error(e);
    }
  }

  onChangeInput = e => {
    this.setState({ localInputValue: parseInt(e.target.value, 10) });
  };

  onChangeGasInput = e => {
    this.setState({ gasPriceGWEI: parseInt(e.target.value, 10) });
  };

  onSetButton = async () => {
    const { simpleStorage, localInputValue, gasPriceGWEI } = this.state;
    const { account } = this.props;
    if (!simpleStorage) return;
    this.setState({ error: null, pending: true });
    try {
      const res = await simpleStorage.set(
        localInputValue,
        account,
        gasPriceGWEI
      );
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
