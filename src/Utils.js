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

var Utils = module.exports;

var ByteString = require('./ByteString');
var GP = require('./GP');
var Convert = require('./Convert');
var NodeHIDCardTerminalFactory = require('./NodeHIDCardTerminalFactory');
var BTChip = require('./BTChip');
var Crypto = require('bitcoinjs-lib/src/crypto');
var base58check = require('bs58check');
var Q = require('q');

Utils.getXpub_async = function(btchip, path) {
	var getXpubFingerprint_async = function(btchip, path) {
		var parsedPath = btchip.parseBIP32Path(path);
		if (parsedPath.length > 1) {
			var previousPath = path.substring(0, path.lastIndexOf('/'));
			return btchip.getWalletPublicKey_async(previousPath).then(function(res) {
				var compressedKey = btchip.compressPublicKey(res['publicKey']);
				fingerprint = new ByteString(Crypto.ripemd160(Crypto.sha256(compressedKey.toBuffer()))).bytes(0, 4);
				return fingerprint;
			});
		}
		else {
			return Q.fcall(function() {
				return new ByteString("00000000", GP.HEX);
			});
		}
	}		
	var createXpub = function(depth, fingerprint, childnum, chainCode, publicKey, testnet) {
		var xpub;
		if (testnet) {
			xpub = new ByteString("043587CF", GP.HEX);
		}
		else {
			xpub = new ByteString("0488B21E", GP.HEX);
		}
		xpub = xpub.concat(new ByteString(Convert.toHexByte(depth), GP.HEX));
		xpub = xpub.concat(fingerprint);
		xpub = xpub.concat(childnum);
		xpub = xpub.concat(chainCode);
		xpub = xpub.concat(publicKey);
		return base58check.encode(xpub.toBuffer());
	}	
	return getXpubFingerprint_async(btchip, path).then(function(fingerprint) {
		return btchip.getWalletPublicKey_async(path).then(function(res) {
			var testnet = res['bitcoinAddress'].byteAt(0) != 0x31;
			var compressedKey = btchip.compressPublicKey(res['publicKey']);
			var parsedPath = btchip.parseBIP32Path(path);
			var depth = parsedPath.length;
			var childum;
			if (parsedPath.length > 0) {
				childnum = parsedPath[parsedPath.length - 1];
			}
			else {
				childnum = new ByteString("00000000", GP.HEX);
			}
			return createXpub(depth, fingerprint, childnum, res['chainCode'], compressedKey, testnet);
		});
	});
}

Utils.getFirstDongle_async = function() {
	var terminalFactory = new NodeHIDCardTerminalFactory(0x3b7c, true);
	return terminalFactory.list_async().then(function(readers) {
		if (readers.length == 0) {
			return;
		}
		var terminal = terminalFactory.getCardTerminal(readers[0]);
		return terminal.getCard_async().then(function(card) {
			return new BTChip(card);
		});
	});
}
