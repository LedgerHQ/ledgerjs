import { expect } from "chai";
import pathDerivations from "./__fixtures__/pathDerivations";

import { getAda, str_to_path } from "../utils";

describe("deriveAddress", async () => {
  let ada = {};

  beforeEach(async () => {
    ada = await getAda();
  });

  afterEach(async () => {
    await ada.t.close();
  });

  it("Should succesfuly derive address", async () => {
    const test = async path => {
      const derivation = pathDerivations[path];

      const result = await ada.deriveAddress(str_to_path(derivation.path));

      expect(result.address58).to.equal(derivation.address);
    };

    await test("44'/1815'/1'/0/12'");
    await test("44'/1815'/1'/0/10'/1/2/3");
  });

  it("Should no permit invalid path", async () => {
    const test = async path => {
      const SHOULD_HAVE_THROWN = "should have thrown earlier";
      try {
        await ada.deriveAddress(str_to_path(path));

        throw new Error(SHOULD_HAVE_THROWN);
      } catch (error) {
        expect(error.message).not.to.have.string(SHOULD_HAVE_THROWN);
      }
    };

    await test("44'/1815'/1'");
    await test("44'/1815'/1'/5/10'/1/2/3");
  });
});
