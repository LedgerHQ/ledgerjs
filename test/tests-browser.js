(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.runTests = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (Buffer){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /********************************************************************************
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


var _utils = require("./utils");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MAX_SCRIPT_BLOCK = 50;
var DEFAULT_LOCKTIME = 0;
var DEFAULT_SEQUENCE = 0xffffffff;
var SIGHASH_ALL = 1;

var LedgerBtc = function () {
  function LedgerBtc(comm) {
    _classCallCheck(this, LedgerBtc);

    this.comm = comm;
    comm.setScrambleKey("BTC");
  }

  _createClass(LedgerBtc, [{
    key: "getWalletPublicKey_async",
    value: function getWalletPublicKey_async(path) {
      var paths = (0, _utils.splitPath)(path);
      var buffer = Buffer.alloc(5 + 1 + paths.length * 4);
      buffer[0] = 0xe0;
      buffer[1] = 0x40;
      buffer[2] = 0x00;
      buffer[3] = 0x00;
      buffer[4] = 1 + paths.length * 4;
      buffer[5] = paths.length;
      paths.forEach(function (element, index) {
        buffer.writeUInt32BE(element, 6 + 4 * index);
      });
      return this.comm.exchange(buffer.toString("hex"), [0x9000]).then(function (responseHex) {
        var response = Buffer.from(responseHex, "hex");
        var publicKeyLength = response[0];
        var addressLength = response[1 + publicKeyLength];
        var publicKey = response.slice(1, 1 + publicKeyLength).toString("hex");
        var bitcoinAddress = response.slice(1 + publicKeyLength + 1, 1 + publicKeyLength + 1 + addressLength).toString("ascii");
        var chainCode = response.slice(1 + publicKeyLength + 1 + addressLength, 1 + publicKeyLength + 1 + addressLength + 32).toString("hex");
        return { publicKey: publicKey, bitcoinAddress: bitcoinAddress, chainCode: chainCode };
      });
    }
  }, {
    key: "getTrustedInputRaw_async",
    value: function getTrustedInputRaw_async(transactionData, indexLookup) {
      var data = void 0;
      var firstRound = false;
      if (typeof indexLookup === "number") {
        firstRound = true;
        var prefix = Buffer.alloc(4);
        prefix.writeUInt32BE(indexLookup, 0);
        data = Buffer.concat([prefix, transactionData], transactionData.length + 4);
      } else {
        data = transactionData;
      }
      var buffer = Buffer.alloc(5);
      buffer[0] = 0xe0;
      buffer[1] = 0x42;
      buffer[2] = firstRound ? 0x00 : 0x80;
      buffer[3] = 0x00;
      buffer[4] = data.length;
      buffer = Buffer.concat([buffer, data], 5 + data.length);
      return this.comm.exchange(buffer.toString("hex"), [0x9000]).then(function (trustedInput) {
        return trustedInput.substring(0, trustedInput.length - 4);
      });
    }
  }, {
    key: "getTrustedInput_async",
    value: function getTrustedInput_async(indexLookup, transaction) {
      var _this = this;

      var inputs = transaction.inputs,
          outputs = transaction.outputs,
          locktime = transaction.locktime;

      if (!outputs || !locktime) {
        throw new Error("getTrustedInput_async: locktime & outputs is expected");
      }

      var processScriptBlocks = function processScriptBlocks(script, sequence) {
        var scriptBlocks = [];
        var offset = 0;
        while (offset !== script.length) {
          var blockSize = script.length - offset > MAX_SCRIPT_BLOCK ? MAX_SCRIPT_BLOCK : script.length - offset;
          if (offset + blockSize !== script.length) {
            scriptBlocks.push(script.slice(offset, offset + blockSize));
          } else {
            scriptBlocks.push(Buffer.concat([script.slice(offset, offset + blockSize), sequence]));
          }
          offset += blockSize;
        }
        return (0, _utils.eachSeries)(scriptBlocks, function (scriptBlock) {
          return _this.getTrustedInputRaw_async(scriptBlock);
        });
      };

      var processInputs = function processInputs() {
        return (0, _utils.eachSeries)(inputs, function (input) {
          var data = Buffer.concat([input.prevout, _this.createVarint(input.script.length)]);
          return _this.getTrustedInputRaw_async(data).then(function () {
            return (
              // iteration (eachSeries) ended
              // TODO notify progress
              // deferred.notify("input");
              processScriptBlocks(input.script, input.sequence)
            );
          });
        }).then(function () {
          var data = _this.createVarint(outputs.length);
          return _this.getTrustedInputRaw_async(data);
        });
      };

      var processOutputs = function processOutputs() {
        return (0, _utils.eachSeries)(outputs, function (output) {
          var data = output.amount;
          data = Buffer.concat([data, _this.createVarint(output.script.length), output.script]);
          return _this.getTrustedInputRaw_async(data).then(function () {
            // iteration (eachSeries) ended
            // TODO notify progress
            // deferred.notify("output");
          });
        }).then(function () {
          return _this.getTrustedInputRaw_async(locktime);
        });
      };

      var data = Buffer.concat([transaction.version, this.createVarint(inputs.length)]);
      return this.getTrustedInputRaw_async(data, indexLookup).then(processInputs).then(processOutputs);
    }
  }, {
    key: "getVarint",
    value: function getVarint(data, offset) {
      if (data[offset] < 0xfd) {
        return [data[offset], 1];
      }
      if (data[offset] === 0xfd) {
        return [(data[offset + 2] << 8) + data[offset + 1], 3];
      }
      if (data[offset] === 0xfe) {
        return [(data[offset + 4] << 24) + (data[offset + 3] << 16) + (data[offset + 2] << 8) + data[offset + 1], 5];
      }

      throw new Error("getVarint called with unexpected parameters");
    }
  }, {
    key: "startUntrustedHashTransactionInputRaw_async",
    value: function startUntrustedHashTransactionInputRaw_async(newTransaction, firstRound, transactionData) {
      var buffer = Buffer.alloc(5);
      buffer[0] = 0xe0;
      buffer[1] = 0x44;
      buffer[2] = firstRound ? 0x00 : 0x80;
      buffer[3] = newTransaction ? 0x00 : 0x80;
      buffer[4] = transactionData.length;
      buffer = Buffer.concat([buffer, transactionData], 5 + transactionData.length);
      return this.comm.exchange(buffer.toString("hex"), [0x9000]);
    }
  }, {
    key: "startUntrustedHashTransactionInput_async",
    value: function startUntrustedHashTransactionInput_async(newTransaction, transaction, inputs) {
      var _this2 = this;

      var data = Buffer.concat([transaction.version, this.createVarint(transaction.inputs.length)]);
      return this.startUntrustedHashTransactionInputRaw_async(newTransaction, true, data).then(function () {
        var i = 0;
        return (0, _utils.eachSeries)(transaction.inputs, function (input) {
          // TODO : segwit
          var prefix = void 0;
          if (inputs[i].trustedInput) {
            prefix = Buffer.alloc(2);
            prefix[0] = 0x01;
            prefix[1] = inputs[i].value.length;
          } else {
            prefix = Buffer.alloc(1);
            prefix[0] = 0x00;
          }
          data = Buffer.concat([prefix, inputs[i].value, _this2.createVarint(input.script.length)]);
          return _this2.startUntrustedHashTransactionInputRaw_async(newTransaction, false, data).then(function () {
            var scriptBlocks = [];
            var offset = 0;
            if (input.script.length === 0) {
              scriptBlocks.push(input.sequence);
            } else {
              while (offset !== input.script.length) {
                var blockSize = input.script.length - offset > MAX_SCRIPT_BLOCK ? MAX_SCRIPT_BLOCK : input.script.length - offset;
                if (offset + blockSize !== input.script.length) {
                  scriptBlocks.push(input.script.slice(offset, offset + blockSize));
                } else {
                  scriptBlocks.push(Buffer.concat([input.script.slice(offset, offset + blockSize), input.sequence]));
                }
                offset += blockSize;
              }
            }
            return (0, _utils.eachSeries)(scriptBlocks, function (scriptBlock) {
              return _this2.startUntrustedHashTransactionInputRaw_async(newTransaction, false, scriptBlock);
            }).then(function () {
              i++;
            });
          });
        });
      });
    }
  }, {
    key: "provideOutputFullChangePath_async",
    value: function provideOutputFullChangePath_async(path) {
      var paths = (0, _utils.splitPath)(path);
      var buffer = Buffer.alloc(5 + 1 + paths.length * 4);
      buffer[0] = 0xe0;
      buffer[1] = 0x4a;
      buffer[2] = 0xff;
      buffer[3] = 0x00;
      buffer[4] = 1 + paths.length * 4;
      buffer[5] = paths.length;
      paths.forEach(function (element, index) {
        buffer.writeUInt32BE(element, 6 + 4 * index);
      });
      return this.comm.exchange(buffer.toString("hex"), [0x9000]);
    }
  }, {
    key: "hashOutputFull_async",
    value: function hashOutputFull_async(outputScript) {
      var _this3 = this;

      var offset = 0;
      return (0, _utils.asyncWhile)(function () {
        return offset < outputScript.length;
      }, function () {
        var blockSize = offset + MAX_SCRIPT_BLOCK >= outputScript.length ? outputScript.length - offset : MAX_SCRIPT_BLOCK;
        var p1 = offset + blockSize === outputScript.length ? 0x80 : 0x00;
        var prefix = Buffer.alloc(5);
        prefix[0] = 0xe0;
        prefix[1] = 0x4a;
        prefix[2] = p1;
        prefix[3] = 0x00;
        prefix[4] = blockSize;
        var data = Buffer.concat([prefix, outputScript.slice(offset, offset + blockSize)]);
        return _this3.comm.exchange(data.toString("hex"), [0x9000]).then(function () {
          offset += blockSize;
        });
      });
    }
  }, {
    key: "signTransaction_async",
    value: function signTransaction_async(path) {
      var lockTime = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DEFAULT_LOCKTIME;
      var sigHashType = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : SIGHASH_ALL;

      var paths = (0, _utils.splitPath)(path);
      var buffer = Buffer.alloc(5 + 1 + paths.length * 4 + 1 + 4 + 1);
      var offset = 0;
      buffer[offset++] = 0xe0;
      buffer[offset++] = 0x48;
      buffer[offset++] = 0x00;
      buffer[offset++] = 0x00;
      buffer[offset++] = 1 + paths.length * 4 + 1 + 4 + 1;
      buffer[offset++] = paths.length;
      paths.forEach(function (element) {
        buffer.writeUInt32BE(element, offset);
        offset += 4;
      });
      buffer[offset++] = 0x00; // authorization length
      buffer.writeUInt32LE(lockTime, offset);
      offset += 4;
      buffer[offset++] = sigHashType;
      return this.comm.exchange(buffer.toString("hex"), [0x9000]).then(function (signature) {
        var result = Buffer.from(signature, "hex");
        result[0] = 0x30;
        return result.slice(0, result.length - 2);
      });
    }
  }, {
    key: "signMessageNew_async",
    value: function signMessageNew_async(path, messageHex) {
      var _this4 = this;

      var paths = (0, _utils.splitPath)(path);
      var message = new Buffer(messageHex, "hex");
      var offset = 0;
      var apdus = [];

      var _loop = function _loop() {
        var maxChunkSize = offset === 0 ? MAX_SCRIPT_BLOCK - 1 - paths.length * 4 - 4 : MAX_SCRIPT_BLOCK;
        var chunkSize = offset + maxChunkSize > message.length ? message.length - offset : maxChunkSize;
        var buffer = new Buffer(offset === 0 ? 5 + 1 + paths.length * 4 + 2 + chunkSize : 5 + chunkSize);
        buffer[0] = 0xe0;
        buffer[1] = 0x4e;
        buffer[2] = 0x00;
        buffer[3] = offset === 0 ? 0x01 : 0x80;
        buffer[4] = offset === 0 ? 1 + paths.length * 4 + 2 + chunkSize : chunkSize;
        if (offset === 0) {
          buffer[5] = paths.length;
          paths.forEach(function (element, index) {
            buffer.writeUInt32BE(element, 6 + 4 * index);
          });
          buffer.writeUInt16BE(message.length, 6 + 4 * paths.length);
          message.copy(buffer, 6 + 4 * paths.length + 2, offset, offset + chunkSize);
        } else {
          message.copy(buffer, 5, offset, offset + chunkSize);
        }
        apdus.push(buffer.toString("hex"));
        offset += chunkSize;
      };

      while (offset !== message.length) {
        _loop();
      }
      return (0, _utils.foreach)(apdus, function (apdu) {
        return _this4.comm.exchange(apdu, [0x9000]);
      }).then(function () {
        var buffer = Buffer.alloc(6);
        buffer[0] = 0xe0;
        buffer[1] = 0x4e;
        buffer[2] = 0x80;
        buffer[3] = 0x00;
        buffer[4] = 0x01;
        buffer[5] = 0x00;
        return _this4.comm.exchange(buffer.toString("hex"), [0x9000]).then(function (apduResponse) {
          var response = Buffer.from(apduResponse, "hex");
          var v = response[0] - 0x30;
          var r = response.slice(4, 4 + response[3]);
          if (r[0] === 0) {
            r = r.slice(1);
          }
          r = r.toString("hex");
          var offset = 4 + response[3] + 2;
          var s = response.slice(offset, offset + response[offset - 1]);
          if (s[0] === 0) {
            s = s.slice(1);
          }
          s = s.toString("hex");
          return { v: v, r: r, s: s };
        });
      });
    }
  }, {
    key: "createPaymentTransactionNew_async",
    value: function createPaymentTransactionNew_async(inputs, associatedKeysets, changePath, outputScriptHex) {
      var _this5 = this;

      var lockTime = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : DEFAULT_LOCKTIME;
      var sigHashType = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : SIGHASH_ALL;

      // Inputs are provided as arrays of [transaction, output_index, optional redeem script, optional sequence]
      // associatedKeysets are provided as arrays of [path]
      var nullScript = Buffer.alloc(0);
      var nullPrevout = Buffer.alloc(0);
      var defaultVersion = Buffer.alloc(4);
      defaultVersion.writeUInt32LE(1, 0);
      var trustedInputs = [];
      var regularOutputs = [];
      var signatures = [];
      var publicKeys = [];
      var firstRun = true;
      var resuming = false;
      var targetTransaction = {
        inputs: [],
        version: defaultVersion
      };

      var outputScript = Buffer.from(outputScriptHex, "hex");

      return (0, _utils.foreach)(inputs, function (input) {
        return (0, _utils.doIf)(!resuming, function () {
          return _this5.getTrustedInput_async(input[1], input[0]).then(function (trustedInput) {
            trustedInputs.push({
              trustedInput: true,
              value: Buffer.from(trustedInput, "hex")
            });
          });
        }).then(function () {
          var outputs = input[0].outputs;

          var index = input[1];
          if (outputs && index <= outputs.length - 1) {
            regularOutputs.push(outputs[index]);
          }
        });
      }).then(function () {
        for (var i = 0; i < inputs.length; i++) {
          var _sequence = Buffer.alloc(4);
          _sequence.writeUInt32LE(inputs[i].length >= 4 && typeof inputs[i][3] === "number" ? inputs[i][3] : DEFAULT_SEQUENCE, 0);
          targetTransaction.inputs.push({
            script: nullScript,
            prevout: nullPrevout,
            sequence: _sequence
          });
        }
      }).then(function () {
        return (0, _utils.doIf)(!resuming, function () {
          return (
            // Collect public keys
            (0, _utils.foreach)(inputs, function (input, i) {
              return _this5.getWalletPublicKey_async(associatedKeysets[i]);
            }).then(function (result) {
              for (var index = 0; index < result.length; index++) {
                publicKeys.push(_this5.compressPublicKey(Buffer.from(result[index].publicKey, "hex")));
              }
            })
          );
        });
      }).then(function () {
        return (0, _utils.foreach)(inputs, function (input, i) {
          targetTransaction.inputs[i].script = inputs[i].length >= 3 && typeof inputs[i][2] === "string" ? Buffer.from(inputs[i][2], "hex") : regularOutputs[i].script;
          return _this5.startUntrustedHashTransactionInput_async(firstRun, targetTransaction, trustedInputs).then(function () {
            return Promise.resolve().then(function () {
              if (!resuming && typeof changePath !== "undefined") {
                return _this5.provideOutputFullChangePath_async(changePath);
              }
            }).then(function () {
              return _this5.hashOutputFull_async(outputScript);
            }).then(function () {
              return _this5.signTransaction_async(associatedKeysets[i], lockTime, sigHashType).then(function (signature) {
                signatures.push(signature);
                targetTransaction.inputs[i].script = nullScript;
                if (firstRun) {
                  firstRun = false;
                }
              });
            });
          });
        });
      }).then(function () {
        // Populate the final input scripts
        for (var i = 0; i < inputs.length; i++) {
          var signatureSize = Buffer.alloc(1);
          var keySize = Buffer.alloc(1);
          signatureSize[0] = signatures[i].length;
          keySize[0] = publicKeys[i].length;
          targetTransaction.inputs[i].script = Buffer.concat([signatureSize, signatures[i], keySize, publicKeys[i]]);
          targetTransaction.inputs[i].prevout = trustedInputs[i].value.slice(4, 4 + 0x24);
        }

        var lockTimeBuffer = Buffer.alloc(4);
        lockTimeBuffer.writeUInt32LE(lockTime, 0);

        var result = Buffer.concat([_this5.serializeTransaction(targetTransaction), outputScript, lockTimeBuffer]);

        return result.toString("hex");
      });
    }
  }, {
    key: "signP2SHTransaction_async",
    value: function signP2SHTransaction_async(inputs, associatedKeysets, outputScriptHex) {
      var _this6 = this;

      var lockTime = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : DEFAULT_LOCKTIME;
      var sigHashType = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : SIGHASH_ALL;

      // Inputs are provided as arrays of [transaction, output_index, redeem script, optional sequence]
      // associatedKeysets are provided as arrays of [path]
      var nullScript = Buffer.alloc(0);
      var nullPrevout = Buffer.alloc(0);
      var defaultVersion = Buffer.alloc(4);
      defaultVersion.writeUInt32LE(1, 0);
      var trustedInputs = [];
      var regularOutputs = [];
      var signatures = [];
      var firstRun = true;
      var resuming = false;
      var targetTransaction = {
        inputs: [],
        version: defaultVersion
      };

      var outputScript = Buffer.from(outputScriptHex, "hex");

      return (0, _utils.foreach)(inputs, function (input) {
        return (0, _utils.doIf)(!resuming, function () {
          return _this6.getTrustedInput_async(input[1], input[0]).then(function (trustedInput) {
            var inputItem = {};
            inputItem.trustedInput = false;
            inputItem.value = Buffer.from(trustedInput, "hex").slice(4, 4 + 0x24);
            trustedInputs.push(inputItem);
          });
        }).then(function () {
          var outputs = input[0].outputs;

          var index = input[1];
          if (outputs && index <= outputs.length - 1) {
            regularOutputs.push(outputs[index]);
          }
        });
      }).then(function () {
        // Pre-build the target transaction
        for (var i = 0; i < inputs.length; i++) {
          var tmp = Buffer.alloc(4);
          var _sequence2 = void 0;
          if (inputs[i].length >= 4 && typeof inputs[i][3] === "number") {
            _sequence2 = inputs[i][3];
          } else {
            _sequence2 = DEFAULT_SEQUENCE;
          }
          tmp.writeUInt32LE(_sequence2, 0);
          targetTransaction.inputs.push({
            prevout: nullPrevout,
            script: nullScript,
            sequence: tmp
          });
        }
      }).then(function () {
        return (0, _utils.foreach)(inputs, function (input, i) {
          targetTransaction.inputs[i].script = inputs[i].length >= 3 && typeof inputs[i][2] === "string" ? Buffer.from(inputs[i][2], "hex") : regularOutputs[i].script;
          return _this6.startUntrustedHashTransactionInput_async(firstRun, targetTransaction, trustedInputs).then(function () {
            return _this6.hashOutputFull_async(outputScript);
          }).then(function () {
            return _this6.signTransaction_async(associatedKeysets[i], lockTime, sigHashType).then(function (signature) {
              signatures.push(signature.slice(0, signature.length - 1).toString("hex"));
              targetTransaction.inputs[i].script = nullScript;
              if (firstRun) {
                firstRun = false;
              }
            });
          });
        });
      }).then(function () {
        return signatures;
      });
    }
  }, {
    key: "compressPublicKey",
    value: function compressPublicKey(publicKey) {
      var prefix = (publicKey[64] & 1) !== 0 ? 0x03 : 0x02;
      var prefixBuffer = Buffer.alloc(1);
      prefixBuffer[0] = prefix;
      return Buffer.concat([prefixBuffer, publicKey.slice(1, 1 + 32)]);
    }
  }, {
    key: "createVarint",
    value: function createVarint(value) {
      if (value < 0xfd) {
        var _buffer = Buffer.alloc(1);
        _buffer[0] = value;
        return _buffer;
      }
      if (value <= 0xffff) {
        var _buffer2 = Buffer.alloc(3);
        _buffer2[0] = 0xfd;
        _buffer2[1] = value & 0xff;
        _buffer2[2] = value >> 8 & 0xff;
        return _buffer2;
      }
      var buffer = Buffer.alloc(4);
      buffer[0] = 0xfe;
      buffer[1] = value & 0xff;
      buffer[2] = value >> 8 & 0xff;
      buffer[3] = value >> 16 & 0xff;
      buffer[4] = value >> 24 & 0xff;
      return buffer;
    }
  }, {
    key: "splitTransaction",
    value: function splitTransaction(transactionHex) {
      var inputs = [];
      var outputs = [];
      var offset = 0;
      var transaction = Buffer.from(transactionHex, "hex");
      var version = transaction.slice(offset, offset + 4);
      offset += 4;
      var varint = this.getVarint(transaction, offset);
      var numberInputs = varint[0];
      offset += varint[1];
      for (var i = 0; i < numberInputs; i++) {
        var _prevout = transaction.slice(offset, offset + 36);
        offset += 36;
        varint = this.getVarint(transaction, offset);
        offset += varint[1];
        var _script = transaction.slice(offset, offset + varint[0]);
        offset += varint[0];
        var _sequence3 = transaction.slice(offset, offset + 4);
        offset += 4;
        inputs.push({ prevout: _prevout, script: _script, sequence: _sequence3 });
      }
      varint = this.getVarint(transaction, offset);
      var numberOutputs = varint[0];
      offset += varint[1];
      for (var _i = 0; _i < numberOutputs; _i++) {
        var _amount = transaction.slice(offset, offset + 8);
        offset += 8;
        varint = this.getVarint(transaction, offset);
        offset += varint[1];
        var _script2 = transaction.slice(offset, offset + varint[0]);
        offset += varint[0];
        outputs.push({ amount: _amount, script: _script2 });
      }
      var locktime = transaction.slice(offset, offset + 4);
      return { version: version, inputs: inputs, outputs: outputs, locktime: locktime };
    }
  }, {
    key: "serializeTransactionOutputs",
    value: function serializeTransactionOutputs(_ref) {
      var _this7 = this;

      var outputs = _ref.outputs;

      var outputBuffer = Buffer.alloc(0);
      if (typeof outputs !== "undefined") {
        outputBuffer = Buffer.concat([outputBuffer, this.createVarint(outputs.length)]);
        outputs.forEach(function (output) {
          outputBuffer = Buffer.concat([outputBuffer, output.amount, _this7.createVarint(output.script.length), output.script]);
        });
      }
      return outputBuffer;
    }
  }, {
    key: "serializeTransaction",
    value: function serializeTransaction(transaction) {
      var _this8 = this;

      var inputBuffer = Buffer.alloc(0);
      transaction.inputs.forEach(function (input) {
        inputBuffer = Buffer.concat([inputBuffer, input.prevout, _this8.createVarint(input.script.length), input.script, input.sequence]);
      });

      var outputBuffer = this.serializeTransactionOutputs(transaction);
      if (typeof transaction.outputs !== "undefined" && typeof transaction.locktime !== "undefined") {
        outputBuffer = Buffer.concat([outputBuffer, transaction.locktime]);
      }

      return Buffer.concat([transaction.version, this.createVarint(transaction.inputs.length), inputBuffer, outputBuffer]);
    }
  }, {
    key: "displayTransactionDebug",
    value: function displayTransactionDebug(transaction) {
      console.log("version " + transaction.version.toString("hex"));
      transaction.inputs.forEach(function (input, i) {
        var prevout = input.prevout.toString("hex");
        var script = input.script.toString("hex");
        var sequence = input.sequence.toString("hex");
        console.log("input " + i + " prevout " + prevout + " script " + script + " sequence " + sequence);
      });
      (transaction.outputs || []).forEach(function (output, i) {
        var amount = output.amount.toString("hex");
        var script = output.script.toString("hex");
        console.log("output " + i + " amount " + amount + " script " + script);
      });
      if (typeof transaction.locktime !== "undefined") {
        console.log("locktime " + transaction.locktime.toString("hex"));
      }
    }
  }]);

  return LedgerBtc;
}();

exports.default = LedgerBtc;
}).call(this,require("buffer").Buffer)
},{"./utils":6,"buffer":8}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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


// This define the generic interface to share between node/u2f impl

var LedgerComm = function LedgerComm() {
  _classCallCheck(this, LedgerComm);
};

exports.default = LedgerComm;
},{}],3:[function(require,module,exports){
(function (Buffer){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _u2fApi = require("u2f-api");

var _LedgerComm2 = require("./LedgerComm");

var _LedgerComm3 = _interopRequireDefault(_LedgerComm2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /********************************************************************************
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


function wrapApdu(apdu, key) {
  var result = Buffer.alloc(apdu.length);
  for (var i = 0; i < apdu.length; i++) {
    result[i] = apdu[i] ^ key[i % key.length];
  }
  return result;
}

// Convert from normal to web-safe, strip trailing "="s
var webSafe64 = function webSafe64(base64) {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

// Convert from web-safe to normal, add trailing "="s
var normal64 = function normal64(base64) {
  return base64.replace(/-/g, "+").replace(/_/g, "/") + "==".substring(0, 3 * base64.length % 4);
};

function u2fPromise(response, statusList) {
  var signatureData = response.signatureData;

  return new Promise(function (resolve, reject) {
    if (typeof signatureData === "string") {
      var data = Buffer.from(normal64(signatureData), "base64");
      if (typeof statusList !== "undefined") {
        var sw = data.readUInt16BE(data.length - 2);
        var statusFound = statusList.some(function (s) {
          return s === sw;
        });
        if (!statusFound) {
          reject("Invalid status " + sw.toString(16));
        }
      }
      resolve(data.toString("hex", 5));
    } else {
      reject(response);
    }
  });
}

var LedgerU2F = function (_LedgerComm) {
  _inherits(LedgerU2F, _LedgerComm);

  function LedgerU2F() {
    var timeoutSeconds = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 20;

    _classCallCheck(this, LedgerU2F);

    var _this = _possibleConstructorReturn(this, (LedgerU2F.__proto__ || Object.getPrototypeOf(LedgerU2F)).call(this));

    _this.timeoutSeconds = timeoutSeconds;
    return _this;
  }

  _createClass(LedgerU2F, [{
    key: "exchange",
    value: function exchange(apduHex, statusList) {
      var apdu = Buffer.from(apduHex, "hex");
      var keyHandle = wrapApdu(apdu, this.scrambleKey);
      var challenge = Buffer.from("0000000000000000000000000000000000000000000000000000000000000000", "hex");
      var signRequest = {
        version: "U2F_V2",
        keyHandle: webSafe64(keyHandle.toString("base64")),
        challenge: webSafe64(challenge.toString("base64")),
        appId: location.origin
      };
      return (0, _u2fApi.sign)(signRequest, this.timeoutSeconds).then(function (result) {
        return u2fPromise(result, statusList);
      });
    }
  }, {
    key: "setScrambleKey",
    value: function setScrambleKey(scrambleKey) {
      this.scrambleKey = Buffer.from(scrambleKey, "ascii");
    }
  }, {
    key: "close_async",
    value: function close_async() {
      return Promise.resolve();
    }
  }]);

  return LedgerU2F;
}(_LedgerComm3.default);

LedgerU2F.create_async = function (timeout) {
  return Promise.resolve(new LedgerU2F(timeout));
};

exports.default = LedgerU2F;
}).call(this,require("buffer").Buffer)
},{"./LedgerComm":2,"buffer":8,"u2f-api":10}],4:[function(require,module,exports){
(function (Buffer){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /********************************************************************************
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


var _utils = require("./utils");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LedgerEth = function () {
  function LedgerEth(comm) {
    _classCallCheck(this, LedgerEth);

    this.comm = comm;
    comm.setScrambleKey("w0w");
  }

  _createClass(LedgerEth, [{
    key: "getAddress_async",
    value: function getAddress_async(path, boolDisplay, boolChaincode) {
      var paths = (0, _utils.splitPath)(path);
      var buffer = new Buffer(5 + 1 + paths.length * 4);
      buffer[0] = 0xe0;
      buffer[1] = 0x02;
      buffer[2] = boolDisplay ? 0x01 : 0x00;
      buffer[3] = boolChaincode ? 0x01 : 0x00;
      buffer[4] = 1 + paths.length * 4;
      buffer[5] = paths.length;
      paths.forEach(function (element, index) {
        buffer.writeUInt32BE(element, 6 + 4 * index);
      });
      return this.comm.exchange(buffer.toString("hex"), [0x9000]).then(function (responseHex) {
        var result = {};
        var response = new Buffer(responseHex, "hex");
        var publicKeyLength = response[0];
        var addressLength = response[1 + publicKeyLength];
        result.publicKey = response.slice(1, 1 + publicKeyLength).toString("hex");
        result.address = "0x" + response.slice(1 + publicKeyLength + 1, 1 + publicKeyLength + 1 + addressLength).toString("ascii");
        if (boolChaincode) {
          result.chainCode = response.slice(1 + publicKeyLength + 1 + addressLength, 1 + publicKeyLength + 1 + addressLength + 32).toString("hex");
        }
        return result;
      });
    }
  }, {
    key: "signTransaction_async",
    value: function signTransaction_async(path, rawTxHex) {
      var _this = this;

      var paths = (0, _utils.splitPath)(path);
      var offset = 0;
      var rawTx = new Buffer(rawTxHex, "hex");
      var apdus = [];
      var response = [];

      var _loop = function _loop() {
        var maxChunkSize = offset === 0 ? 150 - 1 - paths.length * 4 : 150;
        var chunkSize = offset + maxChunkSize > rawTx.length ? rawTx.length - offset : maxChunkSize;
        var buffer = new Buffer(offset === 0 ? 5 + 1 + paths.length * 4 + chunkSize : 5 + chunkSize);
        buffer[0] = 0xe0;
        buffer[1] = 0x04;
        buffer[2] = offset === 0 ? 0x00 : 0x80;
        buffer[3] = 0x00;
        buffer[4] = offset === 0 ? 1 + paths.length * 4 + chunkSize : chunkSize;
        if (offset === 0) {
          buffer[5] = paths.length;
          paths.forEach(function (element, index) {
            buffer.writeUInt32BE(element, 6 + 4 * index);
          });
          rawTx.copy(buffer, 6 + 4 * paths.length, offset, offset + chunkSize);
        } else {
          rawTx.copy(buffer, 5, offset, offset + chunkSize);
        }
        apdus.push(buffer.toString("hex"));
        offset += chunkSize;
      };

      while (offset !== rawTx.length) {
        _loop();
      }
      return (0, _utils.foreach)(apdus, function (apdu) {
        return _this.comm.exchange(apdu, [0x9000]).then(function (apduResponse) {
          response = apduResponse;
        });
      }).then(function () {
        response = new Buffer(response, "hex");
        var v = response.slice(0, 1).toString("hex");
        var r = response.slice(1, 1 + 32).toString("hex");
        var s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
        return { v: v, r: r, s: s };
      });
    }
  }, {
    key: "getAppConfiguration_async",
    value: function getAppConfiguration_async() {
      var buffer = new Buffer(5);
      buffer[0] = 0xe0;
      buffer[1] = 0x06;
      buffer[2] = 0x00;
      buffer[3] = 0x00;
      buffer[4] = 0x00;
      return this.comm.exchange(buffer.toString("hex"), [0x9000]).then(function (responseHex) {
        var result = {};
        var response = Buffer.from(responseHex, "hex");
        result.arbitraryDataEnabled = response[0] & 0x01;
        result.version = "" + response[1] + "." + response[2] + "." + response[3];
        return result;
      });
    }
  }, {
    key: "signPersonalMessage_async",
    value: function signPersonalMessage_async(path, messageHex) {
      var _this2 = this;

      var paths = (0, _utils.splitPath)(path);
      var offset = 0;
      var message = new Buffer(messageHex, "hex");
      var apdus = [];
      var response = [];

      var _loop2 = function _loop2() {
        var maxChunkSize = offset === 0 ? 150 - 1 - paths.length * 4 - 4 : 150;
        var chunkSize = offset + maxChunkSize > message.length ? message.length - offset : maxChunkSize;
        var buffer = new Buffer(offset === 0 ? 5 + 1 + paths.length * 4 + 4 + chunkSize : 5 + chunkSize);
        buffer[0] = 0xe0;
        buffer[1] = 0x08;
        buffer[2] = offset === 0 ? 0x00 : 0x80;
        buffer[3] = 0x00;
        buffer[4] = offset === 0 ? 1 + paths.length * 4 + 4 + chunkSize : chunkSize;
        if (offset === 0) {
          buffer[5] = paths.length;
          paths.forEach(function (element, index) {
            buffer.writeUInt32BE(element, 6 + 4 * index);
          });
          buffer.writeUInt32BE(message.length, 6 + 4 * paths.length);
          message.copy(buffer, 6 + 4 * paths.length + 4, offset, offset + chunkSize);
        } else {
          message.copy(buffer, 5, offset, offset + chunkSize);
        }
        apdus.push(buffer.toString("hex"));
        offset += chunkSize;
      };

      while (offset !== message.length) {
        _loop2();
      }
      return (0, _utils.foreach)(apdus, function (apdu) {
        return _this2.comm.exchange(apdu, [0x9000]).then(function (apduResponse) {
          response = apduResponse;
        });
      }).then(function () {
        response = new Buffer(response, "hex");
        var v = response[0];
        var r = response.slice(1, 1 + 32).toString("hex");
        var s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
        return { v: v, r: r, s: s };
      });
    }
  }]);

  return LedgerEth;
}();

exports.default = LedgerEth;
}).call(this,require("buffer").Buffer)
},{"./utils":6,"buffer":8}],5:[function(require,module,exports){
"use strict";

var _LedgerCommU2F = require("./LedgerCommU2F");

var _LedgerCommU2F2 = _interopRequireDefault(_LedgerCommU2F);

var _LedgerBtc = require("./LedgerBtc");

var _LedgerBtc2 = _interopRequireDefault(_LedgerBtc);

var _LedgerEth = require("./LedgerEth");

var _LedgerEth2 = _interopRequireDefault(_LedgerEth);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// TODO IMO in the future:
//export { LedgerComm, LedgerBtc, LedgerEth };
// for now, non breaking version:
module.exports = {
  comm_u2f: _LedgerCommU2F2.default,
  btc: _LedgerBtc2.default,
  eth: _LedgerEth2.default
}; /********************************************************************************
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
},{"./LedgerBtc":1,"./LedgerCommU2F":3,"./LedgerEth":4}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defer = defer;
exports.eachSeries = eachSeries;
exports.splitPath = splitPath;
exports.foreach = foreach;
exports.doIf = doIf;
exports.asyncWhile = asyncWhile;
function defer() {
  var resolve = void 0,
      reject = void 0;
  var promise = new Promise(function (success, failure) {
    resolve = success;
    reject = failure;
  });
  if (!resolve || !reject) throw "defer() error"; // this never happens and is just to make flow happy
  return { promise: promise, resolve: resolve, reject: reject };
} /********************************************************************************
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


function eachSeries(arr, fun) {
  return arr.reduce(function (p, e) {
    return p.then(function () {
      return fun(e);
    });
  }, Promise.resolve());
}

function splitPath(path) {
  var result = [];
  var components = path.split("/");
  components.forEach(function (element) {
    var number = parseInt(element, 10);
    if (isNaN(number)) {
      return; // FIXME shouldn't it throws instead?
    }
    if (element.length > 1 && element[element.length - 1] === "'") {
      number += 0x80000000;
    }
    result.push(number);
  });
  return result;
}

function foreach(arr, callback) {
  function iterate(index, array, result) {
    if (index >= array.length) {
      return result;
    } else return callback(array[index], index).then(function (res) {
      result.push(res);
      return iterate(index + 1, array, result);
    });
  }
  return Promise.resolve().then(function () {
    return iterate(0, arr, []);
  });
}

function doIf(condition, callback) {
  return Promise.resolve().then(function () {
    if (condition) {
      return callback();
    }
  });
}

function asyncWhile(predicate, callback) {
  function iterate(result) {
    if (!predicate()) {
      return result;
    } else {
      return callback().then(function (res) {
        result.push(res);
        return iterate(result);
      });
    }
  }
  return Promise.resolve([]).then(iterate);
}
},{}],7:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function placeHoldersCount (b64) {
  var len = b64.length
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
}

function byteLength (b64) {
  // base64 is 4/3 + up to two characters of the original data
  return (b64.length * 3 / 4) - placeHoldersCount(b64)
}

function toByteArray (b64) {
  var i, l, tmp, placeHolders, arr
  var len = b64.length
  placeHolders = placeHoldersCount(b64)

  arr = new Arr((len * 3 / 4) - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0; i < l; i += 4) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],8:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('Invalid typed array length')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (isArrayBuffer(value)) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  return fromObject(value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj) {
    if (isArrayBufferView(obj) || 'length' in obj) {
      if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
        return createBuffer(0)
      }
      return fromArrayLike(obj)
    }

    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      return fromArrayLike(obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (isArrayBufferView(string) || isArrayBuffer(string)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : new Buffer(val, encoding)
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffers from another context (i.e. an iframe) do not pass the `instanceof` check
// but they should be treated as valid. See: https://github.com/feross/buffer/issues/166
function isArrayBuffer (obj) {
  return obj instanceof ArrayBuffer ||
    (obj != null && obj.constructor != null && obj.constructor.name === 'ArrayBuffer' &&
      typeof obj.byteLength === 'number')
}

// Node 0.10 supports `ArrayBuffer` but lacks `ArrayBuffer.isView`
function isArrayBufferView (obj) {
  return (typeof ArrayBuffer.isView === 'function') && ArrayBuffer.isView(obj)
}

function numberIsNaN (obj) {
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":7,"ieee754":9}],9:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],10:[function(require,module,exports){
'use strict';
module.exports = require( './lib/u2f-api' );
},{"./lib/u2f-api":12}],11:[function(require,module,exports){
// Copyright 2014 Google Inc. All rights reserved
//
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file or at
// https://developers.google.com/open-source/licenses/bsd

/**
 * @fileoverview The U2F api.
 */

'use strict';

/** Namespace for the U2F api.
 * @type {Object}
 */
var u2f = u2f || {};

module.exports = u2f; // Adaptation for u2f-api package

/**
 * The U2F extension id
 * @type {string}
 * @const
 */
u2f.EXTENSION_ID = 'kmendfapggjehodndflmmgagdbamhnfd';

/**
 * Message types for messsages to/from the extension
 * @const
 * @enum {string}
 */
u2f.MessageTypes = {
  'U2F_REGISTER_REQUEST': 'u2f_register_request',
  'U2F_SIGN_REQUEST': 'u2f_sign_request',
  'U2F_REGISTER_RESPONSE': 'u2f_register_response',
  'U2F_SIGN_RESPONSE': 'u2f_sign_response'
};

/**
 * Response status codes
 * @const
 * @enum {number}
 */
u2f.ErrorCodes = {
  'OK': 0,
  'OTHER_ERROR': 1,
  'BAD_REQUEST': 2,
  'CONFIGURATION_UNSUPPORTED': 3,
  'DEVICE_INELIGIBLE': 4,
  'TIMEOUT': 5
};

/**
 * A message type for registration requests
 * @typedef {{
 *   type: u2f.MessageTypes,
 *   signRequests: Array.<u2f.SignRequest>,
 *   registerRequests: ?Array.<u2f.RegisterRequest>,
 *   timeoutSeconds: ?number,
 *   requestId: ?number
 * }}
 */
u2f.Request;

/**
 * A message for registration responses
 * @typedef {{
 *   type: u2f.MessageTypes,
 *   responseData: (u2f.Error | u2f.RegisterResponse | u2f.SignResponse),
 *   requestId: ?number
 * }}
 */
u2f.Response;

/**
 * An error object for responses
 * @typedef {{
 *   errorCode: u2f.ErrorCodes,
 *   errorMessage: ?string
 * }}
 */
u2f.Error;

/**
 * Data object for a single sign request.
 * @typedef {{
 *   version: string,
 *   challenge: string,
 *   keyHandle: string,
 *   appId: string
 * }}
 */
u2f.SignRequest;

/**
 * Data object for a sign response.
 * @typedef {{
 *   keyHandle: string,
 *   signatureData: string,
 *   clientData: string
 * }}
 */
u2f.SignResponse;

/**
 * Data object for a registration request.
 * @typedef {{
 *   version: string,
 *   challenge: string,
 *   appId: string
 * }}
 */
u2f.RegisterRequest;

/**
 * Data object for a registration response.
 * @typedef {{
 *   registrationData: string,
 *   clientData: string
 * }}
 */
u2f.RegisterResponse;


// Low level MessagePort API support

/**
 * Call MessagePort disconnect
 */
u2f.disconnect = function() {
  if (u2f.port_ && u2f.port_.port_) {
    u2f.port_.port_.disconnect();
    u2f.port_ = null;
  }
};

/**
 * Sets up a MessagePort to the U2F extension using the
 * available mechanisms.
 * @param {function((MessagePort|u2f.WrappedChromeRuntimePort_))} callback
 */
u2f.getMessagePort = function(callback) {
  if (typeof chrome != 'undefined' && chrome.runtime) {
    // The actual message here does not matter, but we need to get a reply
    // for the callback to run. Thus, send an empty signature request
    // in order to get a failure response.
    var msg = {
      type: u2f.MessageTypes.U2F_SIGN_REQUEST,
      signRequests: []
    };
    chrome.runtime.sendMessage(u2f.EXTENSION_ID, msg, function() {
      if (!chrome.runtime.lastError) {
        // We are on a whitelisted origin and can talk directly
        // with the extension.
        u2f.getChromeRuntimePort_(callback);
      } else {
        // chrome.runtime was available, but we couldn't message
        // the extension directly, use iframe
        u2f.getIframePort_(callback);
      }
    });
  } else {
    // chrome.runtime was not available at all, which is normal
    // when this origin doesn't have access to any extensions.
    u2f.getIframePort_(callback);
  }
};

/**
 * Connects directly to the extension via chrome.runtime.connect
 * @param {function(u2f.WrappedChromeRuntimePort_)} callback
 * @private
 */
u2f.getChromeRuntimePort_ = function(callback) {
  var port = chrome.runtime.connect(u2f.EXTENSION_ID,
    {'includeTlsChannelId': true});
  setTimeout(function() {
    callback(null, new u2f.WrappedChromeRuntimePort_(port));
  }, 0);
};

/**
 * A wrapper for chrome.runtime.Port that is compatible with MessagePort.
 * @param {Port} port
 * @constructor
 * @private
 */
u2f.WrappedChromeRuntimePort_ = function(port) {
  this.port_ = port;
};

/**
 * Posts a message on the underlying channel.
 * @param {Object} message
 */
u2f.WrappedChromeRuntimePort_.prototype.postMessage = function(message) {
  this.port_.postMessage(message);
};

/**
 * Emulates the HTML 5 addEventListener interface. Works only for the
 * onmessage event, which is hooked up to the chrome.runtime.Port.onMessage.
 * @param {string} eventName
 * @param {function({data: Object})} handler
 */
u2f.WrappedChromeRuntimePort_.prototype.addEventListener =
    function(eventName, handler) {
  var name = eventName.toLowerCase();
  if (name == 'message' || name == 'onmessage') {
    this.port_.onMessage.addListener(function(message) {
      // Emulate a minimal MessageEvent object
      handler({'data': message});
    });
  } else {
    console.error('WrappedChromeRuntimePort only supports onMessage');
  }
};

/**
 * Sets up an embedded trampoline iframe, sourced from the extension.
 * @param {function(MessagePort)} callback
 * @private
 */
u2f.getIframePort_ = function(callback) {
  // Create the iframe
  var iframeOrigin = 'chrome-extension://' + u2f.EXTENSION_ID;
  var iframe = document.createElement('iframe');
  iframe.src = iframeOrigin + '/u2f-comms.html';
  iframe.setAttribute('style', 'display:none');
  document.body.appendChild(iframe);

  var hasCalledBack = false;

  var channel = new MessageChannel();
  var ready = function(message) {
    if (message.data == 'ready') {
      channel.port1.removeEventListener('message', ready);
      if (!hasCalledBack)
      {
        hasCalledBack = true;
        callback(null, channel.port1);
      }
    } else {
      console.error('First event on iframe port was not "ready"');
    }
  };
  channel.port1.addEventListener('message', ready);
  channel.port1.start();

  iframe.addEventListener('load', function() {
    // Deliver the port to the iframe and initialize
    iframe.contentWindow.postMessage('init', iframeOrigin, [channel.port2]);
  });

  // Give this 200ms to initialize, after that, we treat this method as failed
  setTimeout(function() {
    if (!hasCalledBack)
    {
      hasCalledBack = true;
      callback(new Error("IFrame extension not supported"));
    }
  }, 200);
};


// High-level JS API

/**
 * Default extension response timeout in seconds.
 * @const
 */
u2f.EXTENSION_TIMEOUT_SEC = 30;

/**
 * A singleton instance for a MessagePort to the extension.
 * @type {MessagePort|u2f.WrappedChromeRuntimePort_}
 * @private
 */
u2f.port_ = null;

/**
 * Callbacks waiting for a port
 * @type {Array.<function((MessagePort|u2f.WrappedChromeRuntimePort_))>}
 * @private
 */
u2f.waitingForPort_ = [];

/**
 * A counter for requestIds.
 * @type {number}
 * @private
 */
u2f.reqCounter_ = 0;

/**
 * A map from requestIds to client callbacks
 * @type {Object.<number,(function((u2f.Error|u2f.RegisterResponse))
 *                       |function((u2f.Error|u2f.SignResponse)))>}
 * @private
 */
u2f.callbackMap_ = {};

/**
 * Creates or retrieves the MessagePort singleton to use.
 * @param {function((MessagePort|u2f.WrappedChromeRuntimePort_))} callback
 * @private
 */
u2f.getPortSingleton_ = function(callback) {
  if (u2f.port_) {
    callback(null, u2f.port_);
  } else {
    if (u2f.waitingForPort_.length == 0) {
      u2f.getMessagePort(function(err, port) {
        if (!err) {
          u2f.port_ = port;
          u2f.port_.addEventListener('message',
            /** @type {function(Event)} */ (u2f.responseHandler_));
        }

        // Careful, here be async callbacks. Maybe.
        while (u2f.waitingForPort_.length)
          u2f.waitingForPort_.shift()(err, port);
      });
    }
    u2f.waitingForPort_.push(callback);
  }
};

/**
 * Handles response messages from the extension.
 * @param {MessageEvent.<u2f.Response>} message
 * @private
 */
u2f.responseHandler_ = function(message) {
  var response = message.data;
  var reqId = response['requestId'];
  if (!reqId || !u2f.callbackMap_[reqId]) {
    console.error('Unknown or missing requestId in response.');
    return;
  }
  var cb = u2f.callbackMap_[reqId];
  delete u2f.callbackMap_[reqId];
  cb(null, response['responseData']);
};

/**
 * Calls the callback with true or false as first and only argument
 * @param {Function} callback
 */
u2f.isSupported = function(callback) {
  u2f.getPortSingleton_(function(err, port) {
    callback(!err);
  });
}

/**
 * Dispatches an array of sign requests to available U2F tokens.
 * @param {Array.<u2f.SignRequest>} signRequests
 * @param {function((u2f.Error|u2f.SignResponse))} callback
 * @param {number=} opt_timeoutSeconds
 */
u2f.sign = function(signRequests, callback, opt_timeoutSeconds) {
  u2f.getPortSingleton_(function(err, port) {
    if (err)
      return callback(err);

    var reqId = ++u2f.reqCounter_;
    u2f.callbackMap_[reqId] = callback;
    var req = {
      type: u2f.MessageTypes.U2F_SIGN_REQUEST,
      signRequests: signRequests,
      timeoutSeconds: (typeof opt_timeoutSeconds !== 'undefined' ?
        opt_timeoutSeconds : u2f.EXTENSION_TIMEOUT_SEC),
      requestId: reqId
    };
    port.postMessage(req);
  });
};

/**
 * Dispatches register requests to available U2F tokens. An array of sign
 * requests identifies already registered tokens.
 * @param {Array.<u2f.RegisterRequest>} registerRequests
 * @param {Array.<u2f.SignRequest>} signRequests
 * @param {function((u2f.Error|u2f.RegisterResponse))} callback
 * @param {number=} opt_timeoutSeconds
 */
u2f.register = function(registerRequests, signRequests,
    callback, opt_timeoutSeconds) {
  u2f.getPortSingleton_(function(err, port) {
    if (err)
      return callback(err);

    var reqId = ++u2f.reqCounter_;
    u2f.callbackMap_[reqId] = callback;
    var req = {
      type: u2f.MessageTypes.U2F_REGISTER_REQUEST,
      signRequests: signRequests,
      registerRequests: registerRequests,
      timeoutSeconds: (typeof opt_timeoutSeconds !== 'undefined' ?
        opt_timeoutSeconds : u2f.EXTENSION_TIMEOUT_SEC),
      requestId: reqId
    };
    port.postMessage(req);
  });
};

},{}],12:[function(require,module,exports){
(function (global){
'use strict';

module.exports = API;

var chromeApi = require( './google-u2f-api' );

// Feature detection (yes really)
var isBrowser = ( typeof navigator !== 'undefined' ) && !!navigator.userAgent;
var isSafari = isBrowser && navigator.userAgent.match( /Safari\// )
	&& !navigator.userAgent.match( /Chrome\// );
var isEDGE = isBrowser && navigator.userAgent.match( /Edge\/1[2345]/ );

var _backend = null;
function getBackend( Promise )
{
	if ( !_backend )
		_backend = new Promise( function( resolve, reject )
		{
			function notSupported( )
			{
				// Note; {native: true} means *not* using Google's hack
				resolve( { u2f: null, native: true } );
			}

			if ( !isBrowser )
				return notSupported( );

			if ( isSafari )
				// Safari doesn't support U2F, and the Safari-FIDO-U2F
				// extension lacks full support (Multi-facet apps), so we
				// block it until proper support.
				return notSupported( );

			var hasNativeSupport =
				( typeof window.u2f !== 'undefined' ) &&
				( typeof window.u2f.sign === 'function' );

			if ( hasNativeSupport )
				resolve( { u2f: window.u2f, native: true } );

			if ( isEDGE )
				// We don't want to check for Google's extension hack on EDGE
				// as it'll cause trouble (popups, etc)
				return notSupported( );

			if ( location.protocol === 'http:' )
				// U2F isn't supported over http, only https
				return notSupported( );

			if ( typeof MessageChannel === 'undefined' )
				// Unsupported browser, the chrome hack would throw
				return notSupported( );

			// Test for google extension support
			chromeApi.isSupported( function( ok )
			{
				if ( ok )
					resolve( { u2f: chromeApi, native: false } );
				else
					notSupported( );
			} );
		} );

	return _backend;
}

function API( Promise )
{
	return {
		isSupported   : isSupported.bind( Promise ),
		ensureSupport : ensureSupport.bind( Promise ),
		register      : register.bind( Promise ),
		sign          : sign.bind( Promise ),
		ErrorCodes    : API.ErrorCodes,
		ErrorNames    : API.ErrorNames
	};
}

API.ErrorCodes = {
	CANCELLED: -1,
	OK: 0,
	OTHER_ERROR: 1,
	BAD_REQUEST: 2,
	CONFIGURATION_UNSUPPORTED: 3,
	DEVICE_INELIGIBLE: 4,
	TIMEOUT: 5
};
API.ErrorNames = {
	"-1": "CANCELLED",
	"0": "OK",
	"1": "OTHER_ERROR",
	"2": "BAD_REQUEST",
	"3": "CONFIGURATION_UNSUPPORTED",
	"4": "DEVICE_INELIGIBLE",
	"5": "TIMEOUT"
};

function makeError( msg, err )
{
	var code = err != null ? err.errorCode : 1; // Default to OTHER_ERROR
	var type = API.ErrorNames[ '' + code ];
	var error = new Error( msg );
	error.metaData = {
		type: type,
		code: code
	}
	return error;
}

function deferPromise( Promise, promise )
{
	var ret = { };
	ret.promise = new Promise( function( resolve, reject ) {
		ret.resolve = resolve;
		ret.reject = reject;
		promise.then( resolve, reject );
	} );
	/**
	 * Reject request promise and disconnect port if 'disconnect' flag is true
	 * @param {string} msg
	 * @param {boolean} disconnect
	 */
	ret.promise.cancel = function( msg, disconnect )
	{
		getBackend( Promise )
		.then( function( backend )
		{
			if ( disconnect && !backend.native )
				backend.u2f.disconnect( );

			ret.reject( makeError( msg, { errorCode: -1 } ) );
		} );
	};
	return ret;
}

function defer( Promise, fun )
{
	return deferPromise( Promise, new Promise( function( resolve, reject )
	{
		try
		{
			fun && fun( resolve, reject );
		}
		catch ( err )
		{
			reject( err );
		}
	} ) );
}

function isSupported( )
{
	var Promise = this;

	return getBackend( Promise )
	.then( function( backend )
	{
		return !!backend.u2f;
	} );
}

function _ensureSupport( backend )
{
	if ( !backend.u2f )
	{
		if ( location.protocol === 'http:' )
			throw new Error( "U2F isn't supported over http, only https" );
		throw new Error( "U2F not supported" );
	}
}

function ensureSupport( )
{
	var Promise = this;

	return getBackend( Promise )
	.then( _ensureSupport );
}

function register( registerRequests, signRequests /* = null */, timeout )
{
	var Promise = this;

	if ( !Array.isArray( registerRequests ) )
		registerRequests = [ registerRequests ];

	if ( typeof signRequests === 'number' && typeof timeout === 'undefined' )
	{
		timeout = signRequests;
		signRequests = null;
	}

	if ( !signRequests )
		signRequests = [ ];

	return deferPromise( Promise, getBackend( Promise )
	.then( function( backend )
	{
		_ensureSupport( backend );

		var native = backend.native;
		var u2f = backend.u2f;

		return new Promise( function( resolve, reject )
		{
			function cbNative( response )
			{
				if ( response.errorCode )
					reject( makeError( "Registration failed", response ) );
				else
				{
					delete response.errorCode;
					resolve( response );
				}
			}

			function cbChrome( err, response )
			{
				if ( err )
					reject( err );
				else if ( response.errorCode )
					reject( makeError( "Registration failed", response ) );
				else
					resolve( response );
			}

			if ( native )
			{
				var appId = registerRequests[ 0 ].appId;

				u2f.register(
					appId, registerRequests, signRequests, cbNative, timeout );
			}
			else
			{
				u2f.register(
					registerRequests, signRequests, cbChrome, timeout );
			}
		} );
	} ) ).promise;
}

function sign( signRequests, timeout )
{
	var Promise = this;

	if ( !Array.isArray( signRequests ) )
		signRequests = [ signRequests ];

	return deferPromise( Promise, getBackend( Promise )
	.then( function( backend )
	{
		_ensureSupport( backend );

		var native = backend.native;
		var u2f = backend.u2f;

		return new Promise( function( resolve, reject )
		{
			function cbNative( response )
			{
				if ( response.errorCode )
					reject( makeError( "Sign failed", response ) );
				else
				{
					delete response.errorCode;
					resolve( response );
				}
			}

			function cbChrome( err, response )
			{
				if ( err )
					reject( err );
				else if ( response.errorCode )
					reject( makeError( "Sign failed", response ) );
				else
					resolve( response );
			}

			if ( native )
			{
				var appId = signRequests[ 0 ].appId;
				var challenge = signRequests[ 0 ].challenge;

				u2f.sign( appId, challenge, signRequests, cbNative, timeout );
			}
			else
			{
				u2f.sign( signRequests, cbChrome, timeout );
			}
		} );
	} ) ).promise;
}

function makeDefault( func )
{
	API[ func ] = function( )
	{
		if ( !global.Promise )
			// This is very unlikely to ever happen, since browsers
			// supporting U2F will most likely support Promises.
			throw new Error( "The platform doesn't natively support promises" );

		var args = [ ].slice.call( arguments );
		return API( global.Promise )[ func ].apply( null, args );
	};
}

// Provide default functions using the built-in Promise if available.
makeDefault( 'isSupported' );
makeDefault( 'ensureSupport' );
makeDefault( 'register' );
makeDefault( 'sign' );

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./google-u2f-api":11}],13:[function(require,module,exports){
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

function runTest(comm, ledger, timeout) {
  return comm.create_async(timeout, true).then(function(comm) {
    var btc = new ledger.btc(comm);
    return btc.getWalletPublicKey_async("44'/0'/0'/0").then(function(result) {
      console.log(result);
      comm.close_async();
    });
  });
}

module.exports = runTest;

},{}],14:[function(require,module,exports){
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

function runTest(comm, ledger, timeout) {
  return comm.create_async(timeout, true).then(function(comm) {
    var btc = new ledger.btc(comm);
    var tx1 = btc.splitTransaction(
      "01000000014ea60aeac5252c14291d428915bd7ccd1bfc4af009f4d4dc57ae597ed0420b71010000008a47304402201f36a12c240dbf9e566bc04321050b1984cd6eaf6caee8f02bb0bfec08e3354b022012ee2aeadcbbfd1e92959f57c15c1c6debb757b798451b104665aa3010569b49014104090b15bde569386734abf2a2b99f9ca6a50656627e77de663ca7325702769986cf26cc9dd7fdea0af432c8e2becc867c932e1b9dd742f2a108997c2252e2bdebffffffff0281b72e00000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88aca0860100000000001976a9144533f5fb9b4817f713c48f0bfe96b9f50c476c9b88ac00000000"
    );
    return btc
      .createPaymentTransactionNew_async(
        [[tx1, 1]],
        ["0'/0/0"],
        undefined,
        "01905f0100000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac"
      )
      .then(function(result) {
        console.log(result);
        comm.close_async();
      });
  });
}

module.exports = runTest;

},{}],15:[function(require,module,exports){
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

function runTest(comm, ledger, timeout) {
  return comm.create_async(timeout, true).then(function(comm) {
    var btc = new ledger.btc(comm);
    var tx1 = btc.splitTransaction(
      "01000000014ea60aeac5252c14291d428915bd7ccd1bfc4af009f4d4dc57ae597ed0420b71010000008a47304402201f36a12c240dbf9e566bc04321050b1984cd6eaf6caee8f02bb0bfec08e3354b022012ee2aeadcbbfd1e92959f57c15c1c6debb757b798451b104665aa3010569b49014104090b15bde569386734abf2a2b99f9ca6a50656627e77de663ca7325702769986cf26cc9dd7fdea0af432c8e2becc867c932e1b9dd742f2a108997c2252e2bdebffffffff0281b72e00000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88aca0860100000000001976a9144533f5fb9b4817f713c48f0bfe96b9f50c476c9b88ac00000000"
    );
    return btc
      .signP2SHTransaction_async(
        [
          [
            tx1,
            1,
            "52210289b4a3ad52a919abd2bdd6920d8a6879b1e788c38aa76f0440a6f32a9f1996d02103a3393b1439d1693b063482c04bd40142db97bdf139eedd1b51ffb7070a37eac321030b9a409a1e476b0d5d17b804fcdb81cf30f9b99c6f3ae1178206e08bc500639853ae"
          ]
        ],
        ["0'/0/0"],
        "01905f0100000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac"
      )
      .then(function(result) {
        console.log(result);
        comm.close_async();
      });
  });
}

module.exports = runTest;

},{}],16:[function(require,module,exports){
(function (Buffer){
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

function runTest(comm, ledger, timeout) {
  return comm.create_async(timeout, true).then(function(comm) {
    var btc = new ledger.btc(comm);
    return btc
      .signMessageNew_async("44'/0'/0'/0", Buffer.from("test").toString("hex"))
      .then(function(result) {
        var v = result["v"] + 27 + 4;
        var signature = Buffer.from(
          v.toString(16) + result["r"] + result["s"],
          "hex"
        ).toString("base64");
        console.log("Signature : " + signature);
        comm.close_async();
      });
  });
}

module.exports = runTest;

}).call(this,require("buffer").Buffer)
},{"buffer":8}],17:[function(require,module,exports){
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

function runTest(comm, ledger, timeout) {
  return comm.create_async(timeout, true).then(function(comm) {
    var eth = new ledger.eth(comm);
    return eth.getAppConfiguration_async().then(function(result) {
      console.log(result);
      comm.close_async();
    });
  });
}

module.exports = runTest;

},{}],18:[function(require,module,exports){
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

function runTest(comm, ledger, timeout) {
  return comm.create_async(timeout, true).then(function(comm) {
    var eth = new ledger.eth(comm);
    return eth.getAddress_async("44'/60'/0'/0'/0").then(function(result) {
      console.log(result);
      comm.close_async();
    });
  });
}

module.exports = runTest;

},{}],19:[function(require,module,exports){
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

function runTest(comm, ledger, timeout) {
  return comm.create_async(timeout, true).then(function(comm) {
    var eth = new ledger.eth(comm);
    return eth
      .signTransaction_async(
        "44'/60'/0'/0'/0",
        "e8018504e3b292008252089428ee52a8f3d6e5d15f8b131996950d7f296c7952872bd72a2487400080"
      )
      .then(function(result) {
        console.log(result);
        comm.close_async();
      });
  });
}

module.exports = runTest;

},{}],20:[function(require,module,exports){
(function (Buffer){
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

function runTest(comm, ledger, timeout) {
  return comm.create_async(timeout, true).then(function(comm) {
    var eth = new ledger.eth(comm);
    return eth
      .signPersonalMessage_async(
        "44'/60'/0'/0'/0",
        Buffer.from("test").toString("hex")
      )
      .then(function(result) {
        var v = result["v"] - 27;
        v = v.toString(16);
        if (v.length < 2) {
          v = "0" + v;
        }
        console.log("Signature 0x" + result["r"] + result["s"] + v);
        comm.close_async();
      });
  });
}

module.exports = runTest;

}).call(this,require("buffer").Buffer)
},{"buffer":8}],21:[function(require,module,exports){
if (typeof ledger == "undefined") {
  ledger = require("..");
  comm = ledger.comm_node;
  browser = false;
} else {
  browser = true;
  comm = ledger.comm_u2f;
}

var TIMEOUT = 5 * 1000;

var tests = [
  { name: "testBtc", run: require("./testBtc") },
  { name: "testBtc2", run: require("./testBtc2") },
  { name: "testBtc3", run: require("./testBtc3") },
  { name: "testBtc4", run: require("./testBtc4") },
  {
    run: function() {
      return new Promise(function(resolve, reject) {
        var s = 15;
        console.info("You have " + s + " seconds to switch to eth app ...");
        var interval = setInterval(function() {
          if (--s) {
            console.log(s + " ...");
          } else {
            clearInterval(interval);
            resolve();
          }
        }, 1000);
      });
    }
  },
  { name: "testEth", run: require("./testEth") },
  { name: "testEth2", run: require("./testEth2") },
  { name: "testEth3", run: require("./testEth3") },
  { name: "testEth4", run: require("./testEth4") }
];

function runTests() {
  tests.reduce(function(a, step) {
    return a
      .then(function() {
        console.info(step.name ? "Running test " + step.name : "");
        return step.run(comm, ledger, TIMEOUT);
      })
      .catch(function(err) {
        console.error("Failed test", step.name, err);
      });
  }, Promise.resolve());
}

if (!browser) {
  runTests();
}

module.exports = runTests;

},{"..":5,"./testBtc":13,"./testBtc2":14,"./testBtc3":15,"./testBtc4":16,"./testEth":17,"./testEth2":18,"./testEth3":19,"./testEth4":20}]},{},[21])(21)
});