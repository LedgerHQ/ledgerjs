import axios from "axios";

type ContractMethod = {
  payload: string;
  signature: string;
  plugin: string;
  erc20OfInterest: string[];
  abi: any;
};

/**
 * Retrieve the metadatas a given contract address and a method selector
 */
export const loadInfosForContractMethod = async (
  contractAddress: string,
  selector: string
): Promise<ContractMethod | undefined> => {
  const data = await axios
    .get("https://cdn.live.ledger.com/plugins/ethereum.json")
    .then((r) => r.data)
    .catch((e) => {
      if (e.response && 400 <= e.response.status && e.response.status < 500) {
        return null; // not found cases can be ignored to allow future changes in endpoint without failing a signature to be done.
      }
      throw e;
    });
  if (!data) return;

  const lcSelector = selector.toLowerCase();
  const lcContractAddress = contractAddress.toLowerCase();

  if (lcContractAddress in data) {
    const contractSelectors = data[lcContractAddress];

    if (lcSelector in contractSelectors) {
      return {
        payload: contractSelectors[lcSelector]["serialized_data"],
        signature: contractSelectors[lcSelector]["signature"],
        plugin: contractSelectors[lcSelector]["plugin"],
        erc20OfInterest: contractSelectors[lcSelector]["erc20OfInterest"],
        abi: contractSelectors["abi"],
      };
    }
  }
};
