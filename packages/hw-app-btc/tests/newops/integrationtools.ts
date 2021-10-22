/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable prettier/prettier */
import Transport from "@ledgerhq/hw-transport";
import bs58check from "bs58check";
import Btc from "../../src/Btc";
import BtcNew from "../../src/BtcNew";
import { BufferWriter } from "../../src/buffertools";
import { CreateTransactionArg } from "../../src/createTransaction";
import { AddressFormat } from "../../src/getWalletPublicKey";
import { AppClient } from "../../src/newops/appClient";
import {
  DefaultDescriptorTemplate,
  WalletPolicy
} from "../../src/newops/policy";
import { Transaction } from "../../src/types";
import { CoreInput, CoreTx, spentTxs } from "./testtx";


export async function runSignTransaction(
  testTx: CoreTx, 
  testPaths: {ins: string[], out?: string},
  client: TestingClient, 
  transport: Transport): Promise<string> {
  const btcNew = new BtcNew(client);
  // btc is needed to perform some functions like splitTransaction.
  const btc = new Btc(transport);
  const accountType = getAccountType(testTx.vin[0], btc);
  const additionals: string[] = [];
  if (accountType == AccountType.p2wpkh) {
    additionals.push("bech32");
  }
  if (accountType == AccountType.p2tr) {
    additionals.push("bech32m");
  }
  const associatedKeysets: string[] = [];
  const yieldSigs = new Map<number, Buffer>();
  const inputs = testTx.vin.map((input, index) => {
    const path = testPaths.ins[index];
    associatedKeysets.push(path);
    const inputData = createInput(input, btc);
    const pubkey = getPubkey(index, accountType, testTx, inputData[0], inputData[1]);
    const mockXpub = creatDummyXpub(pubkey);
    client.mockGetPubkeyResponse(path, mockXpub);
    yieldSigs.set(index, getSignature(input, accountType));
    return inputData;
  });
  client.mockSignPsbt(yieldSigs);
  const outputWriter = new BufferWriter();
  outputWriter.writeVarInt(testTx.vout.length);
  testTx.vout.forEach(output => {
    outputWriter.writeUInt64(BigInt(Number.parseFloat((output.value * 100000000).toFixed(8))));
    outputWriter.writeVarSlice(Buffer.from(output.scriptPubKey.hex, "hex"));    
  });
  const outputScriptHex = outputWriter.buffer().toString("hex");  
  let callbacks = "";
  function logCallback(message: string) {
    callbacks += new Date().toISOString() + " " + message + "\n";
  }
  const arg: CreateTransactionArg = {    
    inputs,
    additionals,
    associatedKeysets,
    changePath: testPaths.out,
    outputScriptHex,
    lockTime: testTx.locktime,
    segwit: accountType != AccountType.p2pkh,
    onDeviceSignatureGranted: () => logCallback("CALLBACK: signature granted"),
    onDeviceSignatureRequested: () => logCallback("CALLBACK: signature requested"),
    onDeviceStreaming: (arg) => logCallback("CALLBACK: " + JSON.stringify(arg))
  };
  logCallback("Start createPaymentTransactionNew");
  const tx = await btcNew.createPaymentTransactionNew(arg);
  logCallback("Done createPaymentTransactionNew");
  // console.log(callbacks);
  return tx;
};



export function addressFormatFromDescriptorTemplate(descTemp: DefaultDescriptorTemplate): AddressFormat {
  if (descTemp == "tr(@0)") return "bech32m";
  if (descTemp == "pkh(@0)") return "legacy";
  if (descTemp == "wpkh(@0)") return "bech32";
  if (descTemp == "sh(wpkh(@0))") return "p2sh";
  throw new Error();
}

export enum AccountType {
  p2tr = "86'",
  p2wpkh = "84'",
  p2wpkhInP2sh = "49'",
  p2pkh = "44'"
}

function getPubkey(inputIndex: number, accountType: AccountType, testTx: CoreTx, spentTx: Transaction, spentOutputIndex: number): Buffer {
  const scriptSig = Buffer.from(testTx.vin[inputIndex].scriptSig.hex, "hex");
  if (accountType == AccountType.p2pkh) {    
    return scriptSig.slice(scriptSig.length-33);
  }
  if (accountType == AccountType.p2tr) {
    return spentTx.outputs![spentOutputIndex].script.slice(2, 34); // 32 bytes x-only pubkey
  }
  if (accountType == AccountType.p2wpkh || accountType == AccountType.p2wpkhInP2sh) {
    return Buffer.from(testTx.vin[inputIndex].txinwitness![1], "hex");
  }
  throw new Error();
}

function getSignature(testTxInput: CoreInput, accountType: AccountType): Buffer {
  const scriptSig = Buffer.from(testTxInput.scriptSig.hex, "hex");
  if (accountType == AccountType.p2pkh) {
    return scriptSig.slice(1, scriptSig.length-34);
  }
  if (accountType == AccountType.p2tr) {
    return Buffer.from(testTxInput.txinwitness![0], "hex");
  }
  if (accountType == AccountType.p2wpkh || accountType == AccountType.p2wpkhInP2sh) {
    return Buffer.from(testTxInput.txinwitness![0], "hex");
  }
  throw new Error();
}

function getAccountType(coreInput: CoreInput, btc: Btc): AccountType {
  const spentTx = spentTxs[coreInput.txid];
  if (!spentTx) {
    throw new Error("Spent tx " + coreInput.txid + " unavailable.");
  }
  const splitSpentTx = btc.splitTransaction(spentTx, true);
  const spentOutput = splitSpentTx.outputs![coreInput.vout];
  const script = spentOutput.script;
  if (script.length == 34 && script[0] == 0x51) {
    return AccountType.p2tr;
  }
  if (script.length == 22 && script[0] == 0x00) {
    return AccountType.p2wpkh;
  }
  if (script.length == 23) {
    return AccountType.p2wpkhInP2sh;
  }
  return AccountType.p2pkh;
}

export function creatDummyXpub(pubkey: Buffer): string {
  const xpubDecoded = bs58check.decode("tpubDHcN44A4UHqdHJZwBxgTbu8Cy87ZrZkN8tQnmJGhcijHqe4rztuvGcD4wo36XSviLmiqL5fUbDnekYaQ7LzAnaqauBb9RsyahsTTFHdeJGd");
  const pubkey33 = pubkey.length == 33 ? pubkey : Buffer.concat([Buffer.of(2), pubkey]);
  xpubDecoded.fill(pubkey33, xpubDecoded.length-33);
  return bs58check.encode(xpubDecoded);
}

function createInput(coreInput: CoreInput, btc: Btc): [Transaction, number, string, number] {
  const spentTx = spentTxs[coreInput.txid];
  if (!spentTx) {
    throw new Error("Spent tx " + coreInput.txid + " unavailable.");
  }
  const splitSpentTx = btc.splitTransaction(spentTx, true);
  const scriptSig = coreInput.scriptSig;
  let redeemScript;
  if (scriptSig?.hex && scriptSig.hex.startsWith("160014")) {
    redeemScript = scriptSig.hex.substring(2);
  }
  return [splitSpentTx, coreInput.vout, redeemScript, coreInput.sequence];
}

export const masterFingerprint = Buffer.of(1, 2, 3, 4);
export class TestingClient extends AppClient {
  mockGetPubkeyResponse(_pathElements: string, _response: string): void {};
  mockGetWalletAddressResponse(
    _walletPolicy: WalletPolicy,
    _change: number,
    _addressIndex: number,
    _response: string
  ): void {};
  mockSignPsbt(_yieldSigs: Map<number, Buffer>): void {};
}
