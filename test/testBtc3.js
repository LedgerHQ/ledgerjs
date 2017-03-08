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
	var tx1 = btc.splitTransaction("01000000014ea60aeac5252c14291d428915bd7ccd1bfc4af009f4d4dc57ae597ed0420b71010000008a47304402201f36a12c240dbf9e566bc04321050b1984cd6eaf6caee8f02bb0bfec08e3354b022012ee2aeadcbbfd1e92959f57c15c1c6debb757b798451b104665aa3010569b49014104090b15bde569386734abf2a2b99f9ca6a50656627e77de663ca7325702769986cf26cc9dd7fdea0af432c8e2becc867c932e1b9dd742f2a108997c2252e2bdebffffffff0281b72e00000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88aca0860100000000001976a9144533f5fb9b4817f713c48f0bfe96b9f50c476c9b88ac00000000");
	btc.signP2SHTransaction_async([ [tx1, 1, "52210289b4a3ad52a919abd2bdd6920d8a6879b1e788c38aa76f0440a6f32a9f1996d02103a3393b1439d1693b063482c04bd40142db97bdf139eedd1b51ffb7070a37eac321030b9a409a1e476b0d5d17b804fcdb81cf30f9b99c6f3ae1178206e08bc500639853ae"] ], ["0'/0/0"], "01905f0100000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac").then(function(result) {
		console.log(result);
	}).fail(function(ex) {console.log(ex);});

}).fail(function(ex) {console.log(ex);});

}

if (!browser) {
	runTest();
}

