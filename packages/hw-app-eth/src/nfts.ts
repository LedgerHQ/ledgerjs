import axios from "axios";

type NftInfo = {
  contractAddress: string;
  collectionName: string;
  data: Buffer;
};

const BACKEND_URL = "https://nft.staging.aws.ledger.fr/v1/chains/";
const ETHEREUM_MAINNET = 1;

export const getNFTInfo = async (
  contractAddress: string,
  chainId: number
): Promise<NftInfo | undefined> => {
  let chain = "";
  if (chainId == ETHEREUM_MAINNET) {
    chain = "eth";
  }

  const url = BACKEND_URL + chain + "/contracts/" + contractAddress;
  const response = await axios
    .get(url)
    .then((r) => r.data)
    .catch((e) => {
      if (e.response && 400 <= e.response.status && e.response.status <= 504) {
        return null; // not found cases can be ignored to allow fall back to blind signing.
      }
      throw e;
    });
  if (!response || response instanceof Error) return;

  let j = 2;
  const data = response as any;
  const payload = data["payload"];
  const collectionNameLength = payload.slice(j, j + 1);
  j += 1;
  const collectionName = payload.slice(j, j + collectionNameLength).toString();
  return {
    contractAddress: contractAddress,
    collectionName: collectionName,
    data: Buffer.from(payload, "hex"),
  };
};
