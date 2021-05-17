import data from "@ledgerhq/cryptoassets/data/dapps/ethereum";

/**
 * Retrieve the metadatas a given contract address and a method selector
 */

export const getInfosForContractMethod = (contractAddress, selector) => {
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
