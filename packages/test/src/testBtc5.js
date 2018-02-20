import Btc from "@ledgerhq/hw-app-btc";

export default async transport => {
  const btc = new Btc(transport);
  var tx1 = btc.splitTransaction(
    "01000000000101bf3fed5598ad9fe1bf718685667483e89c76b9355b07c5f0cfcfe6534c22badc00000000171600145fb6358e7bc3cf4f6154c4538b14fbfda2122fcfffffffff01f6f2b5150000000017a914e1f3ad04afcccc425ea51d6a872d8f3c999404438702473044022043444ccfbe6f858e8d893290c6e89387f2f39fc7320d31e85cbd5c410b66a6ac022022dac008ae08aeb98c601bdcfcc64723914832d37046efb8ba55b890f80388f70121034993028903b777aa444afd39b9f5aff939b5e34bb4f82958e8ae8c1ced1220f500000000",
    true
  );
  const result = await btc.createPaymentTransactionNew(
    [[tx1, 0]],
    ["49'/1'/3'/0/1"],
    undefined,
    "018eecb5150000000017a91482c43a3a729ca7096e5dc32ce87275f1bab7e2d787",
    undefined,
    undefined,
    true
  );
  return result;
};
