import type Transport from "@ledgerhq/hw-transport";
import { WitnessUtxo } from "bip174/src/lib/interfaces";
import bippath from "bip32-path";
import { BufferReader } from 'bitcoinjs-lib/types/bufferutils';
import { hash256 } from "bitcoinjs-lib/types/crypto";
import { pubkeyFromXpub } from "./bip32";
import Btc from "./Btc";
import type { CreateTransactionArg } from "./createTransaction";
import type { AddressFormat } from "./getWalletPublicKey";
import { getWalletPublicKey } from "./getWalletPublicKey";
import { hashPublicKey } from "./hashPublicKey";
import { NewProtocol } from "./newops/newProtocol";
import { createKey, DefaultDescriptorTemplate, WalletPolicy } from "./newops/policy";
import { PsbtV2 } from "./newops/psbtv2";
import { serializeTransaction } from "./serializeTransaction";
import type { Transaction } from "./types";

/**
 * Bitcoin API.
 *
 * @example
 * import Btc from "@ledgerhq/hw-app-btc";
 * const btc = new Btc(transport)
 */

export default class BtcNew extends Btc {
  constructor(transport: Transport, scrambleKey = "BTC") {
    super(transport, scrambleKey);
  }

  getWalletPublicKey(
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
    let options;
    if (arguments.length > 2 || typeof opts === "boolean") {
      console.warn(
        "btc.getWalletPublicKey deprecated signature used. Please switch to getWalletPublicKey(path, { format, verify })"
      );
      options = {
        verify: !!opts,
        // eslint-disable-next-line prefer-rest-params
        format: arguments[2] ? "p2sh" : "legacy",
      };
    } else {
      options = opts || {};
    }

    return getWalletPublicKey(this.transport, { ...options, path });
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
   * @param outputScriptHex is the hexadecimal serialized outputs of the transaction to sign
   * @param lockTime is the optional lockTime of the transaction to sign, or default (0)
   * @param sigHashType is the hash type of the transaction to sign, or default (all)
   * @param segwit is an optional boolean indicating wether to use segwit or not
   * @param initialTimestamp is an optional timestamp of the function call to use for coins that necessitate timestamps only, (not the one that the tx will include)
   * @param additionals list of additionnal options
   * 
   * - "bech32" for spending native segwit outputs
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
  createPaymentTransactionNew(arg: CreateTransactionArg): Promise<string> {
    if (arguments.length > 1) {
      console.warn(
        "@ledgerhq/hw-app-btc: createPaymentTransactionNew multi argument signature is deprecated. please switch to named parameters."
      );
    }
    if (arg.inputs.length == 0) {
      throw Error("No inputs");
    }    
    return this.createTransaction(arg);
  }
  async createTransaction(arg: CreateTransactionArg): Promise<string> {    
    const psbt = new PsbtV2();
    const newProtocol = new NewProtocol(this.transport);

    const outputsConcat = Buffer.from(arg.outputScriptHex, 'hex');
    const outputsBufferReader = new BufferReader(outputsConcat);
    const outputCount = outputsBufferReader.readVarInt(); 
    psbt.setGlobalTxVersion(2);
    
    if (arg.lockTime) {
      psbt.setGlobalFallbackLocktime(arg.lockTime);
    }

    psbt.setGlobalInputCount(arg.inputs.length);

    psbt.setGlobalOutputCount(outputCount);

    const psbtVersionNumberBuf = Buffer.of(2);
    psbt.setGlobalPsbtVersion(2);
    psbt.setGlobalTxVersion(2);

    // We assume all inputs belong to the same account, so we
    // figure out the descriptor template while iterating the inputs.
    // We only need one input, but we set it once for each input to
    // reduce amount of code.
    let descriptorTemplate: DefaultDescriptorTemplate = "wpkh(@0)";
    const masterFingerprint = await newProtocol.getMasterFingerprint();
    let accountXpub = "";
    let accountPath: number[] = [];    
    for (let i = 0; i < arg.inputs.length; i++) {
      const input = arg.inputs[i];
      const inputTx = input[0];
      const spentOutputIndex = input[1] as unknown as number;
      const redeemScript = input[2] as string;
      const sequence = input[3] as unknown as number;

      const inputTxBuffer = serializeTransaction(inputTx, true);
      const inputTxid = hash256(inputTxBuffer);

      const pathElements: number[] = bippath.fromString(arg.associatedKeysets[i]).toPathArray();
      if (accountXpub == "") {
        accountPath = pathElements.slice(0, -2);
        accountXpub = await newProtocol.getPubkey(false, accountPath);
      }
      const xpubBase58 = await newProtocol.getPubkey(false, pathElements);
      
      const pubkey = pubkeyFromXpub(xpubBase58);
      if (arg.segwit) {        
        if (!inputTx.outputs) {
          throw Error("Missing outputs array in transaction to sign")
        }
        const spentOutput = inputTx.outputs[spentOutputIndex];
        const segwitVersion = spentOutput.script.readUInt8(0)
        if (segwitVersion == 0) {
          psbt.setInputNonWitnessUtxo(i, inputTxBuffer);
          const isWrappedSegwit = !arg.additionals.includes("bech32");
          if (isWrappedSegwit) {       
            descriptorTemplate = "sh(pkh(@0))";
            psbt.setInputRedeemScript(i, this.createRedeemScript(pubkey));
          }
          psbt.setInputBip32Derivation(i, pubkey, masterFingerprint, pathElements);
        } else {
          descriptorTemplate = "tr(@0)";
          psbt.setInputTapBip32Derivation(i, pubkey, [], masterFingerprint, pathElements)
        }
        psbt.setInputWitnessUtxo(i, spentOutput.amount, spentOutput.script)        
      } else {
        descriptorTemplate = "pkh(@0)"
        psbt.setInputNonWitnessUtxo(i, inputTxBuffer);
        psbt.setInputBip32Derivation(i, pubkey, masterFingerprint, pathElements);
      }

      psbt.setInputPreviousTxId(i, inputTxid);
      psbt.setInputOutputIndex(i, spentOutputIndex);      
    }

    for (let i = 0; i < outputCount; i++) {
      const amount = outputsBufferReader.readSlice(8);
      const outputScript = outputsBufferReader.readVarSlice();

      // The wallet always places the change output last.
      // But we won't know if we're paying to ourselves, because
      // we'd have one output at index <outputCount-1 for ourselves
      // and one change output.
      const isChange = arg.changePath && i == outputCount-1;
      if (isChange) {
        const derivationPath = bippath.fromString(arg.changePath).toPathArray();
        const xpubBase58 = await newProtocol.getPubkey(false, derivationPath);
        const pubkey = pubkeyFromXpub(xpubBase58);

        if (arg.segwit) {
          const isWrappedSegwit = !arg.additionals.includes("bech32");
          let segwitVersion = 0;
          if (isWrappedSegwit) { // wrapped p2wphk, only v0 can use wrapping
            psbt.setOutputRedeemScript(i, this.createRedeemScript(pubkey));
          } else {
            segwitVersion = outputScript.readUInt8(0);
          }
          if (segwitVersion == 0) { // p2wpkh or wrapped p2wphk               
            psbt.setOutputBip32Derivation(i, pubkey, masterFingerprint, derivationPath);
          } else { // p2tr
            psbt.setOutputTapBip32Derivation(i, pubkey, [], masterFingerprint, derivationPath);
          }
        } else { // p2pkh
          psbt.setOutputBip32Derivation(i, pubkey, masterFingerprint, derivationPath);
        }
      }
      psbt.setOutputAmount(i, amount);
      psbt.setOutputScript(i, outputScript);      
    }
    
    const p = new WalletPolicy(descriptorTemplate, createKey(masterFingerprint, accountPath, accountXpub));
    this.signPsbt(psbt, p);
    return "";
  }  

  private signPsbt(psbt: PsbtV2, walletPolicy: WalletPolicy) {
    const newProtocol = new NewProtocol(this.transport);
    newProtocol.signPsbt(psbt, walletPolicy);
  }

  private createRedeemScript(pubkey: Buffer): Buffer {
    const pubkeyHash = hashPublicKey(pubkey);        
    return Buffer.concat([Buffer.from("160014", "hex"), pubkeyHash]);
  }

  private createWitnessUtxo(inputTx: Transaction, outputIndex: number): WitnessUtxo {
    if (!inputTx.outputs) {
      throw Error(`No outputs in spent tx`)
    }
    if (inputTx.outputs.length <= outputIndex) {
      throw Error(`Spent output index ${outputIndex} doesn't exist`)
    }
    const spentOutput = inputTx.outputs[outputIndex];    
    const amount = spentOutput.amount.readIntBE(0, 8)
    const witnessUtxo: WitnessUtxo = {script: spentOutput.script, value: amount}
    return witnessUtxo;
  }
}
