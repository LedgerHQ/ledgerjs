import {
  createTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Polkadot from "../src/Polkadot";

test("Polkadot init", async () => {
  const Transport = createTransportReplayer(RecordStore.fromString(""));
  // @ts-expect-error
  const transport = await Transport.open();
  const dot = new Polkadot(transport);
  expect(dot).not.toBe(undefined);
});
