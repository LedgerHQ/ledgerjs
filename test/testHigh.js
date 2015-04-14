/*
************************************************************************
Copyright (c) 2015 LEDGER

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

var ledger = require('ledger-api');
var terminalFactory = new ledger.NodeHIDCardTerminalFactory(0x3b7c, true);
terminalFactory.list_async().then(function(readers) {
	if (readers.length == 0) {
		throw "No terminal found";
	}
	var terminal = terminalFactory.getCardTerminal(readers[0]);
	terminal.getCard_async().then(function(card) {
		var dongle = new ledger.Ledger(card);
		dongle.verifyPin_async(new ledger.ByteString("00000000", ledger.GP.ASCII)).then(function(res) {
			console.log("Please wait, deriving key");
			dongle.getWalletPublicKey_async("44'/0'/0'/0/1").then(function(res) {
				console.log("Public key " + res['publicKey'].toString(ledger.GP.HEX));
				console.log("Address " + res['bitcoinAddress'].toString(ledger.GP.ASCII));
				console.log("Chaincode " + res['chainCode'].toString(ledger.GP.HEX));
			}).fail(function(err) {
				console.log("Failed to get public key");
				console.log(err);
			});
		}).fail(function(err) {
			console.log("Failed to verify PIN");
			console.log(err);
		});
	}).fail(function(err) {
		console.log("Failed to retrieve card");
		console.log(err);
	});
});
