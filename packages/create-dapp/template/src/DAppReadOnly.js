import {
  useSimpleStorageContract,
  useSimpleStorageValue
} from "./SimpleStoreContract";
import { useReadOnlyWeb3 } from "./wallets";

/**
 * this is a simpler way to show use the contracts
 * without being logged in via metamask or ledger device.
 * NB: we can't sign transaction but we can still read the contract.
 */
const DappReadOnly = () => {
  const web3 = useReadOnlyWeb3();
  const simpleStorage = useSimpleStorageContract(web3);
  const value = useSimpleStorageValue(simpleStorage);
  return "value: " + (value !== null ? value : "...");
};

export default DappReadOnly;
