import Str from "@ledgerhq/hw-app-str";

export default async transport => {
  const str = new Str(transport);
  const result = await str.getPublicKey("44'/148'/0'", true, true);
  return result;
};
