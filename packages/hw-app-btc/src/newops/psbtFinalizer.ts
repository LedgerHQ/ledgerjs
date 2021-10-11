import { BufferWriter } from "../buffertools";
import { psbtIn, PsbtV2 } from "./psbtv2";

/**
 *
 * @param psbt The psbt with all signatures added as partial sigs, either through PSBT_IN_PARTIAL_SIG or PSBT_IN_TAP_KEY_SIG
 */
export function finalize(psbt: PsbtV2): void {
  // First check that each input has a signature
  const inputCount = psbt.getGlobalInputCount();
  for (let i = 0; i < inputCount; i++) {
    const legacyPubkeys = psbt.getInputKeyDatas(i, psbtIn.PARTIAL_SIG);
    const taprootSig = psbt.getInputTapKeySig(i);
    if (legacyPubkeys.length == 0 && !taprootSig) {
      throw Error(`No signature for input ${i} present`);
    }
    if (legacyPubkeys.length > 0) {
      if (legacyPubkeys.length > 1) {
        throw Error(
          `Expected exactly one signature, got ${legacyPubkeys.length}`
        );
      }
      if (taprootSig) {
        throw Error("Both taproot and non-taproot signatures present.");
      }

      const isSegwitV0 = !!psbt.getInputWitnessUtxo(i);
      const redeemScript = psbt.getInputRedeemScript(i);
      const isWrappedSegwit = !!redeemScript;
      const signature = psbt.getInputPartialSig(i, legacyPubkeys[0]);
      if (!signature)
        throw new Error("Expected partial signature for input " + i);
      if (isSegwitV0) {
        const witnessBuf = new BufferWriter();
        witnessBuf.writeVarInt(2);
        witnessBuf.writeVarInt(signature.length);
        witnessBuf.writeSlice(signature);
        witnessBuf.writeVarInt(legacyPubkeys[0].length);
        witnessBuf.writeSlice(legacyPubkeys[0]);
        psbt.setInputFinalScriptwitness(i, witnessBuf.buffer());
        if (isWrappedSegwit) {
          if (!redeemScript || redeemScript.length == 0) {
            throw new Error(
              "Expected non-empty redeemscript. Can't finalize intput " + i
            );
          }
          const scriptSigBuf = new BufferWriter();
          // Push redeemScript length
          scriptSigBuf.writeUInt8(redeemScript.length);
          scriptSigBuf.writeSlice(redeemScript);
          psbt.setInputFinalScriptsig(i, scriptSigBuf.buffer());
        }
      } else {
        // Legacy input
        const scriptSig = new BufferWriter();
        writePush(scriptSig, signature);
        writePush(scriptSig, legacyPubkeys[0]);
        psbt.setInputFinalScriptsig(i, scriptSig.buffer());
      }
    } else {
      // Taproot input
      const signature = psbt.getInputTapKeySig(i);
      if (!signature) {
        throw Error("No taproot signature found");
      }
      if (signature.length != 64) {
        throw Error("Unexpected length of schnorr signature.");
      }
      const witnessBuf = new BufferWriter();
      witnessBuf.writeVarInt(1);
      witnessBuf.writeVarInt(64);
      witnessBuf.writeSlice(signature);
      psbt.setInputFinalScriptwitness(i, witnessBuf.buffer());
    }
    clearFinalizedInput(psbt, i);
  }
}

function clearFinalizedInput(psbt: PsbtV2, inputIndex: number) {
  const keyTypes = [
    psbtIn.BIP32_DERIVATION,
    psbtIn.PARTIAL_SIG,
    psbtIn.TAP_BIP32_DERIVATION,
    psbtIn.TAP_KEY_SIG,
  ];
  const witnessUtxoAvailable = !!psbt.getInputWitnessUtxo(inputIndex);
  const nonWitnessUtxoAvailable = !!psbt.getInputNonWitnessUtxo(inputIndex);
  if (witnessUtxoAvailable && nonWitnessUtxoAvailable) {
    // Remove NON_WITNESS_UTXO for segwit v0 as it's only needed while signing.
    // Segwit v1 doesn't have NON_WITNESS_UTXO set.
    // See https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki#cite_note-7
    keyTypes.push(psbtIn.NON_WITNESS_UTXO);
  }
  psbt.deleteInputEntries(inputIndex, keyTypes);
}

function writePush(buf: BufferWriter, data: Buffer) {
  if (data.length <= 75) {
    buf.writeUInt8(data.length);
  } else if (data.length <= 256) {
    buf.writeUInt8(76);
    buf.writeUInt8(data.length);
  } else if (data.length <= 256 * 256) {
    buf.writeUInt8(77);
    const b = Buffer.alloc(2);
    b.writeUInt16LE(data.length, 0);
    buf.writeSlice(b);
  }
  buf.writeSlice(data);
}
