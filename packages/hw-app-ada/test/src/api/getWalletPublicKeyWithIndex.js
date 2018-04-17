import { expect } from "chai";
import Joi from "joi";

import { getAda, validate, promptUser, ifHeadlessIt } from "../utils";

describe("getWalletPublicKeyWithIndex", async () => {
  let ada = {};

  const schema = Joi.object().keys({
    publicKey: Joi.string().regex(/^[a-zA-Z0-9]+$/).required(),
  });

  beforeEach(async () => {
    ada = await getAda();
  });

  afterEach(async () => {
    await ada.t.close();
  });

  it("Should successfully get public key", async () => {
    const index = 0xFFFFFFFF;

    promptUser("Please accept public key request");
    
    const response = await ada.getWalletPublicKeyWithIndex(index);
    validate(response, schema);

    const publicKey = Buffer.from(response.publicKey, "hex");
    expect(publicKey.length).to.equal(32);
  });
  
  it("Should return same public key with same index consistently", async () => {
    const index = 0xFEEDBEEF;
  
    promptUser("Please accept public key request");

    const response = await ada.getWalletPublicKeyWithIndex(index);
    validate(response, schema);
      
    promptUser("Please accept public key request");

    let res = await ada.getWalletPublicKeyWithIndex(index);
    expect(res.publicKey).to.equal(response.publicKey);

    promptUser("Please accept public key request");

    res = await ada.getWalletPublicKeyWithIndex(index);
    expect(res.publicKey).to.equal(response.publicKey);
  });

  it("Should successfully get public key for lowest hardened index (0x80000000)", async () => {
    const index = 0x80000000;

    promptUser("Please accept public key request");

    const response = await ada.getWalletPublicKeyWithIndex(index);
    validate(response, schema);
  });

  it("Should not get first non-hardened index (0x7FFFFFFF)", async () => {
    const index = 0x7FFFFFFF;

    promptUser("Please accept public key request");

    try {
      const response = await ada.getWalletPublicKeyWithIndex(index);
      throw new Error("Expected error");
    } catch (error) {
      expect(error.message).to.have.string("5201");
    }
  });

  it("Should reject invalid index", async () => {
    try {
      const response = await ada.getWalletPublicKeyWithIndex("44\"1815\"");
      throw new Error("Expected error");
    } catch (error) {
      expect(error.message).to.have.string("5003");
    }
  });

  ifHeadlessIt("Should get public key 20 times (stress test)", async () => {
    const index = 0xBABADADA;

    for (let i = 0; i < 20; i++) {
      const response = await ada.getWalletPublicKeyWithIndex(index);
      validate(response, schema);
    }
  });
});
