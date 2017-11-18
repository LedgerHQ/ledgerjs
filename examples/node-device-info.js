const ledger = require("..");
ledger.comm_node
  .create_async()
  .then(function(comm) {
    console.log(comm.device.getDeviceInfo());
  })
  .catch(function(reason) {
    console.log("An error occured: ", reason);
  });
