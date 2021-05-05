import data from "@ledgerhq/cryptoassets/data/dapps/ethereum";

/**
 * Retrieve the name of a plugin compatible with a given contract address and a method selector
 */

export const getPluginForContractMethod = (contractAddress, selector) => {
  if (contractAddress in data) {
    let contractSelectors = data[contractAddress];

    if (selector in contractSelectors) {
      return {
        payload: contractSelectors[selector]["serialized_data"],
        signature: contractSelectors[selector]["signature"],
      };
    }
  }
};

exports.getPluginForContractMethod = getPluginForContractMethod;
