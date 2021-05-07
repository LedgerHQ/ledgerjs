import data from "@ledgerhq/cryptoassets/data/dapps/ethereum";

/**
 * Retrieve the metadatas a given contract address and a method selector
 */

export const getInfosForContractMethod = (contractAddress, selector) => {
  if (contractAddress in data) {
    let contractSelectors = data[contractAddress];

    if (selector in contractSelectors) {
      return {
        payload: contractSelectors[selector]["serialized_data"],
        signature: contractSelectors[selector]["signature"],
        plugin: contractSelectors[selector]["plugin"],
        erc20OfInterest: contractSelectors[selector]["erc20OfInterest"],
        abi: contractSelectors["abi"],
      };
    }
  }
};

exports.getInfosForContractMethod = getInfosForContractMethod;
