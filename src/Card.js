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

var GP = require('./GP');
var ByteString = require('./ByteString');
var Convert = require('./Convert');

var Card = function() {
}

/**
 * Retrieve the terminal associated to this card
 * @returns {CardTerminal} terminal associated to the card 
 */	
Card.prototype.getTerminal = function() {
}
	
/**
 * Retrieve the card Answer To Reset
 * @returns {ByteString} Answer To Reset
 */	
Card.prototype.getAtr = function() {
}
	
/**
 * Exchange an APDU with the card
 * After this exchange, the properties SW, SW1 and SW2 will be set
 * @param {ByteString} apdu APDU to exchange
 * @param {Number} [returnLength] optional length to retrieve for a class 4 command
 * @returns {ByteString} APDU response without the status word
 */	
Card.prototype.exchange_async = function(apdu, returnLength) {
}
	
/**
 * Exchange a set of APDUs
 * @param {Array} apdus ByteString APDUs to exchange. An APDU can be put in an array with [ APDUContent, returnLength ] for a class 4 command
 * @param {Array} statuses Array of authorized statuses for each APDU in the [ status1, status2 or [SW, mask] ] format for each array element
 * @param {Boolean} [answerAll] return all answers + appended SW as an Array of ByteString if set to true (default : false)
 * @param {Boolean} [throwException] throw an exception if statuses don't match (default : true)
 * @returns {Array|ByteString} Full APDU responses or APDU response for the last APDU 
 */
Card.prototype.exchangeMultiple = function(apdus, statuses, answerAll, throwException) {
		if (!(apdus instanceof Array)) {
			throw "Invalid apdus";
		}
		if (!(statuses instanceof Array)) {
			throw "Invalid statuses";
		}
		if (apdus.length != statuses.length) {
			throw "APDUs and status length differ";
		}
		if (typeof answerAll == "undefined") {
			answerAll = false;
		}
		if (typeof throwException == "undefined") {
			throwException = true;
		}
		var response;
		var result;
		if (answerAll) {
			result = [];
		}
		for (var i=0; i<apdus.length; i++) {
			var apdu;
			var returnLength;
			if (apdus[i] instanceof ByteString) {
				apdu = apdus[i];
				returnLength = undefined; // mandated by javascript variable definition scope
			}
			else
			if (apdus[i] instanceof Array) {
				if (!(apdus[i][0] instanceof ByteString)) {
					throw "APDU array " + i + " content must be a ByteString";
				}
				if (typeof apdus[i][1] != "number") {
					throw "APDU array " + i + " returned length must be a Number";
				}
				apdu = apdus[i][0];
				returnLength = apdus[i][1];
			}
			else {
				throw "APDU " + i + " must be a ByteString";
			}
			if (!(statuses[i] instanceof Array)) {
				throw "status " + i + " must be an Array";
			}
			response = this.exchange(apdu, returnLength);
			for (var j=0; j<statuses[i].length; j++) {
				if (typeof statuses[i][j] == "number") {
					if (this.SW == statuses[i][j]) {
						break;
					}
				}
				else {
					if ((this.SW & statuses[i][j][1]) == statuses[i][j][0]) {
						break;
					}
				}
			}
			// Report an exception only if the card layer says so (i.e. always if not called by a remote card) 
			// otherwise it's up to the remote side to report the exception in order to track the exchanged commands
			if ((j == statuses[i].length) && throwException) {
				throw "Status " + i + " differ - " + Convert.toHexShort(this.SW);
			}		
			if (answerAll) {
				result.push(response.concat(new ByteString("" + Convert.toHexShort(this.SW), GP.HEX)));
				if (j == statuses[i].length) {
					break;
				}
			}
		}
		if (answerAll) {
			return result;
		}
		else {
			return response;
		}
}
	
/**
 * Implementation of the GlobalPlatform Scripting sendApdu method
 * @param {Number|ByteString} cla|apdu CLASS of the APDU to send, or full APDU to send already formatted
 * @param {Number|Array} ins INSTRUCTION of the APDU to send or Status Word to check (Number[], or [SW, mask][]) if sending an already formatted APDU
 * @param {Number} p1 P1 of the APDU to send
 * @param {Number} p2 P2 of the APDU to send
 * @param {Array|ByteString|Number} [opt1] Optional Status Word to check (Number[], or [SW, mask][]), ByteString data to send, or length to retrieve
 * @param {Array|Number} [opt2] Optional Status Word to check (Number[]), or Length to retrieve
 * @param {Array} [opt3] Optional Status Word to check (Number[], or [SW, mask][])
 * @param {Object} [wrapScript] optional object implementing exchangeWrapped
 * @returns {ByteString} APDU response without the status word
 */
Card.prototype.sendApdu_async = function(cla, ins, p1, p2, opt1, opt2, opt3, wrapScript) {
		var swCheck, le;
		var apduByteString;
		// Redirect to the internal implementation as a convenience
		if (cla instanceof ByteString) {
			apduByteString = cla;
			// We can have a status check as a bonus
			if (ins instanceof Array) {
				swCheck = ins;
			}
		}		
		else {
			// First format the APDU
			if (!(typeof cla == "number")) {
				throw "Invalid CLA";
			}
			if (!(typeof ins == "number")) {
				throw "Invalid INS";
			}
			if (!(typeof p1 == "number")) {
				throw "Invalid P1";
			}
			if (!(typeof p2 == "number")) {
				throw "Invalid P2";
			}
			var apdu = Convert.toHexDigit(cla) + Convert.toHexDigit(ins) + Convert.toHexDigit(p1) + Convert.toHexDigit(p2);
			if (typeof opt1 == "number") {
				apdu += Convert.toHexDigit(opt1);
				le = opt1;
			}
			else
			if (opt1 instanceof ByteString) {
				apdu += Convert.toHexDigit(opt1.length) + opt1.toStringIE(GP.HEX);
			}
			else {
				apdu += "00";
			}

			apduByteString = new ByteString(apdu, GP.HEX);
			// Check the remaining parameters validity
			if (opt1 instanceof Array) {
				// Number[] scenario
				if (!((typeof opt2 == "undefined") && (typeof opt3 == "undefined"))) {
					throw "Invalid parameters";
				}
				swCheck = opt1;
			}
			else
			if (opt1 instanceof ByteString) {
				// Number[] scenario
				if ((typeof opt2 == "undefined") && (typeof opt3 == "undefined")) {
					// Valid command, no further data
				}
				else
				if ((opt2 instanceof Array) && (typeof opt3 == "undefined")) {
					// SW to check
					swCheck = opt2;
				}
				else
				if ((typeof le == "number") && (op3 instanceof Array)) {
					// Le to retrieve and SW to check
					le = opt2;
					swCheck = opt3;
				}
				else {
					throw "Invalid parameters";
				}
			}
			else
			if (typeof opt1 == "number") {
				if ((typeof opt2 == "undefined") && (typeof opt3 == "undefined")) {
					// Simple Case 2 scenario already handled in the APDU itself
				}
				else 
				if ((opt2 instanceof Array) && (typeof opt3 == "undefined")) {
					swCheck = opt2;
				}
				else {
					throw "Invalid parameters";
				}
			}
			else
			if (typeof opt1 == "undefined") {
				if (!((typeof opt2 == "undefined") && (typeof opt3 == "undefined"))) {
					throw "Invalid parameters";
				}
			}
		}
		// Check the SW if defined
		if (swCheck) {
			if (swCheck.length < 1) {
				throw "Invalid SW check";
			}
			for (var i=0; i<swCheck.length; i++) {
				if (swCheck[i] instanceof Array) {
					if ((swCheck[i].length != 2) || (typeof swCheck[i][0] != "number") || (typeof swCheck[i][1] != "number")) {
						throw "Invalid SW parameter " + (i + 1);
					}
				}				
				else
				if (!(typeof swCheck[i] == "number")) {
					throw "Invalid SW parameter " + (i + 1);
				}
			}
		}
		// Pass to the internal decoration function for optional additional processing
    //console.log(apduByteString.toString(HEX));
		this._preExchange(apduByteString, swCheck, wrapScript);
		var currentObject = this;
		var promise;
		// Then proceed
		if (typeof wrapScript == "undefined") {
			promise = this.exchange_async(apduByteString, le);
		}
		else {
			promise = wrapScript.exchangeWrapped_async(apduByteString, le);
		}
    //console.log(this.response.toString(HEX) + Convert.toHexShort(this.SW));
        return promise.then(function(response) {
			if (swCheck) {
				for (var i=0; i<swCheck.length; i++) {
					if (typeof swCheck[i] == "number") {
						if (promise.SW == swCheck[i]) {
							break;
						}
					}
					else {
						if ((promise.SW & swCheck[i][1]) == swCheck[i][0]) {
							break;
						}
					}
				}
				if (i == swCheck.length) {
					throw "Invalid status " + i + " - " + Convert.toHexShort(promise.SW);
				}			
			}		
			// TODO : see if the length must be checked, adapted or anything
			return promise.response;
		});
}

/**
 * Let the child do something on the prepared APDU if needed
 * @private
 * @param {ByteString} apduByteString APDU to send
 * @param {Array} [swCheck] Array of statuses to check
 * @param {Object} [wrapScript] wrapping script if available
 */
Card.prototype._preExchange = function(apduByteString, swCheck, wrapScript) {
}
		
/**
 * Return the Status Word related to the last exchange as a number
 * @returns {Number} Status Word
 */
Card.prototype.getSW = function() {
}
	
/**
 * Return the first byte of the Status Word related to the last exchange as a number
 * @returns {Number} first byte of the Status Word
 */
Card.prototype.getSW1 = function() {
}
	
/**
 * Return the second byte of the Status Word related to the last exchange as a number
 * @returns {Number} second byte of the Status Word
 */	
Card.prototype.getSW2 = function() {
}
	
/**
 * Mark the access to the card as exclusive
 */
Card.prototype.beginExclusive = function() {
}
	
/**
 * Mark the access to the card as non exclusive
 */
Card.prototype.endExclusive = function() {
},
	
/**
 * Open a new logical channel to the card
 * @param {Number} [channel] logical channel number to open, if supported
 * @returns {CardChannel} new logical channel
 */
Card.prototype.openLogicalChannel = function(channel) {
}
	
/**
 * Perform a card reset using the given mode. 
 * The card is then reconnected and can be used again
 * @param {Number} [mode] reset mode (Card.RESET_WARM|Card.RESET_COLD, default is Card.RESET_WARM)
 * @returns {ByteString} ATR of the card 
 */
Card.prototype.reset = function(mode) {
}
	
/**
 * Disconnect the card using the given mode. 
 * After this call the card object shall be discarded
 * @param {Number} [mode] reset mode (Card.RESET_WARM|Card.RESET_COLD[Card.LEAVE, default is Card.RESET_WARM)
 */
Card.prototype.disconnect = function(mode) {
}
	
/**
 * Warm reset
 */
Card.RESET_WARM = 1;

/**
 * Cold reset
 */
Card.RESET_COLD = 2;

/**
 * Leave the card in its current state
 */
Card.LEAVE = 3;

module.exports = Card;

