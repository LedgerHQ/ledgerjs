import Eth from "@ledgerhq/hw-app-eth";

export default async transport => {
  const eth = new Eth(transport);
  const result = await eth.getAppConfiguration();
  return result;
};
