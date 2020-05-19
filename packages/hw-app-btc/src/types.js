// @flow

/**
 */
export type TransactionInput = {
  prevout: Buffer,
  script: Buffer,
  sequence: Buffer,
  tree?: Buffer,
};

/**
 */
export type TransactionOutput = {
  amount: Buffer,
  script: Buffer,
};

/**
 */
export type Transaction = {
  version: Buffer,
  inputs: TransactionInput[],
  outputs?: TransactionOutput[],
  locktime?: Buffer,
  witness?: Buffer,
  timestamp?: Buffer,
  nVersionGroupId?: Buffer,
  nExpiryHeight?: Buffer,
  extraData?: Buffer,
};
