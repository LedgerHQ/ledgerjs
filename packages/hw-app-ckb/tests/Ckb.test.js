import {
  createTransportReplayer,
  RecordStore
} from "@ledgerhq/hw-transport-mocker";
import Ckb from "../src/Ckb";

test("ckb.getPublicKey", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
      => 8002000015058000002c80000135800000000000000100000000
      <= 4104d066dbe5603004dc4c83e27106b098f5e9b9b17b6bdec965810cd0921193b1c87206518153a0b44c7ae6b0be92a60d515d454e71ab27943bbb323273b8bdd46a9000
    `)
  );
  const transport = await Transport.open();
  const ckb = new Ckb(transport);
  const result = await ckb.getWalletPublicKey("m/44'/309'/0'/1/0");
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
  expect(configuration).toEqual({
    version: "0.1.0",
    hash: "0001009000",
  });
});

test("ckb.getWalletId", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
    => 8001000000
    <= 27fe5acb022cd7b8be0eb7009d42ff4600c597d28b6affefcab6f7396d1311c2f58fc334be619099b733be1da93f26b674bd08d110b39f6d39b6cf6aa01618a59000
    `)
  );

  const transport = await Transport.open();

  const ckb = new Ckb(transport);

  const result = await ckb.getWalletId();
  expect(result).toEqual("27fe5acb022cd7b8be0eb7009d42ff4600c597d28b6affefcab6f7396d1311c2");
});

test("ckb.signTransaction", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
    => 8003000015058000002c80000135800000000000000100000000
    <= 00009000
    => 80038100e60030303030303030303030303030303030303030303030303030303030303030303030303030303030000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
    <= 314402205eac720be544d3959a760d9bfd6a0e7c86d128fd1030038f06d85822608804e20220385d83273c9d03c469596292fb354b07d193034f83c2633a4c1f057838e12a5b9000
    `)
  );

  const transport = await Transport.open();

  const ckb = new Ckb(transport);

  const result = await ckb.signTransaction(
    "44'/309'/0'/1/0",
    Buffer.from("8000002c80000135800000000000000100000000").toString("hex")
  );

  expect(result).toEqual("314402205eac720be544d3959a760d9bfd6a0e7c86d128fd1030038f06d85822608804e20220385d83273c9d03c469596292fb354b07d193034f83c2633a4c1f057838e12a5b9000");
});
