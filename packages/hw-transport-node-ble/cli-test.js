
const { listen } = require("@ledgerhq/logs");
const { default: TNodeBle } = require(".");

listen(log => console.log(log.type + ": " + log.message));

let transport;

TNodeBle.create()
  .then(t => {
    transport = t;
    return t.send(0xe0, 0x01, 0x00, 0x00);
  })
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

process.on("SIGINT", () => {
  if (!transport) {
    process.exit();
    return;
  }
  console.log("disconnecting...");
  TNodeBle.disconnect(transport.id).then(
    () => {
      process.exit();
    },
    e => {
      console.error(e);
      process.exit(1);
    }
  );
});
