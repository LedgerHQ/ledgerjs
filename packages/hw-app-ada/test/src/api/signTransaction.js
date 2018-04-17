import { expect } from "chai";
import Joi from "joi";

import { getAda, validate, promptUser, ifHeadlessIt } from "../utils";

describe("signTransaction", async () => {
  let ada = {};
  
  const schema = Joi.object().keys({
    digest: Joi.string().regex(/^[a-zA-Z0-9]+$/).required(),
  });

  beforeEach(async () => {
    ada = await getAda();
  });

  afterEach(async () => {
    await ada.t.close();
  });
  
  it("Should correctly sign a transaction with 1 output", async () => {
    const tx = "839F8200D8185826825820E981442C2BE40475BB42193CA35907861D90715854DE6FCBA767B98F1789B51219439AFF9F8282D818584A83581CE7FE8E468D2249F18CD7BF9AEC0D4374B7D3E18609EDE8589F82F7F0A20058208200581C240596B9B63FC010C06FBE92CF6F820587406534795958C411E662DC014443C0688E001A6768CC861B0037699E3EA6D064FFA0";

    promptUser("Please accept transaction");
    const response = await ada.signTransaction(tx, [0xFFFFFFFF]);

    validate(response[0], schema);
  });
  
  it("Should correctly sign a transaction with 2 outputs", async () => {
    const tx = "839f8200d81858268258204806bbdfa6bbbfea0443ab6c301f6d7d04442f0a146877f654c08da092af3dd8193c508200d818582682582060fc8fbdd6ff6c3b455d8a5b9f86d33f4137c45ece43abb86e04671254e12c08197a8bff9f8282d818585583581ce6e37d78f4326709af13851862e075bce800d06401ad5c370d4d48e8a20058208200581c23f1de5619369c763e19835e0cb62c255c3fca80aa13057a1760e804014f4e4ced4aa010522e84b8e70a121894001ae41ef3231b000000d16b11cb538282d818585f83581cfd9104b3efb4c7425d697eeb3efc723ef4ff469e7f37f41a5aff78a9a20058208200581c53345e24a7a30ec701611c7e9d0593c41d6ea335b2eb195c9a0d2238015818578b485adc9d142b1e692de1fd5929acfc5a31332938f192011ad0fcdc751b002aa1f087327872ffa0";

    promptUser("Please accept transaction");
    const response = await ada.signTransaction(tx, [0xF00DB00B, 0x8BADF00D]);
      
    validate(response[0], schema);
  });

  it("Should reject signing a transaction with non-hardened index", async () => {
    const tx = "839F8200D8185826825820E981442C2BE40475BB42193CA35907861D90715854DE6FCBA767B98F1789B51219439AFF9F8282D818584A83581CE7FE8E468D2249F18CD7BF9AEC0D4374B7D3E18609EDE8589F82F7F0A20058208200581C240596B9B63FC010C06FBE92CF6F820587406534795958C411E662DC014443C0688E001A6768CC861B0037699E3EA6D064FFA0";

    promptUser("Please accept transaction");
    
    try {
      const response = await ada.signTransaction(tx, [0x34565544]);
      throw new Error("Expected error");
    } catch (error) {
      expect(error.message).to.have.string("5201");
    }
    
    try {
      await ada.setTransaction(tx);
    } catch (error) {
      // Reset here so we don't end up stuck for further tests
    }
  });

  it("Should reject signing a transaction with index greater than maximum ", async () => {
    const tx = "839F8200D8185826825820E981442C2BE40475BB42193CA35907861D90715854DE6FCBA767B98F1789B51219439AFF9F8282D818584A83581CE7FE8E468D2249F18CD7BF9AEC0D4374B7D3E18609EDE8589F82F7F0A20058208200581C240596B9B63FC010C06FBE92CF6F820587406534795958C411E662DC014443C0688E001A6768CC861B0037699E3EA6D064FFA0";

    promptUser("Please accept transaction");
    
    try {
      const response = await ada.signTransaction(tx, [0xFFFFFFFF01]);
      throw new Error("Expected error");
    } catch (error) {
      expect(error.message).to.have.string("5302");
    }

    try {   
      await ada.setTransaction(tx);
    } catch (error) {
      // Reset here so we don't end up stuck for further tests
    }
  });

  it("Should prevent signing a single transaction multiple times", async () => {
    const tx = "839F8200D8185826825820E981442C2BE40475BB42193CA35907861D90715854DE6FCBA767B98F1789B51219439AFF9F8282D818584A83581CE7FE8E468D2249F18CD7BF9AEC0D4374B7D3E18609EDE8589F82F7F0A20058208200581C240596B9B63FC010C06FBE92CF6F820587406534795958C411E662DC014443C0688E001A6768CC861B0037699E3EA6D064FFA0";

    promptUser("Please accept transaction");

    try {
      const response = await ada.signTransaction(tx, [0xBAD15C05, 0xCAFEBABE]);
      throw new Error("Expected error");
    } catch (error) {
      expect(error.message).to.have.string("500e");
    }
  });

  it("Should prevent signing a transaction with a non-hardened index (< 0x80000000)", async () => {
    const tx = "839F8200D8185826825820E981442C2BE40475BB42193CA35907861D90715854DE6FCBA767B98F1789B51219439AFF9F8282D818584A83581CE7FE8E468D2249F18CD7BF9AEC0D4374B7D3E18609EDE8589F82F7F0A20058208200581C240596B9B63FC010C06FBE92CF6F820587406534795958C411E662DC014443C0688E001A6768CC861B0037699E3EA6D064FFA0";

    promptUser("Please accept transaction");
    
    try {
      const response = await ada.signTransaction(tx, [0x7FFFFFFF]);
      throw new Error("Expected error");
    } catch (error) {
      expect(error.message).to.have.string("5201");
    }
    
    try {   
      await ada.setTransaction(tx);
    } catch (error) {
      // Reset here so we don't end up stuck for further tests.
    }
  });

  ifHeadlessIt("Should sign transaction 20 times (stress test)", async () => {
    const tx = "839F8200D8185826825820E981442C2BE40475BB42193CA35907861D90715854DE6FCBA767B98F1789B51219439AFF9F8282D818584A83581CE7FE8E468D2249F18CD7BF9AEC0D4374B7D3E18609EDE8589F82F7F0A20058208200581C240596B9B63FC010C06FBE92CF6F820587406534795958C411E662DC014443C0688E001A6768CC861B0037699E3EA6D064FFA0";

    for (let i = 0; i < 20; i++) {
      const response = await ada.signTransaction(tx, [0xFFFFFFFF]);
      validate(response[0], schema);
    }
  });
});
