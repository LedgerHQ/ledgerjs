import BigNumber from "bignumber.js";

export interface PaymentV1Params {
  amount: BigNumber;
  fee: BigNumber;
  nonce: number;
  payeeAddress: string;
}
