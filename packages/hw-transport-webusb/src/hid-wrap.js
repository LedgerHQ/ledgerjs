// @flow

import { TransportError } from "@ledgerhq/hw-transport";

export function ledgerWrap(channel, command, packetSize) {
  let sequenceIdx = 0;
  let offset = 0;

  let tmp = Buffer.alloc(7);
  tmp.writeUInt16BE(channel, 0); // TODO identify one instance of transport, use random
  tmp[2] = 0x05; // TAG_APDU
  tmp.writeUInt16BE(sequenceIdx, 3);
  sequenceIdx++;
  tmp.writeUInt16BE(command.length, 5);
  let blockSize =
    command.length > packetSize - 7 ? packetSize - 7 : command.length;
  let result = Buffer.concat(
    [tmp, command.slice(offset, offset + blockSize)],
    blockSize + 7
  );
  offset += blockSize;
  while (offset !== command.length) {
    tmp = Buffer.alloc(5);
    tmp.writeUInt16BE(channel, 0);
    tmp[2] = 0x05; // TAG_APDU
    tmp.writeUInt16BE(sequenceIdx, 3);
    sequenceIdx++;
    blockSize =
      command.length - offset > packetSize - 5
        ? packetSize - 5
        : command.length - offset;
    result = Buffer.concat(
      [result, tmp, command.slice(offset, offset + blockSize)],
      result.length + blockSize + 5
    );
    offset += blockSize;
  }
  return result;
}

export function ledgerUnwrap(channel, data, packetSize) {
  let offset = 0;
  let responseLength;
  let sequenceIdx = 0;
  let response;
  if (typeof data === "undefined" || data.length < 7 + 5) {
    return;
  }
  if (data[offset++] !== channel >> 8) {
    throw new TransportError("Invalid channel", "InvalidChannel");
  }
  if (data[offset++] !== (channel & 0xff)) {
    throw new TransportError("Invalid channel", "InvalidChannel");
  }
  if (data[offset++] !== 0x05) {
    throw new TransportError("Invalid tag", "InvalidTag");
  }
  if (data[offset++] !== 0x00) {
    throw new TransportError("Invalid sequence", "InvalidSequence");
  }
  if (data[offset++] !== 0x00) {
    throw new TransportError("Invalid sequence", "InvalidSequence");
  }
  responseLength = (data[offset++] & 0xff) << 8;
  responseLength |= data[offset++] & 0xff;
  if (data.length < 7 + responseLength) {
    return;
  }
  let blockSize =
    responseLength > packetSize - 7 ? packetSize - 7 : responseLength;
  response = data.slice(offset, offset + blockSize);
  offset += blockSize;
  while (response.length !== responseLength) {
    sequenceIdx++;
    if (offset === data.length) {
      return;
    }
    if (data[offset++] !== channel >> 8) {
      throw new TransportError("Invalid channel", "InvalidChannel");
    }
    if (data[offset++] !== (channel & 0xff)) {
      throw new TransportError("Invalid channel", "InvalidChannel");
    }
    if (data[offset++] !== 0x05) {
      throw new TransportError("Invalid tag", "InvalidTag");
    }
    if (data[offset++] !== sequenceIdx >> 8) {
      throw new TransportError("Invalid sequence", "InvalidSequence");
    }
    if (data[offset++] !== (sequenceIdx & 0xff)) {
      throw new TransportError("Invalid sequence", "InvalidSequence");
    }
    blockSize =
      responseLength - response.length > packetSize - 5
        ? packetSize - 5
        : responseLength - response.length;
    if (blockSize > data.length - offset) {
      return;
    }
    response = Buffer.concat(
      [response, data.slice(offset, offset + blockSize)],
      response.length + blockSize
    );
    offset += blockSize;
  }
  return response;
}
