import React, { useCallback, useState } from "react";
import {
  useSimpleStorageContract,
  useSimpleStorageValue
} from "./SimpleStoreContract";

import "./DApp.css";

/**
 * define our actual DApp that works with a web3 instance on a given account.
 */

const DApp = ({ web3, account, onLogout }) => {
  const simpleStorage = useSimpleStorageContract(web3);
  const storageValue = useSimpleStorageValue(simpleStorage);
  const [localInputValue, setLocalInputValue] = useState(null);
  const [gasPriceGWEI, setGasPriceGWEI] = useState(1);
  const [{ error, pending, tx }, setStatus] = useState({
    error: null,
    pending: false,
    tx: null
  });
  const value = localInputValue || storageValue;

  const onChangeInput = useCallback(e => {
    setLocalInputValue(parseInt(e.target.value, 10));
  }, []);

  const onChangeGasInput = useCallback(e => {
    setGasPriceGWEI(parseInt(e.target.value, 10));
  }, []);

  const onSetButton = useCallback(async () => {
    if (!simpleStorage) return;
    setStatus({ error: null, pending: true, tx: null });
    try {
      const res = await simpleStorage.set(
        localInputValue,
        account,
        gasPriceGWEI
      );
      // NB at this stage we don't have the transaction confirmed yet,
      // but we move on by optimistically setting the new value
      setLocalInputValue(localInputValue);
      setStatus({
        error: null,
        pending: false,
        tx: res.tx
      });
    } catch (error) {
      setStatus({ error, pending: false, tx: null });
    }
  }, [simpleStorage, gasPriceGWEI, localInputValue, account]);

  if (!simpleStorage || value === null) {
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
            value={value}
            onChange={onChangeInput}
          />
          {pending ? (
            "..."
          ) : (
            <button onClick={onSetButton} disabled={value === storageValue}>
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
            onChange={onChangeGasInput}
          />
        </label>
      </p>
      <p>{tx ? "Transaction: " + tx : null}</p>
      {error ? (
        <div className="error">{String((error && error.message) || error)}</div>
      ) : null}
    </div>
  );
};

export default DApp;
