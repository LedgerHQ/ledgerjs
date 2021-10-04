import { BufferWriter } from "../buffertools";
import { PsbtV2 } from "./psbtv2";

function extract(psbt: PsbtV2): Buffer {
  const tx = new BufferWriter();
  tx.writeUInt32(psbt.getGlobalTxVersion());
  
  const isSegwit = !!psbt.getInputWitnessUtxo(0);
  if (isSegwit) {
    tx.writeSlice(Buffer.of(0, 1));
  }
  const inputCount = psbt.getGlobalInputCount();
  tx.writeVarInt(inputCount);
  const witnessWriter = new BufferWriter();
  let lockTime = 0;
  for (let i = 0; i < inputCount; i++) {
    tx.writeSlice(psbt.getInputPreviousTxid(i));
    tx.writeUInt32(psbt.getInputOutputIndex(i));
    tx.writeVarSlice(psbt.getInputFinalScriptsig(i));
    tx.writeUInt32(psbt.getInputSequence(i));        
    if (isSegwit) {
      witnessWriter.writeSlice(psbt.getInputFinalScriptwitness(i));
    } 
  }
  const outputCount = psbt.getGlobalOutputCount();
  tx.writeVarInt(outputCount);
  for (let i = 0; i < outputCount; i++) {
    const amount = psbt.getOutputAmount(i);
    const amountBuf = Buffer.alloc(8);
    amountBuf.writeBigInt64LE(BigInt(amount), 0);
    tx.writeSlice(amountBuf);
    tx.writeVarSlice(psbt.getOutputScript(i));
  }
  tx.writeSlice(witnessWriter.buffer());
  tx.writeUInt32(psbt.getGlobalFallbackLocktime() ?? 0);
  return tx.buffer();
}