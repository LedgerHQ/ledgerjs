import Eth from "@ledgerhq/hw-app-eth";

export default async transport => {
  const eth = new Eth(transport);
  const result = await eth.getAddress("44'/60'/0'/0'/0");
  return result;
};
