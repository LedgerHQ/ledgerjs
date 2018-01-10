import "babel-polyfill";

import CommHid from "@ledgerhq/hw-comm-node-hid";
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
