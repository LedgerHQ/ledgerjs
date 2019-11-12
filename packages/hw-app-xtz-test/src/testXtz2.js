import Xtz from "@ledgerhq/hw-app-xtz";

export default async transport => {
  const xtz = new Xtz(transport);
  const result = await xtz.getAddress("44'/1729'/0'/0'", false);
  return result;
};
