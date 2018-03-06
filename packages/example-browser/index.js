import "./index.css";
import React, { Component } from "react";
import ReactDOM from "react-dom";
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import Btc from "@ledgerhq/hw-app-btc";

class App extends Component {
  state = {
    bitcoinAddress: null,
    error: null
  };
  onGetLedgerBitcoinAddress = async () => {
    try {
      this.setState({ error: null });
      const transport = await TransportU2F.create();
      const btc = new Btc(transport);
      const { bitcoinAddress } = await btc.getWalletPublicKey("44'/0'/0'/0");
      this.setState({ bitcoinAddress });
    } catch (error) {
      this.setState({ error });
    }
  };
  render() {
    const { bitcoinAddress, error } = this.state;
    return (
      <div>
        <button onClick={this.onGetLedgerBitcoinAddress}>
          Get Ledger Bitcoin Address
        </button>
        <p>
          {error ? (
            <code className="error">{error.toString()}</code>
          ) : (
            <code className="bitcoinAddress">{bitcoinAddress}</code>
          )}
        </p>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("root"));
