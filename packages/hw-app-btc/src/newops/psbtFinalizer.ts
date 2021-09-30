import { script } from "bitcoinjs-lib";
import { BufferWriter } from "bitcoinjs-lib/types/bufferutils";
import { OP_DUP, OP_HASH160 } from "../constants";
import { NoSuchEntry, psbtIn, PsbtV2 } from "./psbtv2";

/**
 * 
 * @param psbt The psbt with all signatures added as partial sigs, either through PSBT_IN_PARTIAL_SIG or PSBT_IN_TAP_KEY_SIG
 */
function finalize(psbt: PsbtV2) {
  // First check that each input has a signature and that the signature is from the correct pubkey
  const inputCount = psbt.getGlobalInputCount();
  for (let i = 0; i < inputCount; i++) {
    const legacyPubkeys = psbt.getInputKeyDatas(i, psbtIn.PARTIAL_SIG);
    const hasTaprootSig = psbt.isInputAvailable(i, psbtIn.TAP_KEY_SIG, Buffer.of())
    if (legacyPubkeys.length == 0 && !hasTaprootSig) {
      throw Error(`No signature for input ${i} present`);
    }
    if (legacyPubkeys.length > 0) {
      if (legacyPubkeys.length > 1) {
        throw Error(`Expected exactly one signature, got ${legacyPubkeys.length}`);
      }
      if (hasTaprootSig) {
        throw Error("Both taproot and non-taproot signatures present.");
      }

      const isSegwitV0 = psbt.isInputAvailable(i, psbtIn.WITNESS_UTXO, Buffer.of());
      const isWrappedSegwit = psbt.isInputAvailable(i, psbtIn.REDEEM_SCRIPT, Buffer.of());      
      const signature = psbt.getInputPartialSig(i, legacyPubkeys[0]);
      if (isSegwitV0) {
        const witnessBuf = new BufferWriter(Buffer.of());
        witnessBuf.writeVarInt(2);
        witnessBuf.writeVarInt(signature.length);
        witnessBuf.writeSlice(signature);
        witnessBuf.writeVarInt(legacyPubkeys[0].length);
        witnessBuf.writeSlice(legacyPubkeys[0]);
        psbt.setInputFinalScriptwitness(i, witnessBuf.buffer);                        
        if (isWrappedSegwit) {
          const scriptSig = new BufferWriter(Buffer.of());
          const redeemScript = psbt.getInputRedeemScript(i);          
          writePush(scriptSig, redeemScript);
          psbt.setInputFinalScriptsig(i, scriptSig.buffer);
        }
      } else {
        // Legacy input
        const scriptSig = new BufferWriter(Buffer.of());
        writePush(scriptSig, signature);
        writePush(scriptSig, legacyPubkeys[0]);
        psbt.setInputFinalScriptsig(i, scriptSig.buffer);
      }
      psbt.setInputPartialSig(i, legacyPubkeys[0], )
    } else { // Taproot input
      const signature = psbt.getInputTapKeySig(i)
      if (signature.length != 64) {
        throw Error("Unexpected length of schnorr signature.");
      }
      const witnessBuf = new BufferWriter(Buffer.of());
      witnessBuf.writeVarInt(1);
      witnessBuf.writeVarInt(64);
      witnessBuf.writeSlice(signature);
      psbt.setInputFinalScriptwitness(i, witnessBuf.buffer);
    }    
  }
}

function writePush(buf: BufferWriter, data: Buffer) {
  if (data.length <= 75) {
    buf.writeUInt8(data.length);
  } else if (data.length <= 256) {
    buf.writeUInt8(76);
    buf.writeUInt8(data.length);
  } else if (data.length <= 256*256) {
    buf.writeUInt8(77);
    const b = Buffer.alloc(2);
    b.writeUInt16LE(data.length, 0);
    buf.writeSlice(b);
  }
}