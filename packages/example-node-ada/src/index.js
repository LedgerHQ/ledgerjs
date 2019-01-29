import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import AppAda from "@ledgerhq/hw-app-ada";

const HARDENED = 0x80000000;

const makeExamples = (appAda) => ({
    getVersion: async () => {
      console.log("getVersion");
      console.log(await appAda.getVersion());
    },

    getExtendedPublicKey: async () => {
      console.log("getExtendedPublicKey");
      console.log(
        await appAda.getExtendedPublicKey([
          0x80000000 + 44,
          0x80000000 + 1815,
          0x80000000 + 0
        ])
      );
    },

    deriveAddress: async () => {
      console.log("deriveAddress");
      console.log(
        await appAda.deriveAddress([
          0x80000000 + 44,
          0x80000000 + 1815,
          0x80000000 + 0,
          1,
          0
        ])
      );
    },

    showAddress: async () => {
      console.log("showAddress");
      console.log(
        await appAda.showAddress([
          0x80000000 + 44,
          0x80000000 + 1815,
          0x80000000 + 1000,
          1,
          0
        ])
      );
    },

    attestUtxo: async () => {
      console.log("attestUtxo");
      console.log(
        await appAda.attestUtxo(
          "839f8200d818582482582034bbdf0a10e7290ad22e3ee791b6b3c35c206ab8b5" +
            "1bb749a2b06489ceebf5f400ff9f8282d818584283581c5f5bee73ed41ff6c84" +
            "90dfdb4732178e0216ccf7badbe1e77d5d7ff8a101581e581c1e9a0361bdc37d" +
            "b7ab7ea2a3f187761877f3db11211fc7436131f15e001ab10129441b00000185" +
            "ae645c2d8282d818584283581cada4052647c47745abfc9e04d7dc5c5c0a8542" +
            "8f5b741be6687e6005a101581e581cd8669b0c1a9f2fccb28d3ef58ef8efad73" +
            "aead7117b6559a5f857813001acdb5f5841a1633e6208282d818584283581c65" +
            "32caadc0b498be1813d12f33bf81d68d5662255cc640b881a29315a101581e58" +
            "1cca3e553c9c63c580936df7433aac461e4efb6ce966206e083af22d0e001a9c" +
            "7427f71a19cf10348282d818584283581c6fd85cfe0ae8c346552717424229d5" +
            "ac928e72b0cbd5587a5d9bd8e5a101581e581c2b0b011ba3683d2eb420332a08" +
            "4fe7ecbdefa204c415cd7aa17e216d001a1c29005f1ac38bbcf88282d8185842" +
            "83581c431923e34d95851fba3c88e99d9d366eb1d595e5436c68da1b4699a5a1" +
            "01581e581c3054e511bd5acd29e7540b417600367915afa6f95b1a40246aa4fc" +
            "9f001af7fec6a71a794fa104ffa0",
          3
        )
      );
    },

    signTransaction: async () => {
      console.log("signTransaction");
      const inputs = [
        {
          txDataHex:
            "839f8200d8185824825820918c11e1c041a0cb04baea651b9fb1bdef7ee5295f" +
            "032307e2e57d109de118b8008200d81858248258208f34e4f719effe82c28c8f" +
            "f45e426233651fc03686130cb7e1d4bc6de20e689c01ff9f8282d81858218358" +
            "1cb6f4b193e083530aca83ff03de4a60f4e7a6732b68b4fa6972f42c11a0001a" +
            "907ab5c71a000f42408282d818584283581cb5bacd405a2dcedce19899f8647a" +
            "8c4f45d84c06fb532c63f9479a40a101581e581c6b8487e9d22850b7539db255" +
            "e27dd48dc0a50c7994d678696be64f21001ac5000d871a03dc396fffa0",
          outputIndex: 0,
          path: [HARDENED + 44, HARDENED + 1815, HARDENED + 1000, 1, 0]
          // Details:
          // txHashHex:
          //    'd5c5c15054228da1f1a973ff36098658ce5147a989cf2c4a92c8a2a84686afc6',
          // amountStr: "1000000",
          // address58:
          //      'Ae2tdPwUPEZF4a8fNdkUt8HSyyWgsq2DqP2AKGFKiF3SLsXNDuu6wYp15Dp'
        }
      ];

      const outputs = [
        {
          amountStr: "700000",
          address58:
            "DdzFFzCqrhsoarXqLakMBEiURCGPCUL7qRvPf2oGknKN2nNix5b9SQKj2YckgXZK" +
            "6q1Ym7BNLxgEX3RQFjS2C41xt54yJHeE1hhMUfSG"
        },
        {
          amountStr: "100000",
          path: [HARDENED + 44, HARDENED + 1815, HARDENED + 0, 0, 0]
          //address58:
          //    'Ae2tdPwUPEZLrRBShqCSucUymQSfXHEx3EthwabAYSYLyG52i6QaXTDwNVL'
        }
      ];

      console.log(await appAda.signTransaction(inputs, outputs));
      /*
          {
            txHashHex: '01f54c866c778568c01b9e4c0a2cbab29e0af285623404e0ef922c6b63f9b222',
            witnesses: [
              {
                path: [Array],
                witnessHex: 'f89f0d3e2ad34a29c36d9eebdceb951088b52d33638d0f55d49ba2f8baff6e29056720be55fd2eb7198c05b424ce4308eaeed7195310e5879c41c1743245b000'
              }
            ]
          }
        */
    },

    runTests: async () => {
      console.log("runTests");
      console.log(await appAda.runTests());
    }
});


async function example() {
  console.log("Running ADA examples");
  const transport = await TransportNodeHid.create(5000);
  transport.setDebugMode(true);
  const appAda = new AppAda(transport);

  const examples = makeExamples(appAda);

  await examples.getVersion();
  await examples.getExtendedPublicKey();
  await examples.deriveAddress();
  await examples.showAddress();
  await examples.attestUtxo();
  await examples.signTransaction();
  await examples.runTests();
}

example();
