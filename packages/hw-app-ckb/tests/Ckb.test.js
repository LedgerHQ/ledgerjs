import {
  createTransportReplayer,
  RecordStore
} from "@ledgerhq/hw-transport-mocker";
import Ckb from "../src/Ckb";

test("ckb.getPublicKey", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
      => e040000011048002000011048000002c800001358000000080000000
      <= 4104d066dbe5603004dc4c83e27106b098f5e9b9b17b6bdec965810cd0921193b1c87206518153a0b44c7ae6b0be92a60d515d454e71ab27943bbb323273b8bdd46a9000
    `)
  );
  const transport = await Transport.open();
  const ckb = new ckb(transport);
  const result = await btc.getWalletPublicKey("m/44'/309'/0'/1/0");
});

test("ckb.getAppConfiguration", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
    => 8000000000
    <= 0001009000
    => 8009000000
    <= 0001009000
    `)
  );
  const transport = await Transport.open();
  const ckb = new Ckb(transport);
  var configuration = await ckb.getAppConfiguration();
  expect(result).toEqual({
    version: "0.0.0",
    hash: "0000000000000000000000000000000000000000"
  });
});

test("ckb.getWalletId", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
    => e04e00011d058000002c800000008000000000000000000000000006666f6f626172
    <= 00009000
    => e04e80000100
    <= 314402205eac720be544d3959a760d9bfd6a0e7c86d128fd1030038f06d85822608804e20220385d83273c9d03c469596292fb354b07d193034f83c2633a4c1f057838e12a5b9000
    `)
  );

  const transport = await Transport.open();

  const ckb = new Ckb(transport);

  const res = await ckb.signMessageNew(
    "44'/309'/0'/1/0",
    Buffer.from("foobar").toString("hex")
  );
});

test("ckb.signTransaction", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
    => e04e00011d058000002c800000008000000000000000000000000006666f6f626172
    <= 00009000
    => e04e80000100
    <= 314402205eac720be544d3959a760d9bfd6a0e7c86d128fd1030038f06d85822608804e20220385d83273c9d03c469596292fb354b07d193034f83c2633a4c1f057838e12a5b9000
    `)
  );

  const transport = await Transport.open();

  const ckb = new Ckb(transport);

  const res = await ckb.signTransaction(
    "44'/309'/0'/1/0",
    Buffer.from("foobar").toString("hex")
  );
});
