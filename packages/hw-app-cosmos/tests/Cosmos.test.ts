import {
  createTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Cosmos from "../src/Cosmos";

test("Comos init", async () => {
  const Transport = createTransportReplayer(RecordStore.fromString(""));
  // @ts-expect-error Todo: fix types for Transport creator
  const transport = await Transport.open();
  const cosmos = new Cosmos(transport);
  expect(cosmos).not.toBe(undefined);
});
