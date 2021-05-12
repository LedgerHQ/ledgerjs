import {
  createTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Tezos from "../src/Tezos";

test("Tezos init", async () => {
  const Transport = createTransportReplayer(RecordStore.fromString(""));
  // @ts-expect-error
  const transport = await Transport.open();
  const xtz = new Tezos(transport);
  expect(xtz).not.toBe(undefined);
});
