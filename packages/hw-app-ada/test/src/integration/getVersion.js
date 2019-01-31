import { getAda } from "../utils";
import { expect } from "chai";

describe("getVersion", async () => {
  let ada = {};

  beforeEach(async () => {
    ada = await getAda();
  });

  afterEach(async () => {
    await ada.t.close();
  });

  it("Should correctly get the semantic version of device", async () => {
    const response = await ada.getVersion();
    expect(response.major).to.equal(1);
    expect(response.minor).to.equal(0);
  });
});
