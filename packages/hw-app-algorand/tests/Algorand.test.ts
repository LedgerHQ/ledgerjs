import {
  createTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Algorand from "../src/Algorand";

test("Algorand init", async () => {
  const Transport = createTransportReplayer(RecordStore.fromString(""));
  // @ts-expect-error
  const transport = await Transport.open();
  const algo = new Algorand(transport);
  expect(algo).not.toBe(undefined);
});
