import Btc from "@ledgerhq/hw-btc";

export default async comm => {
  const btc = new Btc(comm);
  const result = await btc.getWalletPublicKey("44'/0'/0'/0");
  return result;
};
