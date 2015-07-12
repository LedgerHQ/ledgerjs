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
		this.hasBuffer = (typeof Buffer != 'undefined');
		if (this.hasBuffer && (value instanceof Buffer)) {
			this.value = value;
			this.encoding = GP.HEX;			
		}
		else {
			switch(encoding) {
				case GP.HEX:
					if (!this.hasBuffer) {
						this.value = Convert.hexToBin(value);
					}
					else {
						this.value = new Buffer(value, 'hex'); 
					}
					break;
			
				case GP.ASCII:
					if (!this.hasBuffer) {
						this.value = value;
					}
					else {
						this.value = new Buffer(value, 'ascii'); 
					}
					break;
				
				default:
					throw "Invalid arguments"; 
			}
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
		if (!this.hasBuffer) {
			return Convert.readHexDigit(Convert.stringToHex(this.value.substring(index, index + 1)));
		}
		else {
			return this.value[index];
		}
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
			if (!this.hasBuffer) {
				result = new ByteString(this.value.substring(offset, offset + count), GP.ASCII);
			}
			else {
				result = new Buffer(count);
				this.value.copy(result, 0, offset, offset + count);
			}
		}
		else 
		if (typeof count == "undefined") {
			if (!this.hasBuffer) {
				result = new ByteString(this.value.substring(offset), GP.ASCII);
			}
			else {
				result = new Buffer(this.value.length - offset);
				this.value.copy(result, 0, offset, this.value.length);
			}
		}
		else {
			throw "Invalid count";
		}
		if (!this.hasBuffer) {
			result.encoding = this.encoding;
			return result;			
		}
		else {
			return new ByteString(result, GP.HEX);
		}
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
		if (!this.hasBuffer) {
			var result = this.value + target.value;
			var x = new ByteString(result, GP.ASCII);
			x.encoding = this.encoding;
			return x;					
		}
		else {
			var result = Buffer.concat([this.value, target.value]);
			return new ByteString(result, GP.HEX);
		}
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
		if (!this.hasBuffer) {
			return (this.value == target.value);
		}
		else {
			return Buffer.equals(this.value, target.value);
		}
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
				if (!this.hasBuffer) {
					return Convert.stringToHex(this.value);
				}
				else {
					return this.value.toString('hex');
				}
			case GP.ASCII:
				if (!this.hasBuffer) {
					return this.value;
				}
				else {
					return this.value.toString();
				}
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
