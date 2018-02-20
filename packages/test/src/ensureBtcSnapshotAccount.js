import Btc from "@ledgerhq/hw-app-btc";

const expectedBitcoinAddress = "13KE6TffArLh4fVM6uoQzvsYq5vwetJcVM";
export default async transport => {
  const btc = new Btc(transport);
  const result = await btc.getWalletPublicKey("44'/0'/0'/0");
  if (result.bitcoinAddress !== expectedBitcoinAddress) {
    console.log(
      "Expected bitcoinAddress to be " +
        expectedBitcoinAddress +
        " but got " +
        result.bitcoinAddress
    );
    throw new Error(
      "snapshot test can only be run with a Ledger device set up with the same testing seed.\nSee packages/test/README.md for more information."
    );
  }
};
