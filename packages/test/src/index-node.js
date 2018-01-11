import CommHid from "@ledgerhq/hw-transport-node-hid";
import runTests from "./runTests";

// test node hid
runTests(CommHid).then(
  () => {
    console.log("ALL PASS");
  },
  e => {
    console.error(e);
    process.exit(1);
  }
);
