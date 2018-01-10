import Eth from "@ledgerhq/eth";

export default async comm => {
  const eth = new Eth(comm);
  const result = await eth.getAppConfiguration();
  return result;
};
