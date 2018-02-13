// @flow
import React, { Component } from "react";
import type Web3 from "web3";
import DApp from "./DApp";
import DAppReadOnly from "./DAppReadOnly";
import Onboarding from "./Onboarding";
import availableWallets from "./wallets";
import "./App.css";

/**
 * In our sample architecture, authentification is required to access the dapp.
 * However, DAppReadOnly example shows we can also read the contract without auth.
 * You might want to change and adapt this architecture to your own need.
 */
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
          <h1>React DApp sample</h1>
          <h2>
            <DAppReadOnly />
          </h2>
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
