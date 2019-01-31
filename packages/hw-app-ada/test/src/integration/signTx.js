import { expect } from "chai";
import { getAda, str_to_path } from "../utils";

const inputs = {
  utxo0: {
    txDataHex:
      "839f8200d8185824825820918c11e1c041a0cb04baea651b9fb1bdef7ee5295f" +
      "032307e2e57d109de118b8008200d81858248258208f34e4f719effe82c28c8f" +
      "f45e426233651fc03686130cb7e1d4bc6de20e689c01ff9f8282d81858218358" +
      "1cb6f4b193e083530aca83ff03de4a60f4e7a6732b68b4fa6972f42c11a0001a" +
      "907ab5c71a000f42408282d818584283581cb5bacd405a2dcedce19899f8647a" +
      "8c4f45d84c06fb532c63f9479a40a101581e581c6b8487e9d22850b7539db255" +
      "e27dd48dc0a50c7994d678696be64f21001ac5000d871a03dc396fffa0",
    outputIndex: 0,
    path: str_to_path("44'/1815'/0'/0/0")
  }
};

const outputs = {
  adalite: {
    amountStr: "700000",
    address58:
      "DdzFFzCqrhsoarXqLakMBEiURCGPCUL7qRvPf2oGknKN2nNix5b9SQKj2YckgXZK" +
      "6q1Ym7BNLxgEX3RQFjS2C41xt54yJHeE1hhMUfSG"
  },
  ledgerChange: {
    amountStr: "100000",
    path: str_to_path("44'/1815'/0'/1/0")
  },
  ledgerChangeTooMuch: {
    amountStr: "1000000",
    path: str_to_path("44'/1815'/0'/1/0")
  }
};

const results = {
  txHashHex: "01f54c866c778568c01b9e4c0a2cbab29e0af285623404e0ef922c6b63f9b222",

  witnesses: [
    {
      path: str_to_path("44'/1815'/0'/0/0"),
      witnessHex:
        "f89f0d3e2ad34a29c36d9eebdceb951088b52d33638d0f55d49ba2f8baff6e29" +
        "056720be55fd2eb7198c05b424ce4308eaeed7195310e5879c41c1743245b000"
    }
  ]
};

describe("signTx", async () => {
  let ada = {};

  beforeEach(async () => {
    ada = await getAda();
  });

  afterEach(async () => {
    await ada.t.close();
  });

  it("Should correctly sign Tx", async () => {
    const response = await ada.signTransaction(
      [inputs.utxo0],
      [outputs.adalite, outputs.ledgerChange]
    );
    expect(response).to.deep.equal(results);
  });
});
