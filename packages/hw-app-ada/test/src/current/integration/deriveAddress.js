import { expect } from "chai";
import pathDerivations from "../../fixtures/pathDerivations";

import { getAda, pathToArray } from "../../utils";

const codeTooFarMessage = "Should not be so far";

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

      const result = await ada.deriveAddress(pathToArray(derivation.path));

      expect(result.address).to.equal(derivation.address);
    };

    await test("44'/1815'/1'/0/12'");
    await test("44'/1815'/1'/0/10'/1/2/3");
  });

  it("Should no permit invalid path", async () => {
    const test = async path => {
      try {
        await ada.deriveAddress(pathToArray(path));

        throw new Error(codeTooFarMessage);
      } catch (error) {
        expect(error.message).not.to.have.string(codeTooFarMessage);
      }
    };

    await test("44'/1815'/1'");
    await test("44'/1815'/1'/5/10'/1/2/3");
  });
});
