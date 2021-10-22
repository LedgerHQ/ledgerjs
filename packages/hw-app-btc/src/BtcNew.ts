import { crypto } from "bitcoinjs-lib";
import { pointCompress, pointAddScalar } from "tiny-secp256k1";
import semver from "semver";
import {
  getXpubComponents,
  hardenedPathOf,
  pathArrayToString,
  pathStringToArray,
  pubkeyFromXpub,
} from "./bip32";
import { BufferReader, BufferWriter } from "./buffertools";
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
import {
  HASH_SIZE,
  OP_CHECKSIG,
  OP_DUP,
  OP_EQUAL,
  OP_EQUALVERIFY,
  OP_HASH160,
} from "./constants";
import { AppAndVersion } from "./getAppAndVersion";

const newSupportedApps = ["Bitcoin", "Bitcoin Test"];

export function canSupportApp(appAndVersion: AppAndVersion): boolean {
  return (
    newSupportedApps.includes(appAndVersion.name) &&
    semver.major(appAndVersion.version) >= 2
  );
}

/**
 * This class implements the same interface as BtcOld (formerly
 * named Btc), but interacts with Bitcoin hardware app version 2+
 * which uses a totally new APDU protocol. This new
 * protocol is documented at
 * https://github.com/LedgerHQ/app-bitcoin-new/blob/master/doc/bitcoin.md
 *
 * Since the interface must remain compatible with BtcOld, the methods
 * of this class are quite clunky, because it needs to adapt legacy
 * input data into the PSBT process. In the future, a new interface should
 * be developed that exposes PSBT to the outer world, which would render
 * a much cleaner implementation.
 */
export default class BtcNew {
  constructor(private client: Client) {}

  /**
   * This is a new method that allow users to get an xpub at a standard path.
   * Standard paths are described at
   * https://github.com/LedgerHQ/app-bitcoin-new/blob/master/doc/bitcoin.md#description
   *
   * This boils down to paths (N=0 for Bitcoin, N=1 for Testnet):
   * M/44'/N'/x'/**
   * M/48'/N'/x'/y'/**
   * M/49'/N'/x'/**
   * M/84'/N'/x'/**
   * M/86'/N'/x'/**
   *
   * The method was added because of added security in the hardware app v2+. The
   * new hardware app will allow export of any xpub up to and including the
   * deepest hardened key of standard derivation paths, whereas the old app
   * would allow export of any key.
   *
   * This caused an issue for callers of this class, who only had
   * getWalletPublicKey() to call which means they have to constuct xpub
   * themselves:
   *
   * Suppose a user of this class wants to create an account xpub on a standard
   * path, M/44'/0'/Z'. The user must get the parent key fingerprint (see BIP32)
   * by requesting the parent key M/44'/0'. The new app won't allow that, because
   * it only allows exporting deepest level hardened path. So the options are to
   * allow requesting M/44'/0' from the app, or to add a new function
   * "getWalletXpub".
   *
   * We opted for adding a new function, which can greatly simplify client code.
   */
  async getWalletXpub({
    path,
    xpubVersion,
  }: {
    path: string;
    xpubVersion: number;
  }): Promise<string> {
    const pathElements: number[] = pathStringToArray(path);
    const xpub = await this.client.getExtendedPubkey(false, pathElements);
    const xpubComponents = getXpubComponents(xpub);
    if (xpubComponents.version != xpubVersion) {
      throw new Error(
        `Expected xpub version ${xpubVersion} doesn't match the xpub version from the device ${xpubComponents.version}`
      );
    }
    return xpub;
  }

  /**
   * This method returns a public key, a bitcoin address, and and a chaincode
   * for a specific derivation path.
   *
   * Limitation: If the path is not a leaf node of a standard path, the address
   * will be the empty string "", see this.getWalletAddress() for details.
   */
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
    const xpub = await this.client.getExtendedPubkey(false, pathElements);

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
   * too much time to implement local address generation.
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
    const accountXpub = await this.client.getExtendedPubkey(false, accountPath);
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
   * Build and sign a transaction. See Btc.createPaymentTransactionNew for
   * details on how to use this method.
   *
   * This method will convert the legacy arguments, CreateTransactionArg, into
   * a psbt which is finally signed and finalized, and the extracted fully signed
   * transaction is returned.
   */
  async createPaymentTransactionNew(
    arg: CreateTransactionArg
  ): Promise<string> {
    const inputCount = arg.inputs.length;
    if (inputCount == 0) {
      throw Error("No inputs");
    }
    const psbt = new PsbtV2();

    const accountType = accountTypeFromArg(arg);

    if (arg.lockTime) {
      // The signer will assume locktime 0 if unset
      psbt.setGlobalFallbackLocktime(arg.lockTime);
    }
    psbt.setGlobalInputCount(inputCount);
    psbt.setGlobalPsbtVersion(2);
    psbt.setGlobalTxVersion(2);

    let notifyCount = 0;
    const progress = () => {
      if (!arg.onDeviceStreaming) return;
      arg.onDeviceStreaming({
        total: 2 * inputCount,
        index: notifyCount,
        progress: ++notifyCount / (2 * inputCount),
      });
    };

    // The master fingerprint is needed when adding BIP32 derivation paths on
    // the psbt.
    const masterFp = await this.client.getMasterFingerprint();
    let accountXpub = "";
    let accountPath: number[] = [];
    for (let i = 0; i < inputCount; i++) {
      progress();
      const pathElems: number[] = pathStringToArray(arg.associatedKeysets[i]);
      if (accountXpub == "") {
        // We assume all inputs belong to the same account so we set
        // the account xpub and path based on the first input.
        accountPath = pathElems.slice(0, -2);
        accountXpub = await this.client.getExtendedPubkey(false, accountPath);
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
    const changeData = await this.outputScriptAt(
      accountPath,
      accountType,
      arg.changePath
    );
    // If the caller supplied a changePath, we must make sure there actually is
    // a change output. If no change output found, we'll throw an error.
    let changeFound = !changeData;
    for (let i = 0; i < outputCount; i++) {
      const amount = Number(outputsBufferReader.readUInt64());
      const outputScript = outputsBufferReader.readVarSlice();
      psbt.setOutputAmount(i, amount);
      psbt.setOutputScript(i, outputScript);

      // We won't know if we're paying to ourselves, because there's no
      // information in arg to support multiple "change paths". One exception is
      // if there are multiple outputs to the change address.
      const isChange = changeData && outputScript.equals(changeData?.script);
      if (isChange) {
        changeFound = true;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const changePath = pathStringToArray(arg.changePath!);
        const pubkey = changeData.pubkey;

        if (accountType == AccountType.p2pkh) {
          psbt.setOutputBip32Derivation(i, pubkey, masterFp, changePath);
        } else if (accountType == AccountType.p2wpkh) {
          psbt.setOutputBip32Derivation(i, pubkey, masterFp, changePath);
        } else if (accountType == AccountType.p2wpkhWrapped) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          psbt.setOutputRedeemScript(i, changeData.redeemScript!);
          psbt.setOutputBip32Derivation(i, pubkey, masterFp, changePath);
        } else if (accountType == AccountType.p2tr) {
          psbt.setOutputTapBip32Derivation(i, pubkey, [], masterFp, changePath);
        }
      }
    }
    if (!changeFound) {
      throw new Error(
        "Change script not found among outputs! " +
          changeData?.script.toString("hex")
      );
    }

    const key = createKey(masterFp, accountPath, accountXpub);
    const p = new WalletPolicy(accountType, key);
    // This is cheating, because it's not actually requested on the
    // device yet, but it will be, soonish.
    if (arg.onDeviceSignatureRequested) arg.onDeviceSignatureRequested();

    let firstSigned = false;
    // This callback will be called once for each signature yielded.
    const progressCallback = () => {
      if (!firstSigned) {
        firstSigned = true;
        arg.onDeviceSignatureGranted && arg.onDeviceSignatureGranted();
      }
      progress();
    };

    await this.signPsbt(psbt, p, progressCallback);
    finalize(psbt);
    const serializedTx = extract(psbt);
    return serializedTx.toString("hex");
  }

  /**
   * Calculates an output script along with public key and possible redeemScript
   * from a path and accountType. The accountPath must be a prefix of path.
   *
   * @returns an object with output script (property "script"), redeemScript (if
   * wrapped p2wpkh), and pubkey at provided path. The values of these three
   * properties depend on the accountType used.
   */
  private async outputScriptAt(
    accountPath: number[],
    accountType: AccountType,
    path: string | undefined
  ): Promise<
    { script: Buffer; redeemScript?: Buffer; pubkey: Buffer } | undefined
  > {
    if (!path) return undefined;
    const pathElems = pathStringToArray(path);
    // Make sure path is in our account, otherwise something fishy is probably
    // going on.
    for (let i = 0; i < accountPath.length; i++) {
      if (accountPath[i] != pathElems[i]) {
        throw new Error(
          `Path ${path} not in account ${pathArrayToString(accountPath)}`
        );
      }
    }
    const xpub = await this.client.getExtendedPubkey(false, pathElems);
    let pubkey = pubkeyFromXpub(xpub);
    if (accountType == AccountType.p2tr) {
      pubkey = pubkey.slice(1);
    }
    const script = outputScriptOf(pubkey, accountType);
    return { ...script, pubkey };
  }

  /**
   * Adds relevant data about an input to the psbt. This includes sequence,
   * previous txid, output index, spent UTXO, redeem script for wrapped p2wpkh,
   * public key and its derivation path.
   */
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
    const xpubBase58 = await this.client.getExtendedPubkey(false, pathElements);

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
      const expectedRedeemScript = createRedeemScript(pubkey);
      if (redeemScript != expectedRedeemScript.toString("hex")) {
        throw new Error("Unexpected redeemScript");
      }
      psbt.setInputRedeemScript(i, expectedRedeemScript);
      psbt.setInputWitnessUtxo(i, spentOutput.amount, spentOutput.script);
    } else if (accountType == AccountType.p2tr) {
      const xonly = pubkey.slice(1);
      psbt.setInputTapBip32Derivation(i, xonly, [], masterFP, pathElements);
      psbt.setInputWitnessUtxo(i, spentOutput.amount, spentOutput.script);
    }

    psbt.setInputPreviousTxId(i, inputTxid);
    psbt.setInputOutputIndex(i, spentOutputIndex);
  }

  /**
   * This implements the "Signer" role of the BIP370 transaction signing
   * process.
   *
   * It ssks the hardware device to sign the a psbt using the specified wallet
   * policy. This method assumes BIP32 derived keys are used for all inputs, see
   * comment in-line. The signatures returned from the hardware device is added
   * to the appropriate input fields of the PSBT.
   */
  private async signPsbt(
    psbt: PsbtV2,
    walletPolicy: WalletPolicy,
    progressCallback: () => void
  ): Promise<void> {
    const sigs: Map<number, Buffer> = await this.client.signPsbt(
      psbt,
      walletPolicy,
      Buffer.alloc(32, 0),
      progressCallback
    );
    sigs.forEach((v, k) => {
      // Note: Looking at BIP32 derivation does not work in the generic case,
      // since some inputs might not have a BIP32-derived pubkey.
      const pubkeys = psbt.getInputKeyDatas(k, psbtIn.BIP32_DERIVATION);
      let pubkey;
      if (pubkeys.length != 1) {
        // No legacy BIP32_DERIVATION, assume we're using taproot.
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
  }
}

enum AccountType {
  p2pkh = "pkh(@0)",
  p2wpkh = "wpkh(@0)",
  p2wpkhWrapped = "sh(wpkh(@0))",
  p2tr = "tr(@0)",
}

function createRedeemScript(pubkey: Buffer): Buffer {
  const pubkeyHash = hashPublicKey(pubkey);
  return Buffer.concat([Buffer.from("0014", "hex"), pubkeyHash]);
}

/**
 * Generates a single signature scriptPubKey (output script) from a public key.
 * This is done differently depending on account type.
 *
 * If accountType is p2tr, the public key must be a 32 byte x-only taproot
 * pubkey, otherwise it's expected to be a 33 byte ecdsa compressed pubkey.
 */
function outputScriptOf(
  pubkey: Buffer,
  accountType: AccountType
): { script: Buffer; redeemScript?: Buffer } {
  const buf = new BufferWriter();
  const pubkeyHash = hashPublicKey(pubkey);
  let redeemScript: Buffer | undefined;
  if (accountType == AccountType.p2pkh) {
    buf.writeSlice(Buffer.of(OP_DUP, OP_HASH160, HASH_SIZE));
    buf.writeSlice(pubkeyHash);
    buf.writeSlice(Buffer.of(OP_EQUALVERIFY, OP_CHECKSIG));
  } else if (accountType == AccountType.p2wpkhWrapped) {
    redeemScript = createRedeemScript(pubkey);
    const scriptHash = hashPublicKey(redeemScript);
    buf.writeSlice(Buffer.of(OP_HASH160, HASH_SIZE));
    buf.writeSlice(scriptHash);
    buf.writeUInt8(OP_EQUAL);
  } else if (accountType == AccountType.p2wpkh) {
    buf.writeSlice(Buffer.of(0, HASH_SIZE));
    buf.writeSlice(pubkeyHash);
  } else if (accountType == AccountType.p2tr) {
    const outputKey = getTaprootOutputKey(pubkey);
    buf.writeSlice(Buffer.of(0x51, 32)); // push1, pubkeylen
    buf.writeSlice(outputKey);
  }
  return { script: buf.buffer(), redeemScript };
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

/*
The following two functions are copied from wallet-btc and adapted.
They should be moved to a library to avoid code reuse. 
*/
function hashTapTweak(x: Buffer): Buffer {
  // hash_tag(x) = SHA256(SHA256(tag) || SHA256(tag) || x), see BIP340
  // See https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki#specification
  const h = crypto.sha256(Buffer.from("TapTweak", "utf-8"));
  return crypto.sha256(Buffer.concat([h, h, x]));
}

/**
 * Calculates a taproot output key from an internal key. This output key will be
 * used as witness program in a taproot output. The internal key is tweaked
 * according to recommendation in BIP341:
 * https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki#cite_ref-22-0
 *
 * @param internalPubkey A 32 byte x-only taproot internal key
 * @returns The output key
 */
function getTaprootOutputKey(internalPubkey: Buffer): Buffer {
  if (internalPubkey.length != 32) {
    throw new Error("Expected 32 byte pubkey. Got " + internalPubkey.length);
  }
  // A BIP32 derived key can be converted to a schnorr pubkey by dropping
  // the first byte, which represent the oddness/evenness. In schnorr all
  // pubkeys are even.
  // https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki#public-key-conversion
  const evenEcdsaPubkey = Buffer.concat([Buffer.of(0x02), internalPubkey]);
  const tweak = hashTapTweak(internalPubkey);

  // Q = P + int(hash_TapTweak(bytes(P)))G
  const outputEcdsaKey = Buffer.from(pointAddScalar(evenEcdsaPubkey, tweak));
  // Convert to schnorr.
  const outputSchnorrKey = outputEcdsaKey.slice(1);
  // Create address
  return outputSchnorrKey;
}
