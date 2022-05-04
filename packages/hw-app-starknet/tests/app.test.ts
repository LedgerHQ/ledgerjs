import Stark from "../src/Stark";
import { LedgerError } from "../src/common";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import BN from "bn.js";
import { ec } from "starknet";

let transport:TransportNodeHid;
let app:Stark;


/* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */
/* see https://github.com/yogh333/ledger-starkware/blob/main/docs/build.md#using-a-real-device before running the tests */
/* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */
const PATH = "m/2645'/579218131'/0'/0'"
const PUBLIC_KEY = "0400c721c8b219430e4b897c8b3a19566b696304deecd6f80b2cf5a2806a9a105607d3f0830c761f45ae08f269bb90a103b9875dc53835ce6e09a619ab5eeb92f5";

const HASH_63 = "2bd1d3f8f45a011cbd0674ded291d58985761bbcbc04f4d01c8285d1b35c411";
const HASH_62 = "2e672d748fbe3b6e833b61ea8b6e688850247022f06406a1eb83e345ffb417";
const HASH_61 = "936e8798681b391af0c57fe0bf5703b9631bea18b4bc84b3940ebab234744";

beforeAll(async () => {
  transport = await TransportNodeHid.create()
  app = new Stark(transport)
});


test('getAppVersion()', async () => {
  const version = await app.getVersion()
  expect(version.major).toBe(0)
  expect(version.minor).toBe(0)
  expect(version.patch).toBe(5)
})

test('getPubKey()', async () => {
  const response = await app.getPubKey(PATH)
  expect(response.returnCode).toBe(LedgerError.NoErrors)
  let j = 0;
  for (let i = 0; i < PUBLIC_KEY.length; i += 2) {
    expect(response.publicKey[j++]).toBe(parseInt(PUBLIC_KEY[i]+PUBLIC_KEY[i+1], 16));
  }
})

test('signFelt(63 digits)', async () => {
  const result = await app.signFelt(PATH, HASH_63, false);
  expect(result.returnCode).toBe(LedgerError.NoErrors)
  const r = new BN(result.r);
  const s = new BN(result.s);
  
  const kp = ec.getKeyPairFromPublicKey("0x" + PUBLIC_KEY);
  expect(ec.verify(kp, HASH_63, [r.toString(), s.toString()])).toBe(true);
})

test('signFelt(62 digits)', async () => {
  const result = await app.signFelt(PATH, HASH_62, false);
  expect(result.returnCode).toBe(LedgerError.NoErrors)
  const r = new BN(result.r);
  const s = new BN(result.s);  

  const kp = ec.getKeyPairFromPublicKey("0x" + PUBLIC_KEY);
  expect(ec.verify(kp, HASH_62, [r.toString(), s.toString()])).toBe(true);
})

test('signFelt(61 digits)', async () => {
  const result = await app.signFelt(PATH, HASH_61, false);
  expect(result.returnCode).toBe(LedgerError.NoErrors)
  const r = new BN(result.r);
  const s = new BN(result.s);  

  const kp = ec.getKeyPairFromPublicKey("0x" + PUBLIC_KEY);
  expect(ec.verify(kp, HASH_61, [r.toString(), s.toString()])).toBe(true);
})