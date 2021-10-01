import { BufferWriter } from "../buffertools";
import { psbtIn, PsbtV2 } from "./psbtv2";

function extract(psbt: PsbtV2) {
  const tx = new BufferWriter();
  tx.writeUInt32(psbt.getGlobalTxVersion());
  
  const isSegwit = !!psbt.getInputWitnessUtxo(0);
  if (isSegwit) {
    tx.writeSlice(Buffer.of(0, 1));
  }
  const inputCount = psbt.getGlobalInputCount();
  tx.writeVarInt(inputCount);
  for (let i = 0; i < inputCount; i++) {
    tx.writeSlice(psbt.getInputPreviousTxid(i));
    tx.writeUInt32(psbt.getInputOutputIndex(i));
    tx.writeVarSlice(psbt.getInputFinalScriptsig(i));
    tx.writeUInt32(psbt.getInputSequence(i));
    
  }
}