
const { listen } = require("@ledgerhq/logs");
const { default: TNodeHID } = require(".");

listen(log => console.log(log.type + ": " + log.message));

setInterval(() => {
  TNodeHID.create()
    .then(t => t.send(0xe0, 0x01, 0x00, 0x00))
    .then(
      res => {
        console.log(res);
      },
      err => {
        console.error(err);
      }
    );
}, 10000);
