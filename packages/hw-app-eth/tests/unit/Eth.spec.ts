import chai, { expect, AssertionError } from "chai";
import Transport from "@ledgerhq/hw-transport";
import ChaiSpies from "chai-spies";
import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Eth from "../../src/Eth";

chai.use(ChaiSpies);

describe("Eth Class", () => {
  describe("contructor", () => {
    let trans;

    before(() => {
      trans = new Transport();
    });

    afterEach(() => {
      chai.spy.restore();
    });

    /** @TODO IMPROVEMENTS API - 1. */
    it.skip("should throw without a transport", () => {
      // @ts-ignore
      expect(new Eth(null, "test")).to.throw();
    });

    it("should give transport a default scambleKey", () => {
      const spy: ChaiSpies.Spy = chai.spy.on(trans, "decorateAppAPIMethod");
      new Eth(trans);

      expect(spy).to.be.called.with("w0w");
    });

    it("should give transport the param scambleKey", () => {
      const spy: ChaiSpies.Spy = chai.spy.on(trans, "decorateAppAPIMethod");
      new Eth(trans, "test");

      expect(spy).to.be.called.with("test");
    });
  });

  describe("loadConfig/setLoadConfig", () => {
    let trans;

    before(() => {
      trans = new Transport();
    });

    it("should load a config from constructor params", () => {
      const instance = new Eth(trans, "test", {
        nftExplorerBaseURL: "1",
        pluginBaseURL: "2",
        extraPlugins: "3",
      });

      expect(instance).to.have.property("loadConfig");
      // ⚠️ this will fail if you have any other key in the loadConfig than those ones
      expect(instance.loadConfig).to.have.all.keys([
        "nftExplorerBaseURL",
        "pluginBaseURL",
        "extraPlugins",
      ]);
    });

    it("should have default object as loadConfig as constructor param fallback", () => {
      const instance = new Eth(trans, "test");

      expect(instance).to.have.property("loadConfig");
      expect(instance.loadConfig).to.be.an("object").and.to.be.empty;
    });

    it("should be possible to change loadConfig after instantiation", () => {
      const instance = new Eth(trans, "test");

      expect(instance).to.have.property("loadConfig");
      expect(instance.loadConfig).to.be.an("object").and.to.be.empty;

      instance.setLoadConfig({
        nftExplorerBaseURL: "1",
        pluginBaseURL: "2",
        extraPlugins: "3",
      });

      // ⚠️ this will fail if you have any other key in the loadConfig than those ones
      expect(instance.loadConfig).to.have.all.keys([
        "nftExplorerBaseURL",
        "pluginBaseURL",
        "extraPlugins",
      ]);
    });
  });

  describe("getAddress", () => {
    let trans;
    let instance;

    before(() => {
      trans = new Transport();
      instance = new Eth(trans);
    });

    /** @TODO IMPROVEMENTS API - 2. */
    describe.skip("params", () => {
      it("should throw without path", async () => {
        try {
          await instance.getAddress();
          expect.fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          // FIXME this should be a specific error
          expect(e).to.not.be.an.instanceOf(Error);
          expect(e).to.have.property(
            "message",
            "Parameter 'path' is not a string"
          );
        }
      });

      it("should throw with a falsy path", async () => {
        try {
          await instance.getAddress("");
          expect.fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          // FIXME this should be a specific error
          expect(e).to.not.be.an.instanceOf(Error);
          expect(e).to.have.property(
            "message",
            "Parameter 'path' is not a string"
          );
        }
      });
    });

    describe("splitPath", async () => {
      // before(() => {
      //   trans.sendBackup = trans.send;
      //   const sendResponseExplanation = {
      //     keyLength: "2",

      //   }
      //   trans.send = Promise.resolve("11");
      // })

      it("should", async () => {
        const transport = await openTransportReplayer(
          RecordStore.fromString(`
          => e002000015058000002c8000003c800000008000000000000000
          <= 4104df00ad3869baad7ce54f4d560ba7f268d542df8f2679a5898d78a690c3db8f9833d2973671cb14b088e91bdf7c0ab00029a576473c0e12f84d252e630bb3809b28436241393833363265313939633431453138363444303932334146393634366433413634383435319000
          `)
        );
        const eth = new Eth(transport);
        const result = await eth.getAddress("44'/60'/0'/0'/0");

        expect(result).to.eq({
          address: "0xCbA98362e199c41E1864D0923AF9646d3A648451",
          publicKey:
            "04df00ad3869baad7ce54f4d560ba7f268d542df8f2679a5898d78a690c3db8f9833d2973671cb14b088e91bdf7c0ab00029a576473c0e12f84d252e630bb3809b",
        });
      });
    });
  });
});
