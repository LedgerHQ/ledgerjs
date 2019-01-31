import { expect } from "chai";
import pathDerivations from "./__fixtures__/pathDerivations";

import { getAda, str_to_path } from "../utils";

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
        str_to_path(derivation.path)
      );

      expect(result.publicKeyHex).to.equal(derivation.publicKey);
      expect(result.chainCodeHex).to.equal(derivation.chainCode);
    };

    await test("44'/1815'/1'");
    await test("44'/1815'/1'/0/12'");
    await test("44'/1815'/1'/0/10'/1/2/3");
  });

  it("Should return the same public key with the same path consistently", async () => {
    const path = str_to_path("44'/1815'/1'");

    const res1 = await ada.getExtendedPublicKey(path);
    const res2 = await ada.getExtendedPublicKey(path);

    expect(res1.publicKeyHex).to.equal(res2.publicKeyHex);
    expect(res1.chainCodeHex).to.equal(res2.chainCodeHex);
  });

  it("Should reject path shorter than 3 indexes", async () => {
    const SHOULD_HAVE_THROWN = "should have thrown earlier";
    try {
      await ada.getExtendedPublicKey(str_to_path("44'/1815'"));

      throw new Error(SHOULD_HAVE_THROWN);
    } catch (error) {
      expect(error.message).not.to.have.string(SHOULD_HAVE_THROWN);
    }
  });
});
