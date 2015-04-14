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

var CardTerminalFactory = require('./CardTerminalFactory');
var NodeHIDCardTerminal = require('./NodeHIDCardTerminal');
var HID = require('node-hid');
var Q = require('q');

var NodeHIDCardTerminalFactory = function(pid, ledgerTransport) {
	this.pid = pid;
	this.ledgerTransport = ledgerTransport;
} 
NodeHIDCardTerminalFactory.prototype = new CardTerminalFactory();

NodeHIDCardTerminalFactory.prototype.list_async = function() {
		var devices = HID.devices();
		var deviceList = [];
		for (var i in devices) {
			if ((devices[i].vendorId == 0x2581) && (devices[i].productId == this.pid)) {
				deviceList.push(devices[i].path);
			}
		}
		return Q.fcall(function() {
			return deviceList;
		});
}

NodeHIDCardTerminalFactory.prototype.waitInserted = function() {
		throw "Not implemented"
}

NodeHIDCardTerminalFactory.prototype.getCardTerminal = function(device) {
		return new NodeHIDCardTerminal(device, device, this.ledgerTransport);
}

module.exports = NodeHIDCardTerminalFactory;

