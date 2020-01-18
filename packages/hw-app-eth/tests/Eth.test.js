import {
  createTransportReplayer,
  RecordStore
} from "@ledgerhq/hw-transport-mocker";
import Eth from "../src/Eth";

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
  expect(result).toEqual({ arbitraryDataEnabled: 1, version: "1.1.6" });
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
