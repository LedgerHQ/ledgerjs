import React, { Component } from "react";
import PropTypes from "prop-types";
import "./Onboarding.css";

/**
 * define Onboarding, a component that will handle
 * the wallet selection and account address selection logic
 */
export default class Onboarding extends Component {
  static propTypes = {
    wallets: PropTypes.array.isRequired,
    onDone: PropTypes.func.isRequired
  };
  state = {
    pending: false,
    web3: null,
    error: null,
    accounts: null,
    selectedWalletIndex: -1,
    selectedAccountIndex: 0
  };

  onWalletChange = async e => {
    const selectedWalletIndex = parseInt(e.target.value, 10);
    const wallet = this.props.wallets[selectedWalletIndex];
    try {
      this.setState({
        selectedWalletIndex,
        pending: true,
        accounts: null,
        error: null
      });
      const web3 = await wallet.getWeb3();
      const accounts = await new Promise((resolve, reject) => {
        web3.eth.getAccounts((error, accounts) => {
          if (error) reject(error);
          else resolve(accounts);
        });
      });
      if (accounts.length === 0) throw new Error("no accounts found");
      this.setState({
        web3,
        accounts,
        pending: false,
        error: null
      });
    } catch (error) {
      this.setState({ error, pending: false });
    }
  };

  onAccountChange = e => {
    this.setState({ selectedAccountIndex: parseInt(e.target.value, 10) });
  };

  onDone = () => {
    const { web3, accounts, selectedAccountIndex } = this.state;
    const account = accounts && accounts[selectedAccountIndex];
    account && this.props.onDone(web3, account);
  };

  render() {
    const { wallets } = this.props;
    const {
      pending,
      error,
      accounts,
      selectedAccountIndex,
      selectedWalletIndex
    } = this.state;
    return (
      <div className="Onboarding">
        <section>
          <h2>1. select a wallet</h2>
          <div className="wallets">
            {wallets.map((wallet, i) => (
              <label key={i}>
                <input
                  type="radio"
                  name="onboarding-wallet"
                  value={i}
                  disabled={pending}
                  checked={selectedWalletIndex === i}
                  onChange={this.onWalletChange}
                />
                {wallet.name}
              </label>
            ))}
          </div>
        </section>
        {accounts ? (
          <section>
            <h2>2. select an account</h2>
            <div className="accounts">
              {accounts.map((account, i) => (
                <label key={account}>
                  <input
                    type="radio"
                    name="onboarding-account"
                    value={i}
                    disabled={pending}
                    checked={selectedAccountIndex === i}
                    onChange={this.onAccountChange}
                  />
                  {account}
                </label>
              ))}
            </div>
            <footer>
              <button onClick={this.onDone}>Connect</button>
            </footer>
          </section>
        ) : null}
        {pending ? <div className="loading">Loading...</div> : null}
        {error ? (
          <div className="error">
            {String((error && error.message) || error)}
          </div>
        ) : null}
      </div>
    );
  }
}
