import Eth from "@ledgerhq/hw-eth";

export default async comm => {
  const eth = new Eth(comm);
  const result = await eth.getAppConfiguration();
  return result;
};
