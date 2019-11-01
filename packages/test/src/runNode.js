import fs from "fs";
import TransportHid from "@ledgerhq/hw-transport-node-hid";
import {
  createTransportRecorder,
  RecordStore
} from "@ledgerhq/hw-transport-mocker";
import getSnapshotJSONFile from "./getSnapshotJSONFile";
import ensureBtcSnapshotAccount from "./ensureBtcSnapshotAccount";
import runTests from "./runTests";

const snapshotMode = process.argv[2] === "snapshot";

async function main() {
  if (!snapshotMode) {
    await runTests({
      getTransportClass: () => TransportHid
    });
  }

  const t = await TransportHid.create();
  ensureBtcSnapshotAccount(t);
  await t.close();
  await runTests({
    getTransportClass: () => {
      const recordStore = new RecordStore();
      return createTransportRecorder(TransportHid, recordStore);
    },
    afterTest: (step, Tr) => {
      fs.writeFileSync(
        getSnapshotJSONFile(step.name),
        Tr.recordStore.toString()
      );
    }
  });
}

main();
