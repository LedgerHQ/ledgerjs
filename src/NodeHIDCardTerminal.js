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

var CardTerminal = require('./CardTerminal');
var NodeHIDCard = require('./NodeHIDCard');
var Q = require('q');

var NodeHIDCardTerminal = function(device, terminalName, ledgerTransport) {
	this.device = device;
	this.terminalName = terminalName;
	this.ledgerTransport = ledgerTransport;
} 
NodeHIDCardTerminal.prototype = new CardTerminal();

NodeHIDCardTerminal.prototype.isCardPresent = function() {
		return true;
}
	
NodeHIDCardTerminal.prototype.getCard_async = function() {
		if (typeof this.cardInstance == "undefined") {
			this.cardInstance = new NodeHIDCard(this, this.device, this.ledgerTransport);
			return this.cardInstance.connect_async();
		}
		var currentObject = this;
		return Q.fcall(function() {
			return currentObject.cardInstance;
		});
}
		
NodeHIDCardTerminal.prototype.getTerminalName = function() {
		return this.terminalName;
}
	
NodeHIDCardTerminal.prototype.getName = function() {		
		if ((typeof this.terminalName == "undefined") || (this.terminalName.length == 0)) {
			return "Default";
		}
		else {
			return this.terminalName;
		}
}
	
module.exports = NodeHIDCardTerminal;		

