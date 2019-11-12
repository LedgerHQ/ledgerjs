import fs from "fs";
import TransportHid from "@ledgerhq/hw-transport-node-hid";
import {
  createTransportRecorder,
  RecordStore
} from "@ledgerhq/hw-transport-mocker";
import { listen } from "@ledgerhq/logs";
import testXtz from "./testXtz";
import testXtz2 from "./testXtz2";
import testXtz3 from "./testXtz3";
import testXtz4 from "./testXtz4";

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
  expectAppContext("Tezos"),
  { name: "testXtz", run: testXtz },
  { name: "testXtz2", run: testXtz2 },
  { name: "testXtz3", run: testXtz3 },
  { name: "testXtz4", run: testXtz4 }
];

export default async opts => {
  const { getTransportClass, timeout, afterTest } = {
    timeout: 5000,
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
