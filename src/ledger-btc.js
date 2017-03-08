/********************************************************************************
*   Ledger Node JS API
*   (c) 2016-2017 Ledger
*
*  Licensed under the Apache License, Version 2.0 (the "License");
*  you may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
********************************************************************************/

'use strict';

var Q = require('q');
var async = require('async');
var utils = require('./utils');

var LedgerBtc = function(comm) {	
	this.comm = comm;
	this.comm.setScrambleKey('BTC');
}

LedgerBtc.prototype.getWalletPublicKey_async = function(path) {
	var splitPath = utils.splitPath(path);
	var buffer = Buffer.alloc(5 + 1 + splitPath.length * 4);
	buffer[0] = 0xe0;
	buffer[1] = 0x40;
	buffer[2] = 0x00;
	buffer[3] = 0x00;
	buffer[4] = 1 + splitPath.length * 4;
	buffer[5] = splitPath.length;
	splitPath.forEach(function (element, index) {
		buffer.writeUInt32BE(element, 6 + 4 * index);
	});
	var self = this;
	return this.comm.exchange(buffer.toString('hex'), [0x9000]).then(function(response) {
		var result = {};
		response = Buffer.from(response, 'hex');
		var publicKeyLength = response[0];
		var addressLength = response[1 + publicKeyLength];
		result['publicKey'] = response.slice(1, 1 + publicKeyLength).toString('hex');
		result['bitcoinAddress'] = response.slice(1 + publicKeyLength + 1, 1 + publicKeyLength + 1 + addressLength).toString('ascii');
		result['chainCode'] = response.slice(1 + publicKeyLength + 1 + addressLength, 1 + publicKeyLength + 1 + addressLength + 32).toString('hex');
		return result;

	});
}

LedgerBtc.prototype.getTrustedInputRaw_async = function(firstRound, indexLookup, transactionData) {
	var data;
	if (firstRound) {
			var prefix = Buffer.alloc(4);
			prefix.writeUInt32BE(indexLookup, 0);
			data = Buffer.concat([prefix, transactionData], transactionData.length + 4);
		}
		else {
			data = transactionData;
		}
		var buffer = Buffer.alloc(5);
		buffer[0] = 0xe0;
		buffer[1] = 0x42;
		buffer[2] = (firstRound ? 0x00 : 0x80);
		buffer[3] = 0x00;
		buffer[4] = data.length;
		buffer = Buffer.concat([buffer, data], 5 + data.length);
		return this.comm.exchange(buffer.toString('hex'), [0x9000]).then(function(trustedInput) {
			return trustedInput.substring(0, trustedInput.length - 4);
		});
}

LedgerBtc.prototype.getTrustedInput_async = function(indexLookup, transaction) {
	var currentObject = this;
	var deferred = Q.defer();
	var processScriptBlocks = function(script, sequence) {          	
		var internalPromise = Q.defer();
		var scriptBlocks = [];
		var offset = 0;
		while (offset != script.length) {
			var blockSize = (script.length - offset > LedgerBtc.MAX_SCRIPT_BLOCK ? 
				LedgerBtc.MAX_SCRIPT_BLOCK : script.length - offset);
			if ((offset + blockSize) != script.length) {
				scriptBlocks.push(script.slice(offset, offset + blockSize));
			}
			else {
				scriptBlocks.push(Buffer.concat([script.slice(offset, offset + blockSize), sequence]));
			}
			offset += blockSize;
		}
		async.eachSeries(
			scriptBlocks,
			function(scriptBlock, finishedCallback) {
				currentObject.getTrustedInputRaw_async(false, undefined, scriptBlock).then(function (result) {
					finishedCallback();
				}).fail(function (err) { internalPromise.reject(err); });
			},
			function(finished) {          	  		
				internalPromise.resolve();
			}
		);
		return internalPromise.promise;
	}
	var processInputs = function() {
		async.eachSeries(
			transaction['inputs'], 
			function (input, finishedCallback) {
				data = Buffer.concat([input['prevout'], currentObject.createVarint(input['script'].length)]);   
				currentObject.getTrustedInputRaw_async(false, undefined, data).then(function (result) {
					// iteration (eachSeries) ended
					// TODO notify progress
					// deferred.notify("input");
					processScriptBlocks(input['script'], input['sequence']).then(function (result) {  	
						finishedCallback();
					}).fail(function(err) { deferred.reject(err); });
				}).fail(function (err) { deferred.reject(err); });
			},
			function(finished) {
				data = currentObject.createVarint(transaction['outputs'].length);
				currentObject.getTrustedInputRaw_async(false, undefined, data).then(function (result) {
					processOutputs();
				}).fail(function (err) { deferred.reject(err); });
			}
		);          	
	}
	var processOutputs = function() {
		async.eachSeries(
			transaction['outputs'],
			function(output, finishedCallback) {
				data = output['amount'];
				data = Buffer.concat([data, currentObject.createVarint(output['script'].length), output['script']]);
				currentObject.getTrustedInputRaw_async(false, undefined, data).then(function(result) {
					// iteration (eachSeries) ended
					// TODO notify progress
					// deferred.notify("output");
					finishedCallback();
				}).fail(function (err) { deferred.reject(err); });
			},
			function(finished) {
				data = transaction['locktime'];
				currentObject.getTrustedInputRaw_async(false, undefined, data).then (function(result) {
					deferred.resolve(result);
				}).fail(function (err) { deferred.reject(err); });
			}
		);          	
	}
	var data = Buffer.concat([transaction['version'], currentObject.createVarint(transaction['inputs'].length)]);
	currentObject.getTrustedInputRaw_async(true, indexLookup, data).then(function (result) {
		processInputs();
	}).fail(function (err) { deferred.reject(err); });
	// return the promise to be resolve when the trusted input has been processed completely
	return deferred.promise;
}

LedgerBtc.prototype.getVarint = function(data, offset) {
	if (data[offset] < 0xfd) {
		return [ data[offset], 1 ];
	}
	if (data[offset] == 0xfd) {
		return [ ((data[offset + 2] << 8) + data[offset + 1]), 3 ];
	}
	if (data[offset] == 0xfe) {
		return [ ((data[offset + 4] << 24) + (data[offset + 3] << 16) + 
			(data[offset + 2] << 8) + data[offset + 1]), 5 ];
	}
}

LedgerBtc.prototype.startUntrustedHashTransactionInputRaw_async = function (newTransaction, firstRound, transactionData) {
	var buffer = Buffer.alloc(5);
		buffer[0] = 0xe0;
		buffer[1] = 0x44;
		buffer[2] = (firstRound ? 0x00 : 0x80);
		buffer[3] = (newTransaction ? 0x00 : 0x80);
		buffer[4] = transactionData.length;
		buffer = Buffer.concat([buffer, transactionData], 5 + transactionData.length);
		return this.comm.exchange(buffer.toString('hex'), [0x9000]);
}

LedgerBtc.prototype.startUntrustedHashTransactionInput_async = function (newTransaction, transaction, inputs) {
	var currentObject = this;
	var data = Buffer.concat([transaction['version'],
	currentObject.createVarint(transaction['inputs'].length)]);
	var deferred = Q.defer();
	currentObject.startUntrustedHashTransactionInputRaw_async(newTransaction, true, data).then(function (result) {
		var i = 0;
		async.eachSeries(
			transaction['inputs'],
			function (input, finishedCallback) {
				var inputKey;
				// TODO : segwit
				var prefix;
				if (inputs[i]['trustedInput']) {
					prefix = Buffer.alloc(2);
					prefix[0] = 0x01;
					prefix[1] = inputs[i]['value'].length;		
				}
				else {
					prefix = Buffer.alloc(1);
					prefix[0] = 0x00;
				}
				data = Buffer.concat([prefix, inputs[i]['value'], currentObject.createVarint(input['script'].length)]);
				currentObject.startUntrustedHashTransactionInputRaw_async(newTransaction, false, data).then(function (result) {

					var scriptBlocks = [];
					var offset = 0;
					if (input['script'].length == 0) {
						scriptBlocks.push(input['sequence']);						
					}
					else {
						while (offset != input['script'].length) {
							var blockSize = (input['script'].length - offset > LedgerBtc.MAX_SCRIPT_BLOCK ? 
								LedgerBtc.MAX_SCRIPT_BLOCK : input['script'].length - offset);
							if ((offset + blockSize) != input['script'].length) {
								scriptBlocks.push(input['script'].slice(offset, offset + blockSize));
							}
							else {
								scriptBlocks.push(Buffer.concat([input['script'].slice(offset, offset + blockSize), input['sequence']]));
							}
							offset += blockSize;
						}
					}
					async.eachSeries(
						scriptBlocks,
						function(scriptBlock, blockFinishedCallback) {
							currentObject.startUntrustedHashTransactionInputRaw_async(newTransaction, false, scriptBlock).then(function (result) {
							blockFinishedCallback();
							}).fail(function (err) { deferred.reject(err); });
						},
						function(finished) { 
							i++;
							finishedCallback();
						}
					);
				}).fail(function (err) {
					deferred.reject(err);
				});
			},
			function (finished) {
				deferred.resolve(finished);
			}
		)
	}).fail(function (err) {
		deferred.reject(err);
	});
	// return the notified object at end of the loop
	return deferred.promise;
}

LedgerBtc.prototype.provideOutputFullChangePath_async = function(path) {
	var splitPath = utils.splitPath(path);
	var buffer = Buffer.alloc(5 + 1 + splitPath.length * 4);
	buffer[0] = 0xe0;
	buffer[1] = 0x4a;
	buffer[2] = 0xff;
	buffer[3] = 0x00;
	buffer[4] = 1 + splitPath.length * 4;
	buffer[5] = splitPath.length;
	splitPath.forEach(function (element, index) {
		buffer.writeUInt32BE(element, 6 + 4 * index);
	});
	var self = this;
	return this.comm.exchange(buffer.toString('hex'), [0x9000]);
}

LedgerBtc.prototype.hashOutputFull_async = function(outputScript) {
	var offset = 0;
	var self = this;

	return utils.asyncWhile(function () {return offset < outputScript.length;}, function () {
		var blockSize = ((offset + LedgerBtc.MAX_SCRIPT_BLOCK) >= outputScript.length ? outputScript.length - offset : LedgerBtc.MAX_SCRIPT_BLOCK);
		var p1 = ((offset + blockSize) == outputScript.length ? 0x80 : 0x00);
		var prefix = Buffer.alloc(5);
		prefix[0] = 0xe0;
		prefix[1] = 0x4a;
		prefix[2] = p1;
		prefix[3] = 0x00;
		prefix[4] = blockSize;
		var data = Buffer.concat([prefix, outputScript.slice(offset, offset + blockSize)]);
		return self.comm.exchange(data.toString('hex'), [0x9000]).then(function(data) {
			offset += blockSize;
		});
	});
}

LedgerBtc.prototype.signTransaction_async = function (path, lockTime, sigHashType) {
	if (typeof lockTime == "undefined") {
		lockTime = LedgerBtc.DEFAULT_LOCKTIME;
	}
	if (typeof sigHashType == "undefined") {
		sigHashType = LedgerBtc.SIGHASH_ALL;
	}
	var splitPath = utils.splitPath(path);
	var buffer = Buffer.alloc(5 + 1 + splitPath.length * 4 + 1 + 4 + 1);
	var offset = 0;
	buffer[offset++] = 0xe0;
	buffer[offset++] = 0x48;
	buffer[offset++] = 0x00;
	buffer[offset++] = 0x00;
	buffer[offset++] = 1 + splitPath.length * 4 + 1 + 4 + 1;
	buffer[offset++] = splitPath.length;
	splitPath.forEach(function (element) {
		buffer.writeUInt32BE(element, offset);
		offset += 4;
	});
	buffer[offset++] = 0x00; // authorization length
	buffer.writeUInt32LE(lockTime, offset);
	offset += 4;
	buffer[offset++] = sigHashType;
	var self = this;
	return self.comm.exchange(buffer.toString('hex'), [0x9000]).then(function(signature) {
		var result = Buffer.from(signature, 'hex');
		result[0] = 0x30;
		return result.slice(0, result.length - 2);
	})
}

LedgerBtc.prototype.signMessageNew_async = function(path, messageHex) {
	var splitPath = utils.splitPath(path);
	var offset = 0;
	var message = new Buffer(messageHex, 'hex');
	var apdus = [];
	var response = [];
	var self = this;	
	while (offset != message.length) {
		var maxChunkSize = (offset == 0 ? (LedgerBtc.MAX_SCRIPT_BLOCK - 1 - splitPath.length * 4 - 4) : LedgerBtc.MAX_SCRIPT_BLOCK);
		var chunkSize = (offset + maxChunkSize > message.length ? message.length - offset : maxChunkSize);
		var buffer = new Buffer(offset == 0 ? 5 + 1 + splitPath.length * 4 + 2 + chunkSize : 5 + chunkSize);
		buffer[0] = 0xe0;
		buffer[1] = 0x4e;
		buffer[2] = 0x00;
		buffer[3] = (offset == 0 ? 0x01 : 0x80);
		buffer[4] = (offset == 0 ? 1 + splitPath.length * 4 + 2 + chunkSize : chunkSize);
		if (offset == 0) {
			buffer[5] = splitPath.length;
			splitPath.forEach(function (element, index) {
				buffer.writeUInt32BE(element, 6 + 4 * index);
			});
			buffer.writeUInt16BE(message.length, 6 + 4 * splitPath.length);
			message.copy(buffer, 6 + 4 * splitPath.length + 2, offset, offset + chunkSize);
		}
		else {
			message.copy(buffer, 5, offset, offset + chunkSize);
		}
		apdus.push(buffer.toString('hex'));
		offset += chunkSize;
	}
	return utils.foreach(apdus, function(apdu) {
		return self.comm.exchange(apdu, [0x9000]).then(function(apduResponse) {
			response = apduResponse;
		})
	}).then(function() {		
		buffer = Buffer.alloc(6);
		buffer[0] = 0xe0;
		buffer[1] = 0x4e;
		buffer[2] = 0x80;
		buffer[3] = 0x00;
		buffer[4] = 0x01;
		buffer[5] = 0x00;
		return self.comm.exchange(buffer.toString('hex'), [0x9000]).then(function(apduResponse) {
				var response = Buffer.from(apduResponse, 'hex');
				var result = {};
				result['v'] = response[0] - 0x30;
				var r = response.slice(4, 4 + response[3]);
				if (r[0] == 0) {
					r = r.slice(1);
				}
				result['r'] = r.toString('hex');
				var offset = 4 + response[3] + 2;
				var s = response.slice(offset, offset + response[offset - 1]);
				if (s[0] == 0) {
					s = s.slice(1);
				}				
				result['s'] = s.toString('hex');
				return result;
		})
	})		
}

LedgerBtc.prototype.createPaymentTransactionNew_async = function(inputs, associatedKeysets, changePath, outputScript, lockTime, sigHashType) {
	// Inputs are provided as arrays of [transaction, output_index, optional redeem script, optional sequence]
	// associatedKeysets are provided as arrays of [path]	
	var nullScript = Buffer.alloc(0);
	var defaultVersion = Buffer.alloc(4);	
	defaultVersion.writeUInt32LE(1, 0);
	var trustedInputs = [];
	var regularOutputs = [];
	var signatures = [];
	var publicKeys = [];
	var firstRun = true;
	var resuming = false;
	var self = this;
	var targetTransaction = {};

	outputScript = Buffer.from(outputScript, 'hex');

	if (typeof lockTime == "undefined") {
		lockTime = LedgerBtc.DEFAULT_LOCKTIME;
	}
	if (typeof sigHashType == "undefined") {
		sigHashType = LedgerBtc.SIGHASH_ALL;
	}

	var deferred = Q.defer();

	utils.foreach(inputs, function (input, i) {
		return utils.doIf(!resuming, function () {
			return self.getTrustedInput_async(input[1], input[0])
				.then(function (trustedInput) {
						var inputItem = {};
						inputItem['trustedInput'] = true;
						inputItem['value'] = Buffer.from(trustedInput, 'hex');
						trustedInputs.push(inputItem);
				});
		}).then(function () {
			regularOutputs.push(input[0].outputs[input[1]]);
		});
	}).then(function () {
		// Pre-build the target transaction
		targetTransaction['version'] = defaultVersion;
		targetTransaction['inputs'] = [];

		for (var i = 0; i < inputs.length; i++) {
			var tmpInput = {};
			var tmp = Buffer.alloc(4);
			var sequence;
			if ((inputs[i].length >= 4) && (typeof inputs[i][3] != "undefined")) {                
				sequence = inputs[i][3];
			}
			else {
				sequence = LedgerBtc.DEFAULT_SEQUENCE;
			}
			tmp.writeUInt32LE(sequence, 0);
			tmpInput['script'] = nullScript;
			tmpInput['sequence'] = tmp;
			targetTransaction['inputs'].push(tmpInput);
		}
	}).then(function () {
		return utils.doIf(!resuming, function () {
			// Collect public keys
			return utils.foreach(inputs, function (input, i) {
				return self.getWalletPublicKey_async(associatedKeysets[i]).then(function (p) {
					return p;
				});
			}).then(function (result) {
				for (var index = 0; index < result.length; index++) {                        
					publicKeys.push(self.compressPublicKey(Buffer.from(result[index]['publicKey'], 'hex')));
				}
			});
		})
	}).then(function () {
		return utils.foreach(inputs, function (input, i) {
			var usedScript;
			if ((inputs[i].length >= 3) && (typeof inputs[i][2] != "undefined")) {
				usedScript = Buffer.from(inputs[i][2], 'hex');
			}
			else {
				usedScript = regularOutputs[i]['script'];
			}
			targetTransaction['inputs'][i]['script'] = usedScript;
			return self.startUntrustedHashTransactionInput_async(firstRun, targetTransaction, trustedInputs).then(function () {
				return utils.doIf(!resuming && (typeof changePath != "undefined"), function () {
					return self.provideOutputFullChangePath_async(changePath);
				}).then (function () {
					return self.hashOutputFull_async(outputScript);
				}).then (function (resultHash) {
					return self.signTransaction_async(associatedKeysets[i], lockTime, sigHashType).then(function (signature) {
						signatures.push(signature);
						targetTransaction['inputs'][i]['script'] = nullScript;
						if (firstRun) {
							firstRun = false;
						}
					});
				});
			});
		});
	}).then(function () {
		// Populate the final input scripts
		for (var i=0; i < inputs.length; i++) {
			var signatureSize = Buffer.alloc(1);
			var keySize = Buffer.alloc(1);
			signatureSize[0] = signatures[i].length;
			keySize[0] = publicKeys[i].length;
			targetTransaction['inputs'][i]['script'] = Buffer.concat([signatureSize, signatures[i], keySize, publicKeys[i]]);
			targetTransaction['inputs'][i]['prevout'] = trustedInputs[i]['value'].slice(4, 4 + 0x24);
		}

		var lockTimeBuffer = Buffer.alloc(4);
		lockTimeBuffer.writeUInt32LE(lockTime, 0);

		var result = Buffer.concat([
			self.serializeTransaction(targetTransaction),
			outputScript,
			lockTimeBuffer]);

		return result.toString('hex');
	}).fail(function (failure) {
		throw failure;
	}).then(function (result) {
		deferred.resolve(result);
	}).fail(function (error) {
		deferred.reject(error);
	});

	return deferred.promise;
}

LedgerBtc.prototype.signP2SHTransaction_async = function(inputs, associatedKeysets, outputScript, lockTime, sigHashType) {
	// Inputs are provided as arrays of [transaction, output_index, redeem script, optional sequence]
	// associatedKeysets are provided as arrays of [path]	
	var nullScript = Buffer.alloc(0);
	var defaultVersion = Buffer.alloc(4);	
	defaultVersion.writeUInt32LE(1, 0);
	var trustedInputs = [];
	var regularOutputs = [];
	var signatures = [];
	var publicKeys = [];
	var firstRun = true;
	var resuming = false;
	var self = this;
	var targetTransaction = {};

	outputScript = Buffer.from(outputScript, 'hex');

	if (typeof lockTime == "undefined") {
		lockTime = LedgerBtc.DEFAULT_LOCKTIME;
	}
	if (typeof sigHashType == "undefined") {
		sigHashType = LedgerBtc.SIGHASH_ALL;
	}	

	var deferred = Q.defer();

	utils.foreach(inputs, function (input, i) {
		return utils.doIf(!resuming, function () {
			return self.getTrustedInput_async(input[1], input[0])
				.then(function (trustedInput) {
						var inputItem = {};
						inputItem['trustedInput'] = false;
						inputItem['value'] = Buffer.from(trustedInput, 'hex').slice(4, 4 + 0x24);
						trustedInputs.push(inputItem);
				});
		}).then(function () {
			regularOutputs.push(input[0].outputs[input[1]]);
		});
	}).then(function () {
		// Pre-build the target transaction
		targetTransaction['version'] = defaultVersion;
		targetTransaction['inputs'] = [];

		for (var i = 0; i < inputs.length; i++) {
			var tmpInput = {};
			var tmp = Buffer.alloc(4);
			var sequence;
			if ((inputs[i].length >= 4) && (typeof inputs[i][3] != "undefined")) {                
				sequence = inputs[i][3];
			}
			else {
				sequence = LedgerBtc.DEFAULT_SEQUENCE;
			}
			tmp.writeUInt32LE(sequence, 0);
			tmpInput['script'] = nullScript;
			tmpInput['sequence'] = tmp;
			targetTransaction['inputs'].push(tmpInput);
		}
	}).then(function () {
		return utils.foreach(inputs, function (input, i) {
			var usedScript;
			if ((inputs[i].length >= 3) && (typeof inputs[i][2] != "undefined")) {
				usedScript = Buffer.from(inputs[i][2], 'hex');
			}
			else {
				usedScript = regularOutputs[i]['script'];
			}
			targetTransaction['inputs'][i]['script'] = usedScript;
			return self.startUntrustedHashTransactionInput_async(firstRun, targetTransaction, trustedInputs).then(function () {
					return self.hashOutputFull_async(outputScript);
				}).then (function (resultHash) {
					return self.signTransaction_async(associatedKeysets[i], lockTime, sigHashType).then(function (signature) {
						signatures.push(signature.slice(0, signature.length - 1).toString('hex'));
						targetTransaction['inputs'][i]['script'] = nullScript;
						if (firstRun) {
							firstRun = false;
						}
					});
				});
		});
	}).then(function () {
		// Return the signatures
		return signatures;
	}).fail(function (failure) {
		throw failure;
	}).then(function (result) {
		deferred.resolve(result);
	}).fail(function (error) {
		deferred.reject(error);
	});

	return deferred.promise;
}


LedgerBtc.prototype.compressPublicKey = function (publicKey) {
	var prefix = ((publicKey[64] & 1) != 0 ? 0x03 : 0x02);
	var prefixBuffer = Buffer.alloc(1);
	prefixBuffer[0] = prefix;
	return Buffer.concat([prefixBuffer, publicKey.slice(1, 1 + 32)]);
},

LedgerBtc.prototype.createVarint = function(value) {
	if (value < 0xfd) {
		var buffer = Buffer.alloc(1);
		buffer[0] = value;
		return buffer;		
	}
	if (value <= 0xffff) {
		var buffer = Buffer.alloc(3);
		buffer[0] = 0xfd;
		buffer[1] = (value & 0xff);
		buffer[2] = ((value >> 8) & 0xff);
		return buffer;
	}
	var buffer = Buffer.alloc(4);
	buffer[0] = 0xfe;
	buffer[1] = (value & 0xff);
	buffer[2] = ((value >> 8) & 0xff);
	buffer[3] = ((value >> 16) & 0xff);
	buffer[4] = ((value >> 24) & 0xff);
	return buffer;
}

LedgerBtc.prototype.splitTransaction = function(transaction) {
	var result = {};
	var inputs = [];
	var outputs = [];
	var offset = 0;
	var transaction = Buffer.from(transaction, 'hex');
	var version = transaction.slice(offset, offset + 4);
	offset += 4;
	var varint = this.getVarint(transaction, offset);
	var numberInputs = varint[0];
	offset += varint[1];
	for (var i=0; i<numberInputs; i++) {
		var input = {};
		input['prevout'] = transaction.slice(offset, offset + 36);
		offset += 36;
		varint = this.getVarint(transaction, offset);
		offset += varint[1];
		input['script'] = transaction.slice(offset, offset + varint[0]);
		offset += varint[0];
		input['sequence'] = transaction.slice(offset, offset + 4);
		offset += 4;
		inputs.push(input);
	}		
	varint = this.getVarint(transaction, offset);
	var numberOutputs = varint[0];
	offset += varint[1];
	for (var i=0; i<numberOutputs; i++) {
		var output = {};
		output['amount'] = transaction.slice(offset, offset + 8);
		offset += 8;
		varint = this.getVarint(transaction, offset);
		offset += varint[1];
		output['script'] = transaction.slice(offset, offset + varint[0]);
		offset += varint[0];
		outputs.push(output);
	}
	var locktime = transaction.slice(offset, offset + 4);
	result['version'] = version;
	result['inputs'] = inputs;
	result['outputs'] = outputs;
	result['locktime'] = locktime;
	return result;
}

LedgerBtc.prototype.serializeTransactionOutputs = function (transaction) {
	var self = this;
	var outputBuffer = Buffer.alloc(0);
	if (typeof transaction['outputs'] != "undefined") {
		outputBuffer = Buffer.concat([outputBuffer, self.createVarint(transaction['outputs'].length)]);
		transaction['outputs'].forEach(function (output) {
			outputBuffer = Buffer.concat([outputBuffer,
				output['amount'],
				self.createVarint(output['script'].length),
				output['script']]);
		});
	}
	return outputBuffer;
}


LedgerBtc.prototype.serializeTransaction = function (transaction) {
	var self = this;
	var inputBuffer = Buffer.alloc(0);	
	transaction['inputs'].forEach(function (input) {
		inputBuffer = Buffer.concat([inputBuffer, 
			input['prevout'], 
			self.createVarint(input['script'].length),
			input['script'],
			input['sequence']
			]);
	});

	var outputBuffer = self.serializeTransactionOutputs(transaction);
	if (typeof transaction['outputs'] != "undefined") {
		outputBuffer = Buffer.concat([outputBuffer, transaction['locktime']]);
	}

	return Buffer.concat([
		transaction['version'],
		self.createVarint(transaction['inputs'].length),
		inputBuffer,
		outputBuffer]);
}

LedgerBtc.prototype.displayTransactionDebug = function(transaction) {
	console.log("version " + transaction['version'].toString('hex'));
	for (var i=0; i<transaction['inputs'].length; i++) {
		var input = transaction['inputs'][i];
		console.log("input " + i + " prevout " + input['prevout'].toString('hex') + " script " + input['script'].toString('hex') + " sequence " + input['sequence'].toString('hex')); 
	}
	for (var i=0; i<transaction['outputs'].length; i++) {
		var output = transaction['outputs'][i];
		console.log("output " + i + " amount " + output['amount'].toString('hex') + " script " + output['script'].toString('hex'));
	}
	console.log("locktime " + transaction['locktime'].toString('hex'));
}


LedgerBtc.MAX_SCRIPT_BLOCK = 50;
LedgerBtc.DEFAULT_LOCKTIME = 0;
LedgerBtc.DEFAULT_SEQUENCE = 0xffffffff;
LedgerBtc.SIGHASH_ALL = 1;

module.exports = LedgerBtc;

