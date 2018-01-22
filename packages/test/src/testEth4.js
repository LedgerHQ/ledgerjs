import Eth from "@ledgerhq/hw-app-eth";

export default async transport => {
  const eth = new Eth(transport);
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
