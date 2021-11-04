import axios from "axios";

type NftInfo = {
  contractAddress: string;
  collectionName: string;
  data: Buffer;
};

type BackendResponse = {
  payload: string;
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
    .get<BackendResponse>(url)
    .then((r) => r.data)
    .catch(() => null);
  if (!response) return;

  const payload = response["payload"];
  const collectionNameLength = Number(payload.slice(2, 3));
  const collectionName = payload.slice(3, 3 + collectionNameLength).toString();
  return {
    contractAddress: contractAddress,
    collectionName: collectionName,
    data: Buffer.from(payload, "hex"),
  };
};
