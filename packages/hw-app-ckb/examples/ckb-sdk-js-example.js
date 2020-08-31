/* eslint-disable */

/* NOTE: This file is meant to be run from https://github.com/nervosnetwork/ckb-sdk-js/tree/develop/packages/ckb-sdk-core/examples
 * and works best when that repo exists as a package in ../../ (the ledgerjs/packages dir)
 */

const util = require('util')
const CKB = require('../lib').default
const formatter = require('../../ckb-sdk-rpc/lib/paramsFormatter').default

// Whether to connect to a running instance of the Speculos simulator for
// ledger apps or a real physical ledger
const useSpeculos = false

// Note: there is currently a bug in the speculos simulator that appears not to
// have been adequately addressed that prevents correctly generating the the
// last byte of a recoverable signature. You can work around this by replacing
// the last byte with 00, trying to send the signature, and if that fails
// trying again with 01. This issue _ONLY_ occurs with Speculos, which has a
// different implementation of cryptography primitives than the real hardware.

let Transport = null
if ( useSpeculos ) {
// For speculos:
  Transport = require("@ledgerhq/hw-transport-node-speculos").default;
} else {
// For a real ledger:
  Transport = require("@ledgerhq/hw-transport-node-hid").default;
}
console.log(Transport)

const LedgerCkb = require("@ledgerhq/hw-app-ckb").default;
const blk = require("@ledgerhq/hw-app-ckb/lib/annotated.js");

const bootstrap = async () => {
  const nodeUrl = process.env.NODE_URL || 'http://localhost:8114' // example node url
  const blockAssemblerCodeHash = '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8' // transcribe the block_assembler.code_hash in the ckb.toml from the ckb project

  const ckb = new CKB(nodeUrl) // instantiate the JS SDK with provided node url

  await ckb.loadDeps() // load the dependencies of secp256k1 algorithm which is used to verify the signature in transaction's witnesses.

  let transport = null
  if ( useSpeculos ) {
    // To connect to a speculos instance:
    apduPort = 9999;
    transport = await Transport.open( { apduPort } );
  } else {
    transport = await Transport.open();
  }

  const lckb = new LedgerCkb(transport)
  
  const keydata = await lckb.getWalletPublicKey("44'/309'/0'/0/0", true)
  const publicKeyHash = "0x" + keydata.lockArg
  const address = keydata.address
  addresses = { testnetAddress: address }
  
  /**
   * to see the addresses
   */
  // console.log(JSON.stringify(addresses, null, 2))

  /**
   * calculate the lockHash by the address publicKeyHash
   * 1. the publicKeyHash of the address is required in the args field of lock script
   * 2. compose the lock script with the code hash(as a miner, we use blockAssemblerCodeHash here), and args
   * 3. calculate the hash of lock script via ckb.utils.scriptToHash method
   */

  const lockScript = {
    hashType: "type",
    codeHash: blockAssemblerCodeHash,
    args: publicKeyHash,
  }

  /**
   * to see the lock script
   */
  // console.log(JSON.stringify(lockScript, null, 2))

  const lockHash = ckb.utils.scriptToHash(lockScript)

  /**
   * to see the lock hash
   */
  // console.log(lockHash)

  // method to fetch all unspent cells by lock hash
  const unspentCells = await ckb.loadCells({
    lockHash
  })

  /**
   * to see the unspent cells
   */
  // console.log(unspentCells)

  /**
   * send transaction
   */
  const toAddress = ckb.utils.privateKeyToAddress("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", {
    prefix: 'ckt'
  })

  const rawTransaction = ckb.generateRawTransaction({
    fromAddress: addresses.testnetAddress,
    toAddress,
    capacity: BigInt(600000000000),
    fee: BigInt(100000),
    safeMode: true,
    cells: unspentCells,
    deps: ckb.config.secp256k1Dep,
  })

  rawTransaction.witnesses = rawTransaction.inputs.map(() => '0x')
  rawTransaction.witnesses[0] = ckb.utils.serializeWitnessArgs({
    lock: '',
    inputType: '',
    outputType: ''
  })

  // fetch all the context transactions
  ctxds = (await Promise.all(rawTransaction.inputs.map(a=>ckb.rpc.getTransaction(a.previousOutput.txHash)))).map(a=>a.transaction)

  const formatted = formatter.toRawTransaction(rawTransaction)
  const formattedCtxd = ctxds.map(formatter.toRawTransaction)

  signature = await lckb.signTransaction("44'/309'/0'/0/0", formatted, formatted.witnesses, formattedCtxd, "44'/309'/0'/0/0")
  rawTransaction.witnesses[0] = ckb.utils.serializeWitnessArgs( { lock: "0x"+signature, inputType: '', outputType: '' });

  const realTxHash = await ckb.rpc.sendTransaction(rawTransaction).catch(err=>err)

  /**
   * to see the real transaction hash
   */
  console.log(`The real transaction hash is: ${realTxHash}`)
}

bootstrap()
