import Eth from "@ledgerhq/eth";

export default async comm => {
  const eth = new Eth(comm);
  const result = await eth.signPersonalMessage(
    "44'/60'/0'/0'/0",
    Buffer.from("test").toString("hex")
  );
  var v = result["v"] - 27;
  v = v.toString(16);
  if (v.length < 2) {
    v = "0" + v;
  }
  return "Signature 0x" + result["r"] + result["s"] + v;
};
