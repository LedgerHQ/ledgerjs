require("babel-polyfill");
const { listen } = require("@ledgerhq/logs");
const { default: TNodeHID } = require(".");

listen(log => console.log(log.type + ": " + log.message));

TNodeHID.create()
  .then(t => t.send(0xe0, 0x01, 0x00, 0x00))
  .then(
    res => {
      console.log(res);
      process.exit(0);
    },
    err => {
      console.error(err);
      process.exit(1);
    }
  );
