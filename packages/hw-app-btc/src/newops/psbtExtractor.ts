import { bip32asBuffer } from "../bip32";
import { BufferWriter } from "../buffertools";
import { PsbtV2 } from "./psbtv2";

export function extract(psbt: PsbtV2): Buffer {
  const tx = new BufferWriter();
  tx.writeUInt32(psbt.getGlobalTxVersion());

  const isSegwit = !!psbt.getInputWitnessUtxo(0);
  if (isSegwit) {
    tx.writeSlice(Buffer.of(0, 1));
  }
  const inputCount = psbt.getGlobalInputCount();
  tx.writeVarInt(inputCount);
  const witnessWriter = new BufferWriter();
  for (let i = 0; i < inputCount; i++) {
    tx.writeSlice(psbt.getInputPreviousTxid(i));
    tx.writeUInt32(psbt.getInputOutputIndex(i));
    tx.writeVarSlice(psbt.getInputFinalScriptsig(i) ?? Buffer.of());
    tx.writeUInt32(psbt.getInputSequence(i));
    if (isSegwit) {
      witnessWriter.writeSlice(psbt.getInputFinalScriptwitness(i));
    }
  }
  const outputCount = psbt.getGlobalOutputCount();
  tx.writeVarInt(outputCount);
  for (let i = 0; i < outputCount; i++) {
    tx.writeUInt64(BigInt(psbt.getOutputAmount(i)));
    tx.writeVarSlice(psbt.getOutputScript(i));
  }
  tx.writeSlice(witnessWriter.buffer());
  tx.writeUInt32(psbt.getGlobalFallbackLocktime() ?? 0);
  return tx.buffer();
}
