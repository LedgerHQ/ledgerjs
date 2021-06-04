
import {
    createTransportReplayer,
    RecordStore,
  } from "@ledgerhq/hw-transport-mocker";
  import Elrond from "../src/Elrond";
  
  test("Elrond init", async () => {
    const Transport = createTransportReplayer(RecordStore.fromString(""));
    const transport = await Transport.open();
    const egld = new Elrond(transport);
    expect(egld).not.toBe(undefined);
  });