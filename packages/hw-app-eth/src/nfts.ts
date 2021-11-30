import axios from "axios";
import { getLoadConfig } from "./loadConfig";
import type { LoadConfig } from "./loadConfig";
import { log } from "@ledgerhq/logs";

type NftInfo = {
  contractAddress: string;
  collectionName: string;
  data: Buffer;
};

type BackendResponse = {
  payload: string;
};

export const getNFTInfo = async (
  contractAddress: string,
  chainId: number,
  userLoadConfig: LoadConfig
): Promise<NftInfo | undefined> => {
  const { nftExplorerBaseURL } = getLoadConfig(userLoadConfig);
  if (!nftExplorerBaseURL) return;
  const url = `${nftExplorerBaseURL}/${chainId}/contracts/${contractAddress}`;
  const response = await axios
    .get<BackendResponse>(url)
    .then((r) => r.data)
    .catch((e) => {
      log("error", "could not fetch from " + url + ": " + String(e));
      return null;
    });
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
  chainId: number,
  userLoadConfig: LoadConfig
): Promise<string | undefined> => {
  const { nftExplorerBaseURL } = getLoadConfig(userLoadConfig);
  if (!nftExplorerBaseURL) return;
  const url = `${nftExplorerBaseURL}/${chainId}/contracts/${contractAddress}/plugin-selector/${selector}`;

  const response = await axios
    .get<BackendResponse>(url)
    .then((r) => r.data)
    .catch((e) => {
      log("error", "could not fetch from " + url + ": " + String(e));
      return null;
    });
  if (!response) return;

  const payload = response["payload"];
  return payload;
};
