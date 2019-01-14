import { expect } from "chai";
import pathDerivations from "../../fixtures/pathDerivations";

import { getAda, pathToArray } from "../../utils";

const shouldHaveThrownEarlier = "should have thrown before this line";

describe("getExtendedPublicKey", async () => {
  let ada = {};

  beforeEach(async () => {
    ada = await getAda();
  });

  afterEach(async () => {
    await ada.t.close();
  });

  it("Should successfully get extended public key", async () => {
    const test = async path => {
      const derivation = pathDerivations[path];

      const result = await ada.getExtendedPublicKey(
        pathToArray(derivation.path)
      );

      expect(result.publicKey).to.equal(derivation.publicKey);
      expect(result.chainCode).to.equal(derivation.chainCode);
    };

    await test("44'/1815'/1'");
    await test("44'/1815'/1'/0/12'");
    await test("44'/1815'/1'/0/10'/1/2/3");
  });

  it("Should return the same public key with the same path consistently", async () => {
    const path = pathToArray("44'/1815'/1'");

    const res1 = await ada.getExtendedPublicKey(path);
    const res2 = await ada.getExtendedPublicKey(path);

    expect(res1.publicKey).to.equal(res2.publicKey);
    expect(res1.chainCode).to.equal(res2.chainCode);
  });

  it("Should reject path with non-number element", async () => {
    try {
      await ada.getExtendedPublicKey([
        ...pathToArray("44'/1815'/55'"),
        "non-number"
      ]);

      throw new Error(shouldHaveThrownEarlier);
    } catch (error) {
      expect(error.message).to.have.string("5003");
    }
  });

  it("Should reject path not starting with 44'/1815'/n'", async () => {
    try {
      await ada.getExtendedPublicKey(pathToArray("44'/1815'/33/125"));

      throw new Error(shouldHaveThrownEarlier);
    } catch (error) {
      expect(error.message).to.have.string("5001");
    }
  });

  it("Should reject path shorter than 3 indexes", async () => {
    try {
      await ada.getExtendedPublicKey(pathToArray("44'/1815'"));

      throw new Error(shouldHaveThrownEarlier);
    } catch (error) {
      expect(error.message).to.have.string("5002");
    }
  });
});
