import { expect } from "chai";
import Joi from "joi";

import { getAda, validate } from "../utils";

describe("isConnected", async () => {
  let ada = {};

  beforeEach(async () => {
    ada = await getAda();
  });

  afterEach(async () => {
    await ada.t.close();
  });

  it('Should correctly get the semantic version of device', async () => {
    const schema = Joi.object().keys({
      major: Joi.number().integer().min(0).required(),
      minor: Joi.number().integer().min(0).required(),
      patch: Joi.number().integer().min(0).required(),
    });

    const response = await ada.isConnected();
    validate(response, schema);
  });
});
