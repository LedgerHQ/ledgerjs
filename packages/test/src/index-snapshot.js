
import fs from "fs";
import getSnapshotJSONFile from "./getSnapshotJSONFile";
import {
  createTransportReplayer,
  RecordStore
} from "@ledgerhq/hw-transport-mocker";
import runTests from "./runTests";

// test node hid
runTests({
  getTransportClass: step => {
    const stepName = step.name;
    const record = RecordStore.fromString(
      fs.readFileSync(getSnapshotJSONFile(stepName), "utf8")
    );
    return createTransportReplayer(record);
  },
  waitForAppSwitch: () => Promise.resolve()
}).then(
  () => {
    console.log("ALL PASS");
  },
  e => {
    console.error(e);
    process.exit(1);
  }
);
