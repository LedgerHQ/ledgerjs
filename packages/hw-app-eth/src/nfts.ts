import axios from "axios";

type NftInfo = {
  contractAddress: string;
  collectionName: string;
  data: Buffer;
};

const BACKEND_URL = "https://nft.staging.aws.ledger.fr/v1/chains/";

export const getNFTInfo = async (
  contractAddress: string,
  chainId: number
): Promise<NftInfo | undefined> => {
  let chain = "";
  if (chainId == 1) {
    chain = "eth";
  }

  const url = BACKEND_URL + chain + "/contracts/" + contractAddress;
  const data = await axios
    .get(url)
    .then((r) => r.data)
    .catch((e) => {
      if (e.response && 400 <= e.response.status && e.response.status < 500) {
        return null; // not found cases can be ignored to allow future changes in endpoint without failing a signature to be done.
      }
      throw e;
    });
  if (data.length < 3) {
    return;
  }

  let j = 2;
  const collectionNameLength = data.slice(j, j + 1);
  j += 1;
  const collectionName = data.slice(j, j + collectionNameLength).toString();
  return {
    contractAddress: contractAddress,
    collectionName: collectionName,
    data: data,
  };
};
