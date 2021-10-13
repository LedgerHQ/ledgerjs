import { crypto } from "bitcoinjs-lib";
import {
  getXpubComponents,
  hardenedPathOf,
  pathStringToArray,
  pubkeyFromXpub,
} from "./bip32";
import { BufferReader } from "./buffertools";
import type { CreateTransactionArg } from "./createTransaction";
import type { AddressFormat } from "./getWalletPublicKey";
import { hashPublicKey } from "./hashPublicKey";
import { AppClient as Client } from "./newops/appClient";
import { createKey, WalletPolicy } from "./newops/policy";
import { extract } from "./newops/psbtExtractor";
import { finalize } from "./newops/psbtFinalizer";
import { psbtIn, PsbtV2 } from "./newops/psbtv2";
import { serializeTransaction } from "./serializeTransaction";
import type { Transaction } from "./types";
import { pointCompress } from "tiny-secp256k1";

export default class BtcNew {
  constructor(private client: Client) {}

  async getWalletXpub({
    path,
    xpubVersion,
  }: {
    path: string;
    xpubVersion: number;
  }): Promise<string> {
    const pathElements: number[] = pathStringToArray(path);
    const xpub = await this.client.getPubkey(false, pathElements);
    const xpubComponents = getXpubComponents(xpub);
    if (xpubComponents.version != xpubVersion) {
      throw new Error(
        `Expected xpub version ${xpubVersion} doesn't match the xpub version from the device ${xpubComponents.version}`
      );
    }
    return xpub;
  }

  async getWalletPublicKey(
    path: string,
    opts?: {
      verify?: boolean;
      format?: AddressFormat;
    }
  ): Promise<{
    publicKey: string;
    bitcoinAddress: string;
    chainCode: string;
  }> {
    const pathElements: number[] = pathStringToArray(path);
    const xpub = await this.client.getPubkey(false, pathElements);

    const display = opts?.verify ?? false;

    const address = await this.getWalletAddress(
      pathElements,
      accountTypeFrom(opts?.format ?? "legacy"),
      display
    );
    const components = getXpubComponents(xpub);
    const uncompressedPubkey = Buffer.from(
      pointCompress(components.pubkey, false)
    );
    return {
      publicKey: uncompressedPubkey.toString("hex"),
      bitcoinAddress: address,
      chainCode: components.chaincode.toString("hex"),
    };
  }

  /**
   * Get an address for the specified path.
   *
   * If display is true, we must get the address from the device, which would require
   * us to determine WalletPolicy. This requires two *extra* queries to the device, one
   * for the account xpub and one for master key fingerprint.
   *
   * If display is false we *could* generate the address ourselves, but chose to
   * get it from the device to save development time. However, it shouldn't take
   * more than a few hours to implement local address generation.
   *
   * Moreover, if the path is not for a leaf, ie accountPath+/X/Y, there is no
   * way to get the address from the device. In this case we have to create it
   * ourselves, but we don't at this time, and instead return an empty ("") address.
   */
  private async getWalletAddress(
    pathElements: number[],
    accountType: AccountType,
    display: boolean
  ): Promise<string> {
    const accountPath = hardenedPathOf(pathElements);
    if (accountPath.length + 2 != pathElements.length) {
      return "";
    }
    const accountXpub = await this.client.getPubkey(false, accountPath);
    const masterFingerprint = await this.client.getMasterFingerprint();
    const policy = new WalletPolicy(
      accountType,
      createKey(masterFingerprint, accountPath, accountXpub)
    );
    const changeAndIndex = pathElements.slice(-2, pathElements.length);
    return this.client.getWalletAddress(
      policy,
      Buffer.alloc(32, 0),
      changeAndIndex[0],
      changeAndIndex[1],
      display
    );
  }

  /**
   * To sign a transaction involving standard (P2PKH) inputs, call createTransaction with the following parameters
   * @param inputs is an array of [ transaction, output_index, optional redeem script, optional sequence ] where
   *
   * * transaction is the previously computed transaction object for this UTXO
   * * output_index is the output in the transaction used as input for this UTXO (counting from 0)
   * * redeem script is the optional redeem script to use when consuming a Segregated Witness input
   * * sequence is the sequence number to use for this input (when using RBF), or non present
   * @param associatedKeysets is an array of BIP 32 paths pointing to the path to the private key used for each UTXO
   * @param changePath is an optional BIP 32 path pointing to the path to the public key used to compute the change address
   * @param outputScriptHex is the hexadecimal serialized outputs of the transaction to sign, including leading vararg voutCount
   * @param lockTime is the optional lockTime of the transaction to sign, or default (0)
   * @param sigHashType is the hash type of the transaction to sign, or default (all)
   * @param segwit is an optional boolean indicating wether to use segwit or not. This includes wrapped segwit.
   * @param initialTimestamp is an optional timestamp of the function call to use for coins that necessitate timestamps only, (not the one that the tx will include)
   * @param additionals list of additionnal options
   * 
   * - "bech32" for spending native segwit outputs
   * - "bech32m" for spending segwit v1+ outptus
   * - "abc" for bch
   * - "gold" for btg
   * - "bipxxx" for using BIPxxx
   * - "sapling" to indicate a zec transaction is supporting sapling (to be set over block 419200)
   * @param expiryHeight is an optional Buffer for zec overwinter / sapling Txs
   * @param useTrustedInputForSegwit trust inputs for segwit transactions. If app version >= 1.4.0 this should be true.
   * @return the signed transaction ready to be broadcast
   * @example
  btc.createTransaction({
   inputs: [ [tx1, 1] ],
   associatedKeysets: ["0'/0/0"],
   outputScriptHex: "01905f0100000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac"
  }).then(res => ...);
   */
  async createPaymentTransactionNew(
    arg: CreateTransactionArg
  ): Promise<string> {
    if (arg.inputs.length == 0) {
      throw Error("No inputs");
    }
    const psbt = new PsbtV2();

    const accountType = accountTypeFromArg(arg);

    psbt.setGlobalTxVersion(2);
    if (arg.lockTime) {
      psbt.setGlobalFallbackLocktime(arg.lockTime);
    }
    psbt.setGlobalInputCount(arg.inputs.length);
    psbt.setGlobalPsbtVersion(2);
    psbt.setGlobalTxVersion(2);

    const masterFp = await this.client.getMasterFingerprint();
    let accountXpub = "";
    let accountPath: number[] = [];
    for (let i = 0; i < arg.inputs.length; i++) {
      const pathElems: number[] = pathStringToArray(arg.associatedKeysets[i]);
      if (accountXpub == "") {
        // We assume all inputs belong to the same account so we set
        // the account xpub and path based on the first input.
        accountPath = pathElems.slice(0, -2);
        accountXpub = await this.client.getPubkey(false, accountPath);
      }
      await this.setInput(
        psbt,
        i,
        arg.inputs[i],
        pathElems,
        accountType,
        masterFp
      );
    }

    const outputsConcat = Buffer.from(arg.outputScriptHex, "hex");
    const outputsBufferReader = new BufferReader(outputsConcat);
    const outputCount = outputsBufferReader.readVarInt();
    psbt.setGlobalOutputCount(outputCount);
    for (let i = 0; i < outputCount; i++) {
      const amount = Number(outputsBufferReader.readUInt64());
      const outputScript = outputsBufferReader.readVarSlice();

      // The wallet always places the change output last.
      // But we won't know if we're paying to ourselves, because
      // we'd have one output at index <outputCount-1 for ourselves
      // and one change output.
      const isChange = arg.changePath && i == outputCount - 1;
      if (isChange) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const changePath = pathStringToArray(arg.changePath!);
        const xpubBase58 = await this.client.getPubkey(false, changePath);
        const pubkey = pubkeyFromXpub(xpubBase58);

        if (accountType == AccountType.p2pkh) {
          psbt.setOutputBip32Derivation(i, pubkey, masterFp, changePath);
        } else if (accountType == AccountType.p2wpkh) {
          psbt.setOutputBip32Derivation(i, pubkey, masterFp, changePath);
        } else if (accountType == AccountType.p2wpkhWrapped) {
          const redeemScript = this.createRedeemScript(pubkey);
          psbt.setOutputRedeemScript(i, redeemScript);
          psbt.setOutputBip32Derivation(i, pubkey, masterFp, changePath);
        } else if (accountType == AccountType.p2tr) {
          psbt.setOutputTapBip32Derivation(i, pubkey, [], masterFp, changePath);
        }
      }
      psbt.setOutputAmount(i, amount);
      psbt.setOutputScript(i, outputScript);
    }

    const key = createKey(masterFp, accountPath, accountXpub);
    const p = new WalletPolicy(accountType, key);
    return await this.signPsbt(psbt, p);
  }

  private async setInput(
    psbt: PsbtV2,
    i: number,
    input: [
      Transaction,
      number,
      string | null | undefined,
      number | null | undefined
    ],
    pathElements: number[],
    accountType: AccountType,
    masterFP: Buffer
  ): Promise<void> {
    const inputTx = input[0];
    const spentOutputIndex = input[1];
    const redeemScript = input[2];
    const sequence = input[3];
    if (sequence) {
      psbt.setInputSequence(i, sequence);
    }
    const inputTxBuffer = serializeTransaction(inputTx, true);
    const inputTxid = crypto.hash256(inputTxBuffer);
    const xpubBase58 = await this.client.getPubkey(false, pathElements);

    const pubkey = pubkeyFromXpub(xpubBase58);
    if (!inputTx.outputs)
      throw Error("Missing outputs array in transaction to sign");
    const spentOutput = inputTx.outputs[spentOutputIndex];

    if (accountType == AccountType.p2pkh) {
      psbt.setInputNonWitnessUtxo(i, inputTxBuffer);
      psbt.setInputBip32Derivation(i, pubkey, masterFP, pathElements);
    } else if (accountType == AccountType.p2wpkh) {
      psbt.setInputNonWitnessUtxo(i, inputTxBuffer);
      psbt.setInputBip32Derivation(i, pubkey, masterFP, pathElements);
      psbt.setInputWitnessUtxo(i, spentOutput.amount, spentOutput.script);
    } else if (accountType == AccountType.p2wpkhWrapped) {
      psbt.setInputNonWitnessUtxo(i, inputTxBuffer);
      psbt.setInputBip32Derivation(i, pubkey, masterFP, pathElements);
      if (!redeemScript) {
        throw new Error("Missing redeemScript for p2wpkhWrapped input");
      }
      const expectedRedeemScript = this.createRedeemScript(pubkey);
      if (redeemScript != expectedRedeemScript.toString("hex")) {
        throw new Error("Unexpected redeemScript");
      }
      psbt.setInputRedeemScript(i, expectedRedeemScript);
      psbt.setInputWitnessUtxo(i, spentOutput.amount, spentOutput.script);
    } else if (accountType == AccountType.p2tr) {
      psbt.setInputTapBip32Derivation(i, pubkey, [], masterFP, pathElements);
      psbt.setInputWitnessUtxo(i, spentOutput.amount, spentOutput.script);
    }

    psbt.setInputPreviousTxId(i, inputTxid);
    psbt.setInputOutputIndex(i, spentOutputIndex);
  }

  private async signPsbt(
    psbt: PsbtV2,
    walletPolicy: WalletPolicy
  ): Promise<string> {
    const sigs: Map<number, Buffer> = await this.client.signPsbt(
      psbt,
      walletPolicy,
      Buffer.alloc(32, 0)
    );
    sigs.forEach((v, k) => {
      // Note: Looking at BIP32 derivation does not work in the generic case.
      // some inputs might not have a BIP32-derived pubkey.
      const pubkeys = psbt.getInputKeyDatas(k, psbtIn.BIP32_DERIVATION);
      let pubkey;
      if (pubkeys.length != 1) {
        pubkey = psbt.getInputKeyDatas(k, psbtIn.TAP_BIP32_DERIVATION);
        if (pubkey.length == 0) {
          throw Error(`Missing pubkey derivation for input ${k}`);
        }
        psbt.setInputTapKeySig(k, v);
      } else {
        pubkey = pubkeys[0];
        psbt.setInputPartialSig(k, pubkey, v);
      }
    });
    finalize(psbt);
    const serializedTx = extract(psbt);
    return serializedTx.toString("hex");
  }

  private createRedeemScript(pubkey: Buffer): Buffer {
    const pubkeyHash = hashPublicKey(pubkey);
    return Buffer.concat([Buffer.from("0014", "hex"), pubkeyHash]);
  }
}

enum AccountType {
  p2pkh = "pkh(@0)",
  p2wpkh = "wpkh(@0)",
  p2wpkhWrapped = "sh(wpkh(@0))",
  p2tr = "tr(@0)",
}

function accountTypeFrom(addressFormat: AddressFormat): AccountType {
  if (addressFormat == "legacy") return AccountType.p2pkh;
  if (addressFormat == "p2sh") return AccountType.p2wpkhWrapped;
  if (addressFormat == "bech32") return AccountType.p2wpkh;
  if (addressFormat == "bech32m") return AccountType.p2tr;
  throw new Error("Unsupported address format " + addressFormat);
}

function accountTypeFromArg(arg: CreateTransactionArg): AccountType {
  if (arg.additionals.includes("bech32m")) return AccountType.p2tr;
  if (arg.additionals.includes("bech32")) return AccountType.p2wpkh;
  if (arg.segwit) return AccountType.p2wpkhWrapped;
  return AccountType.p2pkh;
}
