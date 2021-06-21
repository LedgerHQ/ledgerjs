import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Elrond from "../src/Elrond";

test("Elrond init", async () => {
  const transport = await openTransportReplayer(RecordStore.fromString(""));
  const egld = new Elrond(transport);
  expect(egld).not.toBe(undefined);
});

test("getAppConfiguration", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
    => ed02000000
    <= 000300019000
    `)
  );

  const egld = new Elrond(transport);
  const result = await egld.getAppConfiguration();

  expect(result).not.toBe(undefined);
});

test("getAddress", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
    => ed030000088000000080000000
    <= 000300019000
    `)
  );
  const egld = new Elrond(transport);
  const result = await egld.getAddress("44'/508'/0'/0'/0'");

  expect(result).not.toBe(undefined);
});
