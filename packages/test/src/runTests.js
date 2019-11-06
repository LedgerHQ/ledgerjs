import { listen } from "@ledgerhq/logs";
import testBtc from "./testBtc";
import testBtc2 from "./testBtc2";
import testBtc3 from "./testBtc3";
import testBtc4 from "./testBtc4";
import testBtcSegMulti from "./testBtcSegMulti";
import testBtcSignP2SHSeg from "./testBtcSignP2SHSeg";
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

listen(e => {
  console.log(`${e.type}: ${e.message}`);
});

function expectAppContext(appName) {
  // TODO improve this by waiting user to do an action?
  return {
    expectAppContext: true,
    appName
  };
}

var tests = [
  expectAppContext("Bitcoin (btc)"),
  { name: "testBtc", run: testBtc },
  { name: "testBtc2", run: testBtc2 },
  { name: "testBtc3", run: testBtc3 },
  { name: "testBtc4", run: testBtc4 },
  { name: "testBtcSegMulti", run: testBtcSegMulti },
  { name: "testBtcSignP2SHSeg", run: testBtcSignP2SHSeg },
  expectAppContext("Ethereum (eth)"),
  { name: "testEth", run: testEth },
  { name: "testEth2", run: testEth2 },
  { name: "testEth3", run: testEth3 },
  { name: "testEth4", run: testEth4 },
  expectAppContext("Ripple (xrp)"),
  { name: "testXrp", run: testXrp },
  { name: "testXrp2", run: testXrp2 },
  { name: "testXrp3", run: testXrp3 },
  expectAppContext("Stellar"),
  { name: "testStr", run: testStr },
  { name: "testStr2", run: testStr2 },
  { name: "testStr3", run: testStr3 }
];

const defaultWaitForAppSwitch = step =>
  new Promise(resolve => {
    var s = 15;
    console.info(
      "You have " + s + " seconds to switch to " + step.appName + " app ..."
    );
    var interval = setInterval(() => {
      if (--s) {
        console.log(s + " ...");
      } else {
        clearInterval(interval);
        resolve();
      }
    }, 1000);
  });

export default async opts => {
  const { getTransportClass, timeout, waitForAppSwitch, afterTest } = {
    timeout: 5000,
    waitForAppSwitch: defaultWaitForAppSwitch,
    afterTest: (_s, _t) => {},
    ...opts
  };
  async function createTransportViaList(Transport) {
    const descriptors = await Transport.list();
    if (descriptors.length === 0) throw "No device found";
    return await Transport.open(descriptors[0], timeout);
  }
  async function createTransportViaListen(Transport) {
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
  async function createTransportViaCreate(Transport) {
    return await Transport.create(timeout);
  }

  return tests.reduce(async (p, step, i) => {
    await p;
    if (step.expectAppContext) {
      await waitForAppSwitch(step);
      return;
    }
    const Transport = getTransportClass(step);
    const supported = await Transport.isSupported();
    if (!supported) {
      throw new Error("Transport.isSupported() is false");
    }
    // this will alternate between one of the 3 ways to create a transport
    const createTransport = [
      createTransportViaCreate,
      createTransportViaList,
      createTransportViaListen
    ][i % 3];
    let transport = await createTransport(Transport);

    if (step.name) {
      console.info("Running test " + step.name);
    }
    try {
      const result = await step.run(transport);
      if (result) {
        console.log(result);
      }
      await transport.close();
      afterTest(step, Transport);
    } catch (err) {
      await transport.close();
      console.error("Failed test " + step.name + ":", err);
      throw err;
    }
  }, Promise.resolve());
};
