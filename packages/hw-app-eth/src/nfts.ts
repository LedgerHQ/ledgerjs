import axios from "axios";

type NftInfo = {
  contractAddress: string;
  collectionName: string;
  data: Buffer;
};

type BackendResponse = {
  payload: string;
};

const BACKEND_URL = "https://nft.staging.aws.ledger.fr/v1/ethereum";

export const getNFTInfo = async (
  contractAddress: string,
  chainId: number
): Promise<NftInfo | undefined> => {
  const url = `${BACKEND_URL}/${chainId}/contracts/${contractAddress}`;
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

export const loadNftPlugin = async (
  contractAddress: string,
  selector: string,
  chainId: number
): Promise<string | undefined> => {
  const url = `${BACKEND_URL}/${chainId}/contracts/${contractAddress}/plugin/selector?selector=${selector}`;

  const response = await axios
    .get<BackendResponse>(url)
    .then((r) => r.data)
    .catch(() => null);
  if (!response) return;

  const payload = response["payload"];
  return payload;
};
