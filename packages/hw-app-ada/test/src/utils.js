import Joi from "joi";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import { expect } from "chai";
import { yellow } from "chalk";

import Ada from "./TestAda";

export function isHeadless() {
  return process.argv.includes("--headless");
}

/**
 * Run a mocha test only if the build is headless.
 *
 * This is useful for stress tests which are too laborious to run with user interaction.
 */
export function ifHeadlessIt(title, test) {
  return isHeadless() ? it(title, test) : it.skip(`[SKIPPED: NOT IN HEADLESS] ${title}`, () => {});
}

/**
 * Run a mocha test only if the build is not headless.
 *
 * This is useful for tests which always require interaction.
 */
export function ifNotHeadlessIt(title, test) {
  return isHeadless() ? it.skip(`[SKIPPED: RUNNING HEADLESSLY] ${title}`, () => {}) : it(title, test);
}

/**
 * Convenience function for retrieving the Ada instance.
 *
 * @returns {Promise<Object>} A promise that contains the Ada instance when fulfilled.
 */
export async function getAda() {
  const transport = await TransportNodeHid.create(1000);

  return Promise.resolve(new Ada(transport));
}

/**
 * Convenience function for prompting user to interact with ledger device.
 *
 * @param {String} message The messsage to display.
 *
 * If --headless is supplied, then this is suppressed.
 */
export function promptUser(message) {
  if (isHeadless()) return
  console.log(yellow.bgBlack("\n LEDGER DEVICE ") + yellow(` ${message.toUpperCase()}\n`));
}

/**
 * Validate a response against a Joi schema.
 *
 * @param {Object} response   The response to validate.
 * @param {Joi.object} schema The Joi schema to validate against.
 */
export function validate(response, schema) {
  if (response === null || response === undefined) {
    throw new Error("Validation Error: Response was empty");
  }

  const { error, value } = Joi.validate(response, schema);
  expect(error).to.be.null;
}
