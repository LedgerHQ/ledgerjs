import testBtc from "./testBtc";
import testBtc2 from "./testBtc2";
import testBtc3 from "./testBtc3";
import testBtc4 from "./testBtc4";
import testEth from "./testEth";
import testEth2 from "./testEth2";
import testEth3 from "./testEth3";
import testEth4 from "./testEth4";

var tests = [
  { name: "testBtc", run: testBtc },
  { name: "testBtc2", run: testBtc2 },
  { name: "testBtc3", run: testBtc3 },
  { name: "testBtc4", run: testBtc4 },
  {
    run: () =>
      new Promise(resolve => {
        var s = 15;
        console.info("You have " + s + " seconds to switch to eth app ...");
        var interval = setInterval(() => {
          if (--s) {
            console.log(s + " ...");
          } else {
            clearInterval(interval);
            resolve();
          }
        }, 1000);
      })
  },
  { name: "testEth", run: testEth },
  { name: "testEth2", run: testEth2 },
  { name: "testEth3", run: testEth3 },
  { name: "testEth4", run: testEth4 }
];

export default (Transport, timeout = 5000) => {
  async function getDescriptorViaList() {
    const descriptors = await Transport.list();
    if (descriptors.length === 0) throw "No device found";
    return descriptors[0];
  }
  function getDescriptorViaListen() {
    return new Promise((success, failure) => {
      let t;
      const subscription = Transport.listen({
        next: e => {
          if (e.type === "add") {
            success(e.descriptor);
            clearTimeout(t);
          }
        },
        error: error => {
          failure(error);
          clearTimeout(t);
        },
        complete: () => {
          failure("terminated too early");
          clearTimeout(t);
        }
      });
      t = setTimeout(() => {
        subscription.unsubscribe();
        failure("timeout");
      }, timeout);
    });
  }

  return tests.reduce(async (p, step, i) => {
    await p;
    const getDescriptor =
      i % 2 === 0 ? getDescriptorViaList : getDescriptorViaListen;
    if (step.name) {
      console.info("Running test " + step.name);
    }
    const descriptor = await getDescriptor();
    const transport = await Transport.open(descriptor, timeout);
    transport.setDebugMode(true);
    try {
      const result = await step.run(transport);
      if (result) {
        console.log(result);
      }
    } catch (err) {
      console.error("Failed test " + step.name + ":", err);
      throw err;
    } finally {
      transport.close();
    }
  }, Promise.resolve());
};
