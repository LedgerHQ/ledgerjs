import { expect } from "chai";
import Int64 from "node-int64";
import Joi from "joi";

import { getAda, promptUser, ifNotHeadlessIt } from "../utils";

describe("setTransaction", async () => {
  let ada = {};

  beforeEach(async () => {
    ada = await getAda();
  });

  afterEach(async () => {
    await ada.t.close();
  });
  
  it("Should correctly set a transaction with 1 output", async () => {
    const tx = "839F8200D8185826825820E981442C2BE40475BB42193CA35907861D90715854DE6FCBA767B98F1789B51219439AFF9F8282D818584A83581CE7FE8E468D2249F18CD7BF9AEC0D4374B7D3E18609EDE8589F82F7F0A20058208200581C240596B9B63FC010C06FBE92CF6F820587406534795958C411E662DC014443C0688E001A6768CC861B0037699E3EA6D064FFA0";
    
    promptUser("Please accept transaction");
    const response = await ada.setTransaction(tx);
      
    const amount = new Int64(15597252095955044);
    const address = "AL91N9VXRTCypFouG2KjJvJuvKmUC4p3XcpHnYETWRG5HJVpi2ixeN1nG5EWtbJCH71YjzhqHKcsmmPYGRjy8nHDe2i17BEf9hTqDDLmcFVbHxx1GW9";

    expect(response.inputs).to.equal(1);
    expect(response.outputs).to.equal(1);
    expect(response.txs[0].address).to.equal(`${address.slice(0,5)}...${address.slice(address.length-5, address.length-1)}`);
    expect(response.txs[0].amount).to.equal(amount.toOctetString());
   
    try {
      await ada.setTransaction(tx);
    } catch (error) {
      // This generates an error, but clears the previous set
      // so we use it to ensure we can run consecutive tests.
    }
  });

  it("Should correctly set a transaction with 2 outputs", async () => {
    const tx = "839f8200d81858268258204806bbdfa6bbbfea0443ab6c301f6d7d04442f0a146877f654c08da092af3dd8193c508200d818582682582060fc8fbdd6ff6c3b455d8a5b9f86d33f4137c45ece43abb86e04671254e12c08197a8bff9f8282d818585583581ce6e37d78f4326709af13851862e075bce800d06401ad5c370d4d48e8a20058208200581c23f1de5619369c763e19835e0cb62c255c3fca80aa13057a1760e804014f4e4ced4aa010522e84b8e70a121894001ae41ef3231b000000d16b11cb538282d818585f83581cfd9104b3efb4c7425d697eeb3efc723ef4ff469e7f37f41a5aff78a9a20058208200581c53345e24a7a30ec701611c7e9d0593c41d6ea335b2eb195c9a0d2238015818578b485adc9d142b1e692de1fd5929acfc5a31332938f192011ad0fcdc751b002aa1f087327872ffa0";

    promptUser("Please accept transaction");

    const response = await ada.setTransaction(tx);
    const tx0Amount = new Int64(899444493139);
    const tx1Amount = new Int64(12000003454302322);
    const tx0Address = "BDHJBaaLRuJoaXR7USuHDyFgoBWnaaaA88EMu8aH9wcR9BB4XmgAtmVfZNvNThsnXdgNwr1MaLG1AaBu9riCZaTMaBnoGzshgs7CHi4P3YKqBFioMne92Ym4LgLG9wDuiA";
    const tx1Address = "3XsWSbV7z5bxQVv3YScPKuv6AQbNswgu4phHXmqcnQDnt9QC1WkrnvHsLkRxQVcPE78iXVUymMhYx72EL9jDFfvjhrerXQqc2Y31ab5pLhhfWcfbKwQNXzmdcZZuFR6cJecqSvjeVSU3pG4L";

    expect(response.inputs).to.equal(2);
    expect(response.outputs).to.equal(2);
    expect(response.txs[0].amount).to.equal(tx0Amount.toOctetString());
    expect(response.txs[1].amount).to.equal(tx1Amount.toOctetString());
    expect(response.txs[0].address).to.equal(`${tx0Address.slice(0,5)}...${tx0Address.slice(tx0Address.length-5, tx0Address.length-1)}`);
    expect(response.txs[1].address).to.equal(`${tx1Address.slice(0,5)}...${tx1Address.slice(tx1Address.length-5, tx1Address.length-1)}`);

    try {
      await ada.setTransaction(tx);
    } catch (error) {
      // This generates an error, but clears the previous set
      // so we use it to ensure we can run consecutive tests.
    }
  });

  it("Should prevent multiple setTransaction calls in a row", async () => {
    const tx = "839F8200D8185826825820E981442C2BE40475BB42193CA35907861D90715854DE6FCBA767B98F1789B51219439AFF9F8282D818584A83581CE7FE8E468D2249F18CD7BF9AEC0D4374B7D3E18609EDE8589F82F7F0A20058208200581C240596B9B63FC010C06FBE92CF6F820587406534795958C411E662DC014443C0688E001A6768CC861B0037699E3EA6D064FFA0";

    promptUser("Please accept transaction");
    await ada.setTransaction(tx);

    try {
      const response = await ada.setTransaction(tx);
      throw new Error("Expected error");
    } catch (error) {
      expect(error.message).to.have.string("500f");
    }
  });

  it("Should not set an invalid transaction", async () => {
    const tx = new Array(207).join("8");

    try {
      const response = await ada.setTransaction(tx);
      throw new Error("Device set invalid transaction");
    } catch (error) {
       expect(error.message).to.have.string("5902");
    }
  });

  it("Should reject a transaction > 1024 bytes", async () => {
    const tx = "839f8200d81858268258204806bbdfa6bbbfea0443ab6c301f6d7d04442f0a146877f654c08da092af3dd8193c508200d818582682582060fc8fbdd6ff6c3b455d8a5b9f86d33f4137c45ece43abb86e04671254e12c08197a8bff9f8282d818585583581ce6e37d78f4326709af13851862e075bce800d06401ad5c370d4d48e8a20058208200581c23f1de5619369c763e19835e0cb62c255c3fca80aa13057a1760e804014f4e4ced4aa010522e84b8e70a121894001ae41ef3231b0075fae341e487158282d818585f83581cfd9104b3efb4c7425d697eeb3efc723ef4ff469e7f37f41a5aff78a9a20058208200581c53345e24a7a30ec701611c7e9d0593c41d6ea335b2eb195c9a0d2238015818578b485adc9d142b1e692de1fd5929acfc5a31332938f192011ad0fcdc751b0003d8257c6b4db7ffa0839f8200d81858268258204806bbdfa6bbbfea0443ab6c301f6d7d04442f0a146877f654c08da092af3dd8193c508200d818582682582060fc8fbdd6ff6c3b455d8a5b9f86d33f4137c45ece43abb86e04671254e12c08197a8bff9f8282d818585583581ce6e37d78f4326709af13851862e075bce800d06401ad5c370d4d48e8a20058208200581c23f1de5619369c763e19835e0cb62c255c3fca80aa13057a1760e804014f4e4ced4aa010522e84b8e70a121894001ae41ef3231b0075fae341e487158282d818585f83581cfd9104b3efb4c7425d697eeb3efc723ef4ff469e7f37f41a5aff78a9a20058208200581c53345e24a7a30ec701611c7e9d0593c41d6ea335b2eb195c9a0d2238015818578b485adc9d142b1e692de1fd5929acfc5a31332938f192011ad0fcdc751b0003d8257c6b4db7ffa0839f8200d81858268258204806bbdfa6bbbfea0443ab6c301f6d7d04442f0a146877f654c08da092af3dd8193c508200d818582682582060fc8fbdd6ff6c3b455d8a5b9f86d33f4137c45ece43abb86e04671254e12c08197a8bff9f8282d818585583581ce6e37d78f4326709af13851862e075bce800d06401ad5c370d4d48e8a20058208200581c23f1de5619369c763e19835e0cb62c255c3fca80aa13057a1760e804014f4e4ced4aa010522e84b8e70a121894001ae41ef3231b0075fae341e487158282d818585f83581cfd9104b3efb4c7425d697eeb3efc723ef4ff469e7f37f41a5aff78a9a20058208200581c53345e24a7a30ec701611c7e9d0593c41d6ea335b2eb195c9a0d2238015818578b485adc9d142b1e692de1fd5929acfc5a31332938f192011ad0fcdc751b0003d8257c6b4db7ffa0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a00a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a";

    try {
      const response = await ada.setTransaction(tx);
      throw new Error("Expected error");
    } catch (error) {
       expect(error.message).to.have.string("5001");
    }
  });

  it("Should not set an empty transaction", async () => {
    try {
      const response = await ada.setTransaction();
      throw new Error("Expected error");
    } catch (error) {
       // we're cool.
    }
  });

  it("Should not set an incomplete transaction", async () => {
    const tx = "839f8200d";

    try {
      const response = await ada.setTransaction(tx);
      throw new Error("Expected error");
    } catch (error) {
       // we're cool.
    }
  });

  ifNotHeadlessIt("Should allow a user to cancel a transaction", async () => {
    const tx = "839F8200D8185826825820E981442C2BE40475BB42193CA35907861D90715854DE6FCBA767B98F1789B51219439AFF9F8282D818584A83581CE7FE8E468D2249F18CD7BF9AEC0D4374B7D3E18609EDE8589F82F7F0A20058208200581C240596B9B63FC010C06FBE92CF6F820587406534795958C411E662DC014443C0688E001A6768CC861B0037699E3EA6D064FFA0";

    promptUser("Please *reject* transaction");

    try {
      const response = await ada.setTransaction(tx);
      throw new Error("Expected error");
    } catch (error) {
       expect(error.message).to.have.string("9001");
    }
  });
});
