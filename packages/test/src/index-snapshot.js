import "babel-polyfill";
import fs from "fs";
import getSnapshotJSONFile from "./getSnapshotJSONFile";
import {
  createTransportReplayer,
  RecordStore
} from "@ledgerhq/hw-transport-mocker";
import runTests from "./runTests";

const snapshots = JSON.parse(fs.readFileSync(getSnapshotJSONFile(), "utf8"));

// test node hid
runTests(
  step => {
    const stepName = step.name;
    if (!(stepName in snapshots)) {
      throw new Error(
        "snapshot not found for '" +
          stepName +
          "'.\nPlease see packages/test/README.md intructions to record tests."
      );
    }
    return createTransportReplayer(RecordStore.fromObject(snapshots[stepName]));
  },
  undefined,
  () => Promise.resolve()
).then(
  () => {
    console.log("ALL PASS");
  },
  e => {
    console.error(e);
    process.exit(1);
  }
);
