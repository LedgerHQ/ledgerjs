import Xrp from "@ledgerhq/hw-app-xrp";

export default async transport => {
  const xrp = new Xrp(transport);
  const result = await xrp.getAppConfiguration();
  return result;
};
