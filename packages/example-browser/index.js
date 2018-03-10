import "./index.css";
import React, { Component } from "react";
import ReactDOM from "react-dom";
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import Btc from "@ledgerhq/hw-app-btc";
import Eth from "@ledgerhq/hw-app-eth";

class App extends Component {
  state = {
    address: null,
    error: null
  };
  onGetLedgerBitcoinAddress = async () => {
    try {
      this.setState({ error: null });
      const transport = await TransportU2F.create();
      const btc = new Btc(transport);
      const { bitcoinAddress } = await btc.getWalletPublicKey("44'/0'/0'/0");
      this.setState({ address: bitcoinAddress });
    } catch (error) {
      this.setState({ error });
    }
  };
  onGetLedgerEthereumAddress = async () => {
    try {
      this.setState({ error: null });
      const transport = await TransportU2F.create();
      const eth = new Eth(transport);
      const { address } = await eth.getAddress("44'/60'/0'/0'/0");
      this.setState({ address });
    } catch (error) {
      this.setState({ error });
    }
  };
  render() {
    const { address, error } = this.state;
    return (
      <div>
        <p>
          <button onClick={this.onGetLedgerBitcoinAddress}>
            Get Ledger Bitcoin Address
          </button>
        </p>
        <p>
          <button onClick={this.onGetLedgerEthereumAddress}>
            Get Ledger Ethereum Address
          </button>
        </p>
        <p>
          {error ? (
            <code className="error">{error.toString()}</code>
          ) : (
            <code className="address">{address}</code>
          )}
        </p>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("root"));
