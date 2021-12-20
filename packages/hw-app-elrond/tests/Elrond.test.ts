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

test("provideESDTInfo", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
      => ed02000000
      <= 000300019000
      `)
  );
  const egld = new Elrond(transport);
  const result = await egld.provideESDTInfo("MEX", "4d45582d343535633537", 18, '1', '3044022076b7216cc07b827d5dec0468db31d9393b0028dcd5c81bcdc4f5371e0386061f022013f51d51c1421fbf67771a1edc1f607d750cf366392c5c09216fecb61e350f73');

  expect(result).not.toBe(undefined);
});
