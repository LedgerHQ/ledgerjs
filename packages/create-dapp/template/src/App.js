// @flow
import React, { Component } from "react";
import type Web3 from "web3";
import DApp from "./DApp";
import Onboarding from "./Onboarding";
import availableWallets from "./wallets";
import "./App.css";

export default class App extends Component<
  {},
  { web3: ?Web3, account: ?string }
> {
  state = {
    web3: null,
    account: null
  };

  onLogout = () => {
    this.setState({ web3: null, account: null });
  };

  onOnboardingDone = (web3: Web3, account: string) => {
    this.setState({ web3, account });
  };

  render() {
    const { account, web3 } = this.state;
    return (
      <div className="App">
        <header>
          <h1>React DApp Sample</h1>
        </header>
        <div className="App-body">
          {account && web3 ? (
            <DApp account={account} web3={web3} onLogout={this.onLogout} />
          ) : (
            <Onboarding
              wallets={availableWallets}
              onDone={this.onOnboardingDone}
            />
          )}
        </div>
      </div>
    );
  }
}
