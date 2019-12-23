import React, { useState, useCallback } from "react";
import DApp from "./DApp";
import DAppReadOnly from "./DAppReadOnly";
import Onboarding from "./Onboarding";
import availableWallets from "./wallets";
import "./App.css";

/**
 * In our sample architecture, authentication is required to access the dapp.
 * However, DAppReadOnly example shows we can also read the contract without auth.
 * You might want to change and adapt this architecture to your own need.
 */
const App = () => {
  const [{ web3, account }, setState] = useState({ web3: null, account: null });

  const onLogout = useCallback(() => {
    setState({ web3: null, account: null });
  }, []);

  const onOnboardingDone = useCallback((web3, account) => {
    setState({ web3, account });
  }, []);

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
          <DApp account={account} web3={web3} onLogout={onLogout} />
        ) : (
          <Onboarding wallets={availableWallets} onDone={onOnboardingDone} />
        )}
      </div>
    </div>
  );
};

export default App;
