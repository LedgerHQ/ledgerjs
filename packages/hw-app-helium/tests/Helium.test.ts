import { PaymentV1 } from "@helium/transactions";
import { Address } from "@helium/crypto";
import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Helium from "../src/Helium";

// test("getAppConfiguration",async () => {
//   const transport = await openTransportReplayer(
//     RecordStore.fromString(`
//             => e004000000
//             <= 00000100069000
//         `)
//   );
//   const helium = new Helium(transport);
//   const result = await helium.getAppConfiguration();
//   expect(result).toEqual({
//     version: "1.0.6",
//     blindSigningEnabled: false,
//     pubKeyDisplayMode: 0,
//   });
// });

/*  NOTE!
 *  These words generate real Helium accounts and should
 *  be considered COMPROMISED. Don't send any money to them that
 *  you don't want to lose.
 */

const bobB58 = "13M8dUbxymE3xtiAXszRkGMmezMhBS8Li7wEsMojLdb4Sdxc4wc";
const aliceB58 = "148d8KTRcKA5JKPekBcKFd4KfvprvFRpjGtivhtmRmnZ8MFYnP3";

const DERIVATION = "44'/904'/0'/0'/0'";

test("getAddress without display", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
        => e002000015058000002c80000388800000008000000080000000
        <= 000135911a1c714d697b63ae374f9e969296c347b10027b9ff06d098e7e4e5958ed79000
    `)
  );
  const helium = new Helium(transport);
  const { address } = await helium.getAddress(DERIVATION, false);
  expect(address).toEqual(
    "13MLUBBKhTG6pbUdwwFZXnj7P4R7gB6q2janJf3fFipGjLqDV1k"
  );
});

test("getAddress with display", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
        => e002010015058000002c80000388800000008000000080000000
        <= 000135911a1c714d697b63ae374f9e969296c347b10027b9ff06d098e7e4e5958ed79000
    `)
  );
  const helium = new Helium(transport);
  const { address } = await helium.getAddress(DERIVATION, true);
  expect(address).toEqual(
    "13MLUBBKhTG6pbUdwwFZXnj7P4R7gB6q2janJf3fFipGjLqDV1k"
  );
});

test("signPaymentV1", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
        => e00800003a0a000000000000000000000000000000010000000000000000019c659d723cc1e810a72e78f7deaf4736a87f10ef8fcfc80100b53327e7ee49a4
        <= 0a2101351a71c22fefec2231936ad2826b217ece39d9f77fc6c49639926299c38692951221019c659d723cc1e810a72e78f7deaf4736a87f10ef8fcfc80100b53327e7ee49a4180a28013240cb12e89e9208dd674d88d83df56691952eb6dc7ce4c48a8f33b56f8ebeb626d16766b48fe33b9d22fcfabcffd4f5aad72250db8b2bcee677e234cead3e6bb3079000
    `)
  );
  const helium = new Helium(transport);
  const payee = Address.fromB58(aliceB58);
  const payer = Address.fromB58(bobB58);
  const txnToSign = new PaymentV1({ amount: 10, nonce: 1, payee, payer });
  const { signature, txn } = await helium.signPaymentV1(txnToSign);
  const expectedSig =
    "cb12e89e9208dd674d88d83df56691952eb6dc7ce4c48a8f33b56f8ebeb626d16766b48fe33b9d22fcfabcffd4f5aad72250db8b2bcee677e234cead3e6bb307";
  expect(signature.toString("hex")).toEqual(expectedSig);
  expect(txn.amount).toBe(10);
  expect(txn.nonce).toBe(1);
  expect(txn.payer?.b58).toBe(bobB58);
  expect(txn.payee?.b58).toBe(aliceB58);
  expect(Buffer.from(txn.signature as Uint8Array).toString("hex")).toBe(
    expectedSig
  );
});
