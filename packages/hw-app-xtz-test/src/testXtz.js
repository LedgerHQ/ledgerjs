import Xtz from "@ledgerhq/hw-app-xtz";

export default async transport => {
  const xtz = new Xtz(transport);
  const result = await xtz.getVersion();
  return result;
};
