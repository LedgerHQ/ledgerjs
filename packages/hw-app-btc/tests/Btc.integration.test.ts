// import Transport from "@ledgerhq/hw-transport-node-hid";
import SpeculosTransport from "@ledgerhq/hw-transport-node-speculos";
import BtcNew from "../src/BtcNew";
import Btc from "../src/Btc";
import { AppClient } from "../src/newops/appClient";
import { getXpubComponents } from "../src/bip32";
import { compressPublicKey } from "../src/compressPublicKey";
import Transport from "@ledgerhq/hw-transport";

const xpubs = {
  "m/44'/1'/0'":
    "tpubDCwYjpDhUdPGP5rS3wgNg13mTrrjBuG8V9VpWbyptX6TRPbNoZVXsoVUSkCjmQ8jJycjuDKBb9eataSymXakTTaGifxR6kmVsfFehH1ZgJT",
  "m/44'/1'/10'":
    "tpubDCwYjpDhUdPGp21gSpVay2QPJVh6WNySWMXPhbcu1DsxH31dF7mY18oibbu5RxCLBc1Szerjscuc3D5HyvfYqfRvc9mesewnFqGmPjney4d",
  "m/44'/1'/2'/1/42":
    "tpubDGF9YgHKv6qh777rcqVhpmDrbNzgophJM9ec7nHiSfrbss7fVBXoqhmZfohmJSvhNakDHAspPHjVVNL657tLbmTXvSeGev2vj5kzjMaeupT",
  "m/48'/1'/4'/1'/0/7":
    "tpubDK8WPFx4WJo1R9mEL7Wq325wBiXvkAe8ipgb9Q1QBDTDUD2YeCfutWtzY88NPokZqJyRPKHLGwTNLT7jBG59aC6VH8q47LDGQitPB6tX2d7",
  "m/49'/1'/1'/1/3":
    "tpubDGnetmJDCL18TyaaoyRAYbkSE9wbHktSdTS4mfsR6inC8c2r6TjdBt3wkqEQhHYPtXpa46xpxDaCXU2PRNUGVvDzAHPG6hHRavYbwAGfnFr",
  "m/84'/1'/2'/0/10":
    "tpubDG9YpSUwScWJBBSrhnAT47NcT4NZGLcY18cpkaiWHnkUCi19EtCh8Heeox268NaFF6o56nVeSXuTyK6jpzTvV1h68Kr3edA8AZp27MiLUNt",
  "m/86'/1'/4'/1/12":
    "tpubDHTZ815MvTaRmo6Qg1rnU6TEU4ZkWyA56jA1UgpmMcBGomnSsyo34EZLoctzZY9MTJ6j7bhccceUeXZZLxZj5vgkVMYfcZ7DNPsyRdFpS3f",
};
/*
const addresses = {
  "m/44'/1'/0'/0/0": "mz5vLWdM1wHVGSmXUkhKVvZbJ2g4epMXSm",
  "m/84'/1'/0'/0/0": "tb1qzdr7s2sr0dwmkwx033r4nujzk86u0cy6fmzfjk",
  "m/49'/1'/0'/0/0": "2MyHkbusvLomaarGYMqyq7q9pSBYJRwWcsw",
};
*/
test("Basic happypath BtcOld test", async () => {
  await runGetWalletPublicKey("old");
});

test("Basic happypath BtcNew test", async () => {
  await runGetWalletPublicKey("new");
});

async function transport() {
  return await SpeculosTransport.open({ apduPort: 9999 });
}

async function impl(
  variant: "old" | "new",
  transport: Transport
): Promise<Btc | BtcNew> {
  if (variant === "old") {
    return new Btc(transport);
  }
  const client = new AppClient(transport);
  const btc = new BtcNew(client);
  return btc;
}

async function runGetWalletPublicKey(variant: "old" | "new") {
  let tr;
  try {
    tr = await transport();
  } catch (e) {
    console.error("FIXME: SPECULOS TEST IGNORED BECAUSE INSTANCE IS NOT UP", e);
    return;
  }
  try {
    const btc = await impl(variant, tr);

    const account = await btc.getWalletPublicKey("m/44'/1'/0'");
    const expectedAccount = getXpubComponents(xpubs["m/44'/1'/0'"]);

    const uncompressesPubkey =
      "04e84c7f4b7662faed9f5eb2d812d9b7bcf0e0bf2a33b17ac45e38b8459669c321816e33dd5541f01ac4e9dbee1ad25fccf2bdc1dc16336b3ae66463c093d612ed";
    expect(compressPublicKey(Buffer.from(uncompressesPubkey, "hex"))).toEqual(
      expectedAccount.pubkey
    );

    expect(account.chainCode).toEqual(
      expectedAccount.chaincode.toString("hex")
    );
    expect(account.publicKey).toEqual(uncompressesPubkey);

    const keydata = await btc.getWalletPublicKey("m/44'/1'/0'/0/0");
    expect(keydata.bitcoinAddress).toEqual(
      "mz5vLWdM1wHVGSmXUkhKVvZbJ2g4epMXSm"
    );
  } finally {
    tr.close();
  }
}
