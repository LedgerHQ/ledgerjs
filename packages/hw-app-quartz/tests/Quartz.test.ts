import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Quartz from "../src/Quartz";

test("Quartz init", async () => {
  const transport = await openTransportReplayer(RecordStore.fromString(""));
  const qtz = new Quartz(transport);
  expect(qtz).not.toBe(undefined);
});
