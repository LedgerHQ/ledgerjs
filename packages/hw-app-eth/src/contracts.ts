import axios from "axios";
import { getNFTInfo } from "./nfts";

type ContractMethod = {
  payload: string;
  signature: string;
  plugin: string;
  erc20OfInterest: string[];
  abi: any;
};

// example of payload https://cdn.live.ledger.com/plugins/ethereum/1.json
export type PluginsLoadConfig = {
  // fetch against an api (base url is an api that hosts /plugins/ethereum/${chainId}.json )
  // set to null will disable it
  baseURL?: string | null;
  // provide manually some extra plugins to add for the resolution (e.g. for dev purpose)
  // object will be merged with the returned value of the Ledger cdn payload
  extraPlugins?: any | null;
};

const defaultPluginsLoadConfig = {
  baseURL: "https://cdn.live.ledger.com",
  extraPlugins: null,
};

/**
 * Retrieve the metadatas a given contract address and a method selector
 */
export const loadInfosForContractMethod = async (
  contractAddress: string,
  selector: string,
  chainId: number,
  userPluginsLoadConfig: PluginsLoadConfig
): Promise<ContractMethod | undefined> => {
  const { baseURL, extraPlugins } = {
    ...defaultPluginsLoadConfig,
    ...userPluginsLoadConfig,
  };

  const nftInfo = await getNFTInfo(contractAddress, chainId);
  if (nftInfo) {
    const contractBuffer = Buffer.from(contractAddress.slice(2), "hex");
    const selectorBuffer = Buffer.from(selector.slice(2), "hex");

    // Placeholder
    const erc721 = Buffer.from([0x06, 0x45, 0x52, 0x43, 0x37, 0x32, 0x31]); // "ERC721"
    // Placeholder
    const sig = Buffer.from([
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
      42,
    ]);

    const payload = Buffer.concat([
      erc721,
      contractBuffer,
      selectorBuffer,
      sig,
    ]).toString("hex");

    return {
      payload: payload,
      signature: "",
      plugin: "ERC721", // placeholder
      erc20OfInterest: [],
      abi: null,
    };
  } else {
    let data = !baseURL
      ? {}
      : await axios
          .get(`${baseURL}/plugins/ethereum.json`)
          .then((r) => r.data)
          .catch((e) => {
            if (
              e.response &&
              400 <= e.response.status &&
              e.response.status < 500
            ) {
              return null; // not found cases can be ignored to allow future changes in endpoint without failing a signature to be done.
            }
            throw e;
          });

    if (extraPlugins) {
      data = { ...data, ...extraPlugins };
    }

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
  }
};
