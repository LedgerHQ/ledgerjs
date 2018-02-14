import "babel-polyfill";

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

const records = {};

async function main() {
  if (snapshotMode) {
    const t = await TransportHid.create();
    ensureBtcSnapshotAccount(t);
    await t.close();
  }

  await runTests(step => {
    if (!snapshotMode) return TransportHid;
    const recordStore = new RecordStore();
    if (step.name in records) {
      throw new Error("Test called '" + step.name + "' already exists.");
    }
    records[step.name] = recordStore;
    return createTransportRecorder(TransportHid, recordStore);
  }).then(
    () => {
      console.log("ALL PASS");
      if (snapshotMode) {
        console.log("recording snapshots...");
        const snapshots = {};
        for (let name in records) {
          snapshots[name] = records[name].toObject();
        }
        fs.writeFileSync(
          getSnapshotJSONFile(),
          JSON.stringify(snapshots, null, 2)
        );
        console.log("done.");
      }
    },
    e => {
      console.error(e);
      process.exit(1);
    }
  );
}

main();
