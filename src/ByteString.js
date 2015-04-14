/*
************************************************************************
Copyright (c) 2015 LEDGER
Adapted from code 
Copyright (c) 2012-2014 UBINITY SAS

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

var Convert = require('./Convert');
var GP = require('./GP');

/**
  * @class GPScript ByteString implementation
  * @param {String} value initial value
  * @param {HEX|ASCII} encoding encoding to use
  * @property {Number} length length of the ByteString
  * @constructs
*/
var ByteString = function(value, encoding) {
		this.encoding = encoding;
		if (!(value instanceof Buffer)) {
			switch(encoding) {
				case GP.HEX:
					this.value = new Buffer(value, 'hex'); 
					break;
			
				case GP.ASCII:
					this.value = new Buffer(value, 'ascii'); 
					break;
				
				default:
					throw "Invalid arguments"; 
			}
		}
		else {
			this.value = value;
			this.encoding = GP.HEX;
		}
		this.length = this.value.length;
}

/**
 * Retrieve the byte value at the given index
 * @param {Number} index index
 * @returns {Number} byte value
*/
ByteString.prototype.byteAt = function(index) {
		if (arguments.length < 1) {
			throw "Argument missing";
		}		
		if (typeof index != "number") {
			throw "Invalid index";
		}		
		if ((index < 0) || (index >= this.value.length)) {
			throw "Invalid index offset";
		}
		return this.value[index];
}
	
/**
 * Retrieve a subset of the ByteString
 * @param {Number} offset offset to start at
 * @param {Number} [count] size of the target ByteString (default : use the remaining length)
 * @returns {ByteString} subset of the original ByteString 
*/
ByteString.prototype.bytes = function(offset, count) {
		var result;
		if (arguments.length < 1) {
			throw "Argument missing";
		}
		if (typeof offset != "number") {
			throw "Invalid offset";
		}
		//if ((offset < 0) || (offset >= this.value.length)) {
		if (offset < 0) {
			throw "Invalid offset";
		}
		if (typeof count == "number") {
			if (count < 0) {
				throw "Invalid count";
			}
			result = new Buffer(count);
			this.value.copy(result, 0, offset, offset + count);
		}
		else 
		if (typeof count == "undefined") {
			result = new Buffer(this.value.length - offset);
			this.value.copy(result, 0, offset, this.value.length - offset + 1);
		}
		else {
			throw "Invalid count";
		}
		return new ByteString(result, GP.HEX);
}

/**
 * Appends two ByteString
 * @param {ByteString} target ByteString to append
 * @returns {ByteString} result of the concatenation
*/
ByteString.prototype.concat = function(target) {
		if (arguments.length < 1) {
			throw "Not enough arguments";
		}		
		if (!(target instanceof ByteString)) {
			throw "Invalid argument";
		}
		var result = Buffer.concat([this.value, target.value]);
		return new ByteString(result, GP.HEX);
}
	
/**
 * Check if two ByteString are equal
 * @param {ByteString} target ByteString to check against
 * @returns {Boolean} true if the two ByteString are equal
*/
ByteString.prototype.equals = function(target) {
		if (arguments.length < 1) {
			throw "Not enough arguments";
		}		
		if (!(target instanceof ByteString)) {
			throw "Invalid argument";
		}
		return Buffer.equals(this.value, target.value);
}
	
	
/**
 * Convert the ByteString to a String using the given encoding
 * @param {HEX|ASCII|UTF8|BASE64|CN} encoding encoding to use
 * @return {String} converted content
*/
ByteString.prototype.toString = function(encoding) {
		var targetEncoding = this.encoding;
		if (arguments.length >= 1) {
			if (typeof encoding != "number") {
				throw "Invalid encoding";
			}
			switch(encoding) {
				case GP.HEX:
				case GP.ASCII:
					targetEncoding = encoding;
					break;
				
				default:
					throw "Unsupported arguments";
			}
			targetEncoding = encoding;
		}
		switch(targetEncoding) {
			case GP.HEX:
				return this.value.toString('hex');
			case GP.ASCII:
				return this.value.toString();
			default:
				throw "Unsupported";
		}		
	}
	
ByteString.prototype.toStringIE =  function(encoding) {
	return this.toString(encoding);
}

ByteString.prototype.toBuffer = function() {
	return this.value;
}
	
/**
 * CRC XOR algorithm
 */
ByteString.XOR = 1;

module.exports = ByteString;
