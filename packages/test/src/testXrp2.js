import Xrp from "@ledgerhq/hw-app-xrp";

export default async transport => {
  const xrp = new Xrp(transport);
  const result = await xrp.getAddress("44'/144'/0'/0/0");
  return result;
};
