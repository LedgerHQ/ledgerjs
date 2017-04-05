[![npm version](https://badge.fury.io/js/ledgerco.svg)](https://www.npmjs.com/package/ledgerco)

# ledger-node-js-api
Node and browser communication APIs for Ledger Nano / Nano S / Blue application 

This package defines basic communication methods for Ledger Personal Security Devices products as well as bindings for the Bitcoin and Ethereum APIs.

When using in a browser, make sure to set up "Browser mode" in the application settings on the device if available.

## Initialization on Node

The communication API relies on node-hid

```javascript
ledger.comm_node.create_async().then(function(comm) {
	 ...
});
```

You can also use list_async and create the communication object manually to pick one specific device if several are connected

## Initialization on a browser

The communication API is compatible with every browser supporting FIDO U2F either directly (Chrome, Opera) or through a third party extension (Firefox). Pages shall be served from an HTTPS connection as a requirement of the U2F API.

Make sure to include browser/ledger.min.js and browser/u2f-api.js in your web page and initialize with 

```javascript
ledger.comm_u2f.create_async().then(function(comm) {
	 ...
});
```

To re-create the browser bindings, use

```
npm run browserify
npm run uglify
```

## Using with Bitcoin

Create an application object after opening the device

```javascript
var btc = new ledger.btc(comm);
```

You can retrieve a public key and an address given its BIP 32 path

```javascript
btc.getWalletPublicKey_async("44'/0'/0'/0").then(
     function(result) { console.log(result);}).fail(
     function(error) { console.log(error); });
```

For each UTXO included in your transaction, create a transaction object from the raw serialized version of the transaction used in this UTXO

```javascript
var tx1 = btc.splitTransaction("01000000014ea60aeac5252c14291d428915bd7ccd1bfc4af009f4d4dc57ae597ed0420b71010000008a47304402201f36a12c240dbf9e566bc04321050b1984cd6eaf6caee8f02bb0bfec08e3354b022012ee2aeadcbbfd1e92959f57c15c1c6debb757b798451b104665aa3010569b49014104090b15bde569386734abf2a2b99f9ca6a50656627e77de663ca7325702769986cf26cc9dd7fdea0af432c8e2becc867c932e1b9dd742f2a108997c2252e2bdebffffffff0281b72e00000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88aca0860100000000001976a9144533f5fb9b4817f713c48f0bfe96b9f50c476c9b88ac00000000");

var tx2 = btc.splitTransaction("...");
```

To sign a transaction involving standard (P2PKH) inputs, call createPaymentTransactionNew_async with the folowing parameters 

 - `inputs` is an array of [ transaction, output_index, optional redeem script, optional sequence ] where
   - transaction is the previously computed transaction object for this UTXO
   - output_index is the output in the transaction used as input for this UTXO (counting from 0)
   - redeem script is the optional redeem script to use when consuming a Segregated Witness input
   - sequence is the sequence number to use for this input (when using RBF), or non present
 - `associatedKeysets` is an array of BIP 32 paths pointing to the path to the private key used for each UTXO  
 - `changePath` is an optional BIP 32 path pointing to the path to the public key used to compute the change address
 - `outputScript` is the hexadecimal serialized outputs of the transaction to sign   
 - `lockTime` is the optional lockTime of the transaction to sign, or default (0)
 - `sigHashType` is the hash type of the transaction to sign, or default (all) 

This method returns the signed transaction ready to be broadcast 

```javascript
btc.createPaymentTransactionNew_async(
   [ [tx1, 1] ], 
   ["0'/0/0"], 
   undefined, 
   "01905f0100000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac").then(
     function(result) { console.log(result);}).fail(
     function(error) { console.log(error); });
```

You can also retrieve the serialized output script as follows

```javascript
var tx1 = btc.splitTransaction("01000000014ea60aeac5252c14291d428915bd7ccd1bfc4af009f4d4dc57ae597ed0420b71010000008a47304402201f36a12c240dbf9e566bc04321050b1984cd6eaf6caee8f02bb0bfec08e3354b022012ee2aeadcbbfd1e92959f57c15c1c6debb757b798451b104665aa3010569b49014104090b15bde569386734abf2a2b99f9ca6a50656627e77de663ca7325702769986cf26cc9dd7fdea0af432c8e2becc867c932e1b9dd742f2a108997c2252e2bdebffffffff0281b72e00000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88aca0860100000000001976a9144533f5fb9b4817f713c48f0bfe96b9f50c476c9b88ac00000000");

var outputScript = btc.serializeTransactionOutputs(tx1).toString('hex');

```

To obtain the signature of multisignature (P2SH) inputs, call signP2SHTransaction_async with the folowing parameters 

 - `inputs` is an array of [ transaction, output_index, redeem script, optional sequence ] where
   - transaction is the previously computed transaction object for this UTXO
   - output_index is the output in the transaction used as input for this UTXO (counting from 0)
   - redeem script is the mandatory redeem script associated to the current P2SH input
   - sequence is the sequence number to use for this input (when using RBF), or non present
 - `associatedKeysets` is an array of BIP 32 paths pointing to the path to the private key used for each UTXO  
 - `outputScript` is the hexadecimal serialized outputs of the transaction to sign  
 - `lockTime` is the optional lockTime of the transaction to sign, or default (0)
 - `sigHashType` is the hash type of the transaction to sign, or default (all) 

This method returns the signed transaction ready to be broadcast 

```javascript
btc.signP2SHTransaction_async(
   [ [tx, 1, "52210289b4a3ad52a919abd2bdd6920d8a6879b1e788c38aa76f0440a6f32a9f1996d02103a3393b1439d1693b063482c04bd40142db97bdf139eedd1b51ffb7070a37eac321030b9a409a1e476b0d5d17b804fcdb81cf30f9b99c6f3ae1178206e08bc500639853ae"] ], 
   ["0'/0/0"], 
   "01905f0100000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac").then(
     function(result) { console.log(result);}).fail(
     function(error) { console.log(error); });
``` 

You can sign a message according to the Bitcoin Signature format and retrieve v, r, s given the message and the BIP 32 path of the account to sign.

```javascript
btc.signMessageNew_async("44'/60'/0'/0'/0", Buffer.from("test").toString("hex")).then(function(result) {
  var v = result['v'] + 27 + 4;
  var signature = Buffer.from(v.toString(16) + result['r'] + result['s'], 'hex').toString('base64');
  console.log("Signature : " + signature);
}).fail(function(ex) {console.log(ex);});
```

## Using with Ethereum 

Create an application object after opening the device

```javascript
var eth = new ledger.eth(comm);
```

You can retrieve a public key and an address given its BIP 32 path

```javascript
eth.getAddress_async("44'/60'/0'/0'/0").then(
     function(result) { console.log(result);}).fail(
     function(error) { console.log(error); });
```

You can sign a transaction and retrieve v, r, s given the raw transaction and the BIP 32 path of the account to sign 

```javascript
eth.signTransaction_async("44'/60'/0'/0'/0", "e8018504e3b292008252089428ee52a8f3d6e5d15f8b131996950d7f296c7952872bd72a2487400080").then(function(result) {
		console.log(result);
}).fail(function(ex) {console.log(ex);});

```

You can sign a message according to eth_sign RPC call and retrieve v, r, s given the message and the BIP 32 path of the account to sign.

```javascript
eth.signPersonalMessage_async("44'/60'/0'/0'/0", Buffer.from("test").toString("hex")).then(function(result) {
    var v = result['v'] - 27;
    v = v.toString(16);
    if (v.length < 2) {
      v = "0" + v;
    }
    console.log("Signature 0x" + result['r'] + result['s'] + v);

}).fail(function(ex) {console.log(ex);});

```
