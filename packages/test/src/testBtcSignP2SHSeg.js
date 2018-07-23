import Btc from "@ledgerhq/hw-app-btc";

export default async transport => {
  const btc = new Btc(transport);

  var tx1 = btc.splitTransaction(
    "0100000001d3a05cd6e15582f40e68bb8b1559dc9e5b3e4f9f34d92c1217dc8c3355bc844e010000008a47304402207ab1a4768cbb036d4bce3c4a294c13cc5ae6076fc7bedce88c62aa80ae366da702204f8fea6923f8df36315c0c26cb42d8d7ab52ca4736776816e10d6ce51906d0600141044289801366bcee6172b771cf5a7f13aaecd237a0b9a1ff9d769cabc2e6b70a34cec320a0565fb7caf11b1ca2f445f9b7b012dda5718b3cface369ee3a034ded6ffffffff02102700000000000017a9141188cc3c265fbc01a025fc8adec9823effd0cef187185f9265170100001976a9140ae1441568d0d293764a347b191025c51556cecd88ac00000000",
    true
  );

  const result = await btc.signP2SHTransaction(
    [
      [
        tx1,
        0,
        "5121026666422d00f1b308fc7527198749f06fedb028b979c09f60d0348ef79c985e41210384257cf895f1ca492bbee5d7485ae0ef479036fdf59e15b92e37970a98d6fe7552ae"
      ]
    ],
    ["0'/0/0"],
    "0188130000000000001976a9140ae1441568d0d293764a347b191025c51556cecd88ac",
    undefined,
    undefined,
    true
  );

  return result;
};
