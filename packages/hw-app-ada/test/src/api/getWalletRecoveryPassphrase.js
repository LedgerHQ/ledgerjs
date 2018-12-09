import { expect } from "chai";
import Joi from "joi";

import { getAda, validate, promptUser, ifHeadlessIt } from "../utils";

describe("getWalletRecoveryPassphrase", async () => {
  let ada = {};

  const schema = Joi.object().keys({
    success: Joi.boolean(),
    publicKey: Joi.string().regex(/^[a-zA-Z0-9]+$/).required(),
    chainCode: Joi.string().regex(/^[a-zA-Z0-9]+$/).required(),
  });

  beforeEach(async () => {
    ada = await getAda();
  });

  afterEach(async () => {
    await ada.t.close();
  });
  
  it("Should successfully get public key and chain code", async () => {
      promptUser("Please accept public key request");

      const response = await ada.getWalletRecoveryPassphrase();

      validate(response, schema);

      const publicKey = Buffer.from(response.publicKey, "hex");
      const chainCode = Buffer.from(response.chainCode, "hex");
      expect(publicKey.length).to.equal(32);
      expect(chainCode.length).to.equal(32);
  });

  it("Should return same public key and chain code with 3 consecutive calls", async () => {
    promptUser("Please accept public key request");
    
    const response = await ada.getWalletRecoveryPassphrase();
    validate(response, schema);
        
    promptUser("Please accept public key request");

    let res = await ada.getWalletRecoveryPassphrase();
    expect(res.publicKey).to.equal(response.publicKey);
    expect(res.chainCode).to.equal(response.chainCode);
    
    promptUser("Please accept public key request");

    res = await ada.getWalletRecoveryPassphrase();
    expect(res.publicKey).to.equal(response.publicKey);
    expect(res.chainCode).to.equal(response.chainCode);
  });

  ifHeadlessIt("Should get public key and chain code 20 times (stress test)", async () => {
    for (let i = 0; i < 20; i++) {
      const response = await ada.getWalletRecoveryPassphrase()
      validate(response, schema);
    }
  });
});
