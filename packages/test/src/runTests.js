import testBtc from "./testBtc";
import testBtc2 from "./testBtc2";
import testBtc3 from "./testBtc3";
import testBtc4 from "./testBtc4";
import testBtc5 from "./testBtc5";
import testEth from "./testEth";
import testEth2 from "./testEth2";
import testEth3 from "./testEth3";
import testEth4 from "./testEth4";
import testXrp from "./testXrp";
import testXrp2 from "./testXrp2";
import testXrp3 from "./testXrp3";
import testStr from "./testStr";
import testStr2 from "./testStr2";
import testStr3 from "./testStr3";

var tests = [
  // { name: "testBtc", run: testBtc },
  // { name: "testBtc2", run: testBtc2 },
  // { name: "testBtc3", run: testBtc3 },
  // { name: "testBtc4", run: testBtc4 },
  // { name: "testBtc5", run: testBtc5 },
  // {
  //   run: () =>
  //     new Promise(resolve => {
  //       var s = 15;
  //       console.info("You have " + s + " seconds to switch to eth app ...");
  //       var interval = setInterval(() => {
  //         if (--s) {
  //           console.log(s + " ...");
  //         } else {
  //           clearInterval(interval);
  //           resolve();
  //         }
  //       }, 1000);
  //     })
  // },
  // { name: "testEth", run: testEth },
  // { name: "testEth2", run: testEth2 },
  // { name: "testEth3", run: testEth3 },
  // { name: "testEth4", run: testEth4 },
  // {
  //   run: () =>
  //     new Promise(resolve => {
  //       var s = 15;
  //       console.info("You have " + s + " seconds to switch to xrp app ...");
  //       var interval = setInterval(() => {
  //         if (--s) {
  //           console.log(s + " ...");
  //         } else {
  //           clearInterval(interval);
  //           resolve();
  //         }
  //       }, 1000);
  //     })
  // },
  // { name: "testXrp", run: testXrp },
  // { name: "testXrp2", run: testXrp2 },
  // { name: "testXrp3", run: testXrp3 },
  // {
  //   run: () =>
  //     new Promise(resolve => {
  //       var s = 15;
  //       console.info("You have " + s + " seconds to switch to Stellar app ...");
  //       var interval = setInterval(() => {
  //         if (--s) {
  //           console.log(s + " ...");
  //         } else {
  //           clearInterval(interval);
  //           resolve();
  //         }
  //       }, 1000);
  //     })
  // },
  { name: "testStr", run: testStr },
  { name: "testStr2", run: testStr2 },
  { name: "testStr3", run: testStr3 }
];

export default async (Transport, timeout = 5000) => {
  const supported = await Transport.isSupported();
  if (!supported) {
    throw new Error("Transport.isSupported() is false");
  }
  async function getTransportViaList() {
    const descriptors = await Transport.list();
    if (descriptors.length === 0) throw "No device found";
    return await Transport.open(descriptors[0], timeout);
  }
  async function getTransportViaListen() {
    const descriptor = await new Promise((success, failure) => {
      let t;
      const subscription = Transport.listen({
        next: e => {
          if (e.type === "add") {
            subscription.unsubscribe();
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
    return await Transport.open(descriptor, timeout);
  }
  async function getTransportViaCreate() {
    return await Transport.create(timeout);
  }

  return tests.reduce(async (p, step, i) => {
    await p;
    // this will alternate between one of the 3 ways to create a transport
    const getTransport = [
      getTransportViaCreate,
      getTransportViaList,
      getTransportViaListen
    ][i % 3];
    let transport = await getTransport();
    transport.setDebugMode(true);

    if (step.name) {
      console.info("Running test " + step.name);
    }
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
