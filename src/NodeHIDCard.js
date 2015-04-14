/*
************************************************************************
Copyright (c) 2015 LEDGER
Adapted from code 
Copyright (c) 2013-2014 UBINITY SAS


Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*************************************************************************
*/

var Card = require('./Card');
var ByteString = require('./ByteString');
var Convert = require('./Convert');
var GP = require('./GP');
var HID = require('node-hid');
var Q = require('q');

var NodeHIDCard = function(terminal, device, ledgerTransport, timeout) {
	if (typeof timeout == "undefined") {
             timeout = 0;
        }
        this.deviceName = device;
        this.terminal = terminal;
        this.timeout = timeout;
        this.ledgerTransport = ledgerTransport;
        this.exchangeStack = [];
}
NodeHIDCard.prototype = new Card();

NodeHIDCard.prototype.connect_async = function() {
	var currentObject = this;
	this.device = new HID.HID(this.deviceName);
	this.connection = true;
        return Q.fcall(function() {
             return currentObject;
        });
}

NodeHIDCard.prototype.getTerminal = function() {
		return this.terminal;
}
	
NodeHIDCard.prototype.getAtr = function() {
		return new ByteString("", GP.HEX);
}
	
NodeHIDCard.prototype.beginExclusive = function() {
}
	
NodeHIDCard.prototype.endExclusive = function() {
}
	
NodeHIDCard.prototype.openLogicalChannel = function(channel) {
		throw "Not supported";
}

NodeHIDCard.prototype.exchange_async = function(apdu, returnLength) {
		var ledgerWrap = function(channel, command, packetSize) {
			var sequenceIdx = 0;
			var offset = 0;
			var tmp = Convert.toHexShort(channel);
			tmp += Convert.toHexByte(0x05); // TAG_APDU
			tmp += Convert.toHexShort(sequenceIdx);
			sequenceIdx++;
			tmp += Convert.toHexShort(command.length);							
			var result = new ByteString(tmp, GP.HEX);
			var blockSize = (command.length > packetSize - 7 ? packetSize - 7 : command.length);							
			result = result.concat(command.bytes(offset, blockSize));
			offset += blockSize;
			while (offset != command.length) {
				var tmp = Convert.toHexShort(channel);
				tmp += Convert.toHexByte(0x05); // TAG_APDU
				tmp += Convert.toHexShort(sequenceIdx);
				sequenceIdx++;
				result = result.concat(new ByteString(tmp, GP.HEX));
				var blockSize = (command.length - offset > packetSize - 5 ? packetSize - 5 : command.length - offset);
				result = result.concat(command.bytes(offset, blockSize));
				offset += blockSize;
			}
			var padding = "";
			while (((result.length + (padding.length / 2)) % packetSize) != 0) {
				padding += "00";
			}
			return result.concat(new ByteString(padding, GP.HEX));
		}

		var ledgerUnwrap = function(channel, data, packetSize) {
			var offset = 0;
			var responseLength;
			var sequenceIdx = 0;
			var response;
			if ((typeof data == "undefined") || (data.length < 7 + 5)) {
				return;
			}
			if (data.byteAt(offset++) != (channel >> 8)) {
				throw "Invalid channel;"
			}
			if (data.byteAt(offset++) != (channel & 0xff)) {
				throw "Invalid channel";
			}
			if (data.byteAt(offset++) != 0x05) {
				throw "Invalid tag";
			}
			if (data.byteAt(offset++) != 0x00) {
				throw "Invalid sequence";
			}
			if (data.byteAt(offset++) != 0x00) {
				throw "Invalid sequence";
			}
			responseLength = ((data.byteAt(offset++) & 0xff) << 8);
			responseLength |= (data.byteAt(offset++) & 0xff);
			if (data.length < 7 + responseLength) {
				return;
			}
			var blockSize = (responseLength > packetSize - 7 ? packetSize - 7 : responseLength);
			response = data.bytes(offset, blockSize);
			offset += blockSize;
			while (response.length != responseLength) {
				sequenceIdx++;
				if (offset == data.length) {
					return;
				}
				if (data.byteAt(offset++) != (channel >> 8)) {
					throw "Invalid channel;"
				}
				if (data.byteAt(offset++) != (channel & 0xff)) {
					throw "Invalid channel";
				}
				if (data.byteAt(offset++) != 0x05) {
					throw "Invalid tag";
				}
				if (data.byteAt(offset++) != (sequenceIdx >> 8)) {
					throw "Invalid sequence";
				}
				if (data.byteAt(offset++) != (sequenceIdx & 0xff)) {
					throw "Invalid sequence";
				}
				blockSize = (responseLength - response.length > packetSize - 5 ? packetSize - 5 : responseLength - response.length);
				if (blockSize > data.length - offset) {
					return;
				}
				response = response.concat(data.bytes(offset, blockSize));
				offset += blockSize;
			}
			return response;
		}

		var currentObject = this;
		if (!(apdu instanceof ByteString)) {
			throw "Invalid parameter";
		}
		if (!this.connection) {
			throw "Connection is not open";
		}

		var deferred = Q.defer();
		var exchangeTimeout;
		deferred.promise.apdu = apdu;
		deferred.promise.returnLength = returnLength;
		if (!this.ledgerTransport) {
			deferred.promise.transport = apdu;
		}
		else {
			deferred.promise.transport = ledgerWrap(0x0101, apdu, 64);
		}

		if (this.timeout != 0) {
			exchangeTimeout = setTimeout(function() { // Node.js supports timeouts
				debug("timeout");
				deferred.reject("timeout");
			}, this.timeout);
		}
                
		// enter the exchange wait list
		currentObject.exchangeStack.push(deferred);
                
		if (currentObject.exchangeStack.length == 1) {
			var processNextExchange = function() {
                    
				// don't pop it now, to avoid multiple at once
				var deferred = currentObject.exchangeStack[0];
                    
				// notify graphical listener
				if (typeof currentObject.listener != "undefined") {
					currentObject.listener.begin();
				}

				var send_async = function(cardObject, content) {
					var data = [];
					for (var i=0; i<content.length; i++) {
						data.push(content.byteAt(i));
					}
					cardObject.device.write(data);
        				return Q.fcall(function() {
             					return content.length;
        				});
				}

				var recv_async = function(cardObject, size) {
					return Q.ninvoke(cardObject.device, "read").then(function(res) {
						var data = "";
						for (var i=0; i<res.length; i++) {
							data += Convert.toHexByte(res[i]);
						}	
						return new ByteString(data, GP.HEX);
					});	
				}
                
				var performExchange = function() {
					if (currentObject.winusb) {
						return send_async(currentObject, deferred.promise.transport).then(
							function(result) {                      
								return recv_async(currentObject, 512);
							});
					}
					else {
						var deferredHidSend = Q.defer();
						var offsetSent = 0;
						var firstReceived = true;
						var toReceive = 0;

						var received = new ByteString("", GP.HEX);
						var sendPart = function() {
							if (offsetSent == deferred.promise.transport.length) {
								return receivePart();
							}
							var blockSize = (deferred.promise.transport.length - offsetSent > 64 ? 64 : deferred.promise.transport.length - offsetSent);
							var block = deferred.promise.transport.bytes(offsetSent, blockSize);
							var padding = "";
							var paddingSize = 64 - block.length;
							for (var i=0; i<paddingSize; i++) {
								padding += "00";
							}
							if (padding.length != 0) {
								block = block.concat(new ByteString(padding, GP.HEX));
							}
							return send_async(currentObject, block).then(
								function(result) {
									offsetSent += blockSize;
									return sendPart();
								}
							).fail(function(error) {
								deferredHidSend.reject(error);
							});
						}
						var receivePart = function() {
							if (!currentObject.ledgerTransport) {
								return recv_async(currentObject, 64).then(function(result) {
									received = received.concat(result);
									if (firstReceived) {
										firstReceived = false;
										if ((received.length == 2) || (received.byteAt(0) != 0x61)) {
											deferredHidSend.resolve(received);									
										}
										else {									
											toReceive = received.byteAt(1);
											if (toReceive == 0) {
												toReceive == 256;
											}
											toReceive += 2;
										}								
									}
									if (toReceive < 64) {
										deferredHidSend.resolve(received);									
									}
									else {
										toReceive -= 64;
										return receivePart();
									}
								}).fail(function(error) {
									deferredHidSend.reject(error);
								});
							}
							else {
								return recv_async(currentObject, 64).then(function(result) {
									received = received.concat(result);
									var response = ledgerUnwrap(0x0101, received, 64);
									if (typeof response != "undefined") {
										deferredHidSend.resolve(response);
									}
									else {
										return receivePart();
									}
								}).fail(function(error) {
									deferredHidSend.reject(error);
								});
							}
						}
						sendPart();
						return deferredHidSend.promise;
					}
				}
				performExchange().then(function(result) {
					var resultBin = result; 
					if (!currentObject.ledgerTransport) {
						if (resultBin.length == 2 || resultBin.byteAt(0) != 0x61) {
							deferred.promise.SW1 = resultBin.byteAt(0);
							deferred.promise.SW2 = resultBin.byteAt(1);
							deferred.promise.response = new ByteString("", GP.HEX);
						}
						else {
							var size = resultBin.byteAt(1);
							// fake T0 
							if (size == 0) { size = 256; }
							deferred.promise.response = resultBin.bytes(2, size);
							deferred.promise.SW1 = resultBin.byteAt(2 + size);
							deferred.promise.SW2 = resultBin.byteAt(2 + size + 1);
						}
					}
					else {
						deferred.promise.response = resultBin.bytes(0, resultBin.length - 2);
						deferred.promise.SW1 = resultBin.byteAt(resultBin.length - 2);
						deferred.promise.SW2 = resultBin.byteAt(resultBin.length - 1);
					}
					deferred.promise.SW = ((deferred.promise.SW1 << 8) + (deferred.promise.SW2));
					currentObject.SW1 = deferred.promise.SW1;
					currentObject.SW2 = deferred.promise.SW2;
					currentObject.SW = deferred.promise.SW;
					if (typeof currentObject.logger != "undefined") {
						currentObject.logger.log(currentObject.terminal.getName(), 0, deferred.promise.apdu, deferred.promise.response, deferred.promise.SW);
					}
					// build the response
					if (this.timeout != 0) {
						clearTimeout(exchangeTimeout);
					}
					deferred.resolve(deferred.promise.response);
				})
				.fail(function(err) { 
					if (this.timeout != 0) {
						clearTimeout(exchangeTimeout);
					}					
					deferred.reject(err);
				})
				.finally(function () { 
					// notify graphical listener
					if (typeof currentObject.listener != "undefined") {
						currentObject.listener.end();
					}

					// consume current promise
					currentObject.exchangeStack.shift();
                      
					// schedule next exchange
					if (currentObject.exchangeStack.length > 0) {
						processNextExchange();
					}
				});                    
            }; //processNextExchange
                  
			// schedule next exchange
			processNextExchange();
		}
                
		// the exchangeStack will process the promise when possible
		return deferred.promise;
}

NodeHIDCard.prototype.reset = function(mode) {
}	
	
NodeHIDCard.prototype.disconnect_async = function(mode) {
		var currentObject = this;		
		if (!this.connection) {
			return;
		}
		currentObject.device.close();
		currentObject.connection = false;
	        return Q.fcall(function() {
       		      return;
       		 });
}	
	
NodeHIDCard.prototype.getSW = function() {
		return this.SW;
}
	
NodeHIDCard.prototype.getSW1 = function() {
		return this.SW1;
}

NodeHIDCard.prototype.getSW2 = function() {
		return this.SW2;
}
	
NodeHIDCard.prototype.setCommandDelay = function(delay) {
		// unsupported - use options
}
	
NodeHIDCard.prototype.setReportDelay = function(delay) {
		// unsupported - use options
}
	
NodeHIDCard.prototype.getCommandDelay = function() {
		// unsupported - use options
		return 0;
}
	
NodeHIDCard.prototype.getReportDelay = function() {
		// unsupported - use options
		return 0;
}

module.exports = NodeHIDCard;

