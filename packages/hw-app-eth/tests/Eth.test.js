import {
  createTransportReplayer,
  RecordStore
} from "@ledgerhq/hw-transport-mocker";
import Eth from "../src/Eth";
import { BigNumber } from "bignumber.js";

test("getAppConfiguration", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
    => e006000000
    <= 010101069000    
    `)
  );
  const transport = await Transport.open();
  const eth = new Eth(transport);
  const result = await eth.getAppConfiguration();
  expect(result).toEqual({ arbitraryDataEnabled: 1, erc20ProvisioningNecessary: 0, starkEnabled: 0, version: "1.1.6" });
});

test("getAddress", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
    => e002000015058000002c8000003c800000008000000000000000
    <= 4104df00ad3869baad7ce54f4d560ba7f268d542df8f2679a5898d78a690c3db8f9833d2973671cb14b088e91bdf7c0ab00029a576473c0e12f84d252e630bb3809b28436241393833363265313939633431453138363444303932334146393634366433413634383435319000      
    `)
  );
  const transport = await Transport.open();
  const eth = new Eth(transport);
  const result = await eth.getAddress("44'/60'/0'/0'/0");
  expect(result).toEqual({
    address: "0xCbA98362e199c41E1864D0923AF9646d3A648451",
    publicKey:
      "04df00ad3869baad7ce54f4d560ba7f268d542df8f2679a5898d78a690c3db8f9833d2973671cb14b088e91bdf7c0ab00029a576473c0e12f84d252e630bb3809b"
  });
});

test("signTransaction", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
    => e00400003e058000002c8000003c800000008000000000000000e8018504e3b292008252089428ee52a8f3d6e5d15f8b131996950d7f296c7952872bd72a2487400080
    <= 1b3694583045a85ada8d15d5e01b373b00e86a405c9c52f7835691dcc522b7353b30392e638a591c65ed307809825ca48346980f52d004ab7a5f93657f7e62a4009000
    `)
  );
  const transport = await Transport.open();
  const eth = new Eth(transport);
  const result = await eth.signTransaction(
    "44'/60'/0'/0'/0",
    "e8018504e3b292008252089428ee52a8f3d6e5d15f8b131996950d7f296c7952872bd72a2487400080"
  );
  expect(result).toEqual({
    r: "3694583045a85ada8d15d5e01b373b00e86a405c9c52f7835691dcc522b7353b",
    s: "30392e638a591c65ed307809825ca48346980f52d004ab7a5f93657f7e62a400",
    v: "1b"
  });
});

test("signPersonalMessage", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
    => e00800001d058000002c8000003c8000000080000000000000000000000474657374
    <= 1b8beafdd56521af1213d6d668a2aed262cc840e7174b642215aec013a1c88b2bd3a407b9125f1bfc015df6983ae8b87a34d54be367b4275834c3039622a73ee009000
    `)
  );
  const transport = await Transport.open();
  const eth = new Eth(transport);
  const result = await eth.signPersonalMessage(
    "44'/60'/0'/0'/0",
    Buffer.from("test").toString("hex")
  );
  expect(result).toEqual({
    r: "8beafdd56521af1213d6d668a2aed262cc840e7174b642215aec013a1c88b2bd",
    s: "3a407b9125f1bfc015df6983ae8b87a34d54be367b4275834c3039622a73ee00",
    v: 27
  });
});

test("starkGetPublicKey", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
    => f002000009028000534b00000000
    <= 05e8330615774c27af37530e34aa17e279eb1ac8ac91709932e0a1929bba54ac9000      
    `)
  );
  const transport = await Transport.open();
  const eth = new Eth(transport);
  const result = await eth.starkGetPublicKey("21323'/0");
  expect(result).toEqual(Buffer.from("05e8330615774c27af37530e34aa17e279eb1ac8ac91709932e0a1929bba54ac", "hex"));
});

test("starkSignOrder1", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
    => f004010091028000534b000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000010000000100000000000186a00000000000030d4000000d6a00001618
    <= 30440220029526c310368e835a2a0ee412a3bf084e0f94d91b8265f88a0bee32488223c40220012c34bef05a7b80ba22b0d58a18acd1a8198ee8fc9b525f85d2f4f843c5510f9000
    `)
  );
  const transport = await Transport.open();
  const eth = new Eth(transport);
  const result = await eth.starkSignOrder("21323'/0", null, new BigNumber(1), null, new BigNumber(1), 1, 1, new BigNumber(100000), new BigNumber(200000), 3434, 5656);
  expect(result).toEqual(Buffer.from("30440220029526c310368e835a2a0ee412a3bf084e0f94d91b8265f88a0bee32488223c40220012c34bef05a7b80ba22b0d58a18acd1a8198ee8fc9b525f85d2f4f843c5510f", "hex"));
});

test("starkSignOrder2", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
    => f004010091028000534b00000000e41d2489571d322189246dafa5ebde1f4699f4980000000000000000000000000000000000000000000000000000000000000001dac17f958d2ee523a2206206994597c13d831ec70000000000000000000000000000000000000000000000000000000000000001000000010000000100000000000186a00000000000030d4000000d6a00001618
    <= 3044022003c4a1aef46539c90eaad9a71eee8319586e2b749793335060a2431c42d0d489022001faac9386aaaf9d8d2cc3229aecf9e202f4b83f63e3fff7426ca07725d10fb29000
    `)
  );
  const transport = await Transport.open();
  const eth = new Eth(transport);
  const result = await eth.starkSignOrder("21323'/0", "e41d2489571d322189246dafa5ebde1f4699f498", new BigNumber(1), "dac17f958d2ee523a2206206994597c13d831ec7", new BigNumber(1), 1, 1, new BigNumber(100000), new BigNumber(200000), 3434, 5656);
  expect(result).toEqual(Buffer.from("3044022003c4a1aef46539c90eaad9a71eee8319586e2b749793335060a2431c42d0d489022001faac9386aaaf9d8d2cc3229aecf9e202f4b83f63e3fff7426ca07725d10fb2", "hex"));
});

test("starkSignTransfer1", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
    => f004020075028000534b0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001f1f789e47bb134082b2e901f779a0d188af7fbd7d97d10a9e121f22adadb5b05000000010000000100000000000186a000000d6a00001618
    <= 30440220028c0e3b4d2e7b0c1055c7d40e8df12676bc90cf19d0006225d500baecd5e11c02200305fe1782f050839619c3e9627121bacd3a8dc87859e1ba5376fbd1b3bee4d49000
    `)
  );
  const transport = await Transport.open();
  const eth = new Eth(transport);
  const result = await eth.starkSignTransfer("21323'/0", null, new BigNumber(1), "f1f789e47bb134082b2e901f779a0d188af7fbd7d97d10a9e121f22adadb5b05", 1, 1, new BigNumber(100000), 3434, 5656);
  expect(result).toEqual(Buffer.from("30440220028c0e3b4d2e7b0c1055c7d40e8df12676bc90cf19d0006225d500baecd5e11c02200305fe1782f050839619c3e9627121bacd3a8dc87859e1ba5376fbd1b3bee4d4", "hex"));
});

test("starkProvideQuantum", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
    => f0080000200000000000000000000000000000000000000000000000000000000000000001
    <= 9000
    `)
  );
  const transport = await Transport.open();
  const eth = new Eth(transport);
  const result = await eth.starkProvideQuantum(new BigNumber(1));
  expect(result).toEqual(true);
});
