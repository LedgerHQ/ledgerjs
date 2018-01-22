import Eth from "@ledgerhq/hw-app-eth";

export default async transport => {
  const eth = new Eth(transport);
  const result = await eth.signTransaction(
    "44'/60'/0'/0'/0",
    "e8018504e3b292008252089428ee52a8f3d6e5d15f8b131996950d7f296c7952872bd72a2487400080"
  );
  return result;
};
