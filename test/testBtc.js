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

if (typeof ledger == "undefined") {
	ledger = require('ledgerco');
	comm = ledger.comm_node;
	browser = false;
}
else {
	browser = true;
	comm = ledger.comm_u2f;
}

function runTest() {

comm.create_async(0, true).then(function(comm) {

	var btc = new ledger.btc(comm);
	btc.getWalletPublicKey_async("44'/0'/0'/0").then(function(result) {
		console.log(result);
	}).fail(function(ex) {console.log(ex);});

}).fail(function(ex) {console.log(ex);});

}

if (!browser) {
	runTest();
}

