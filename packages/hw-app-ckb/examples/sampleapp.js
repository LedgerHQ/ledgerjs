let Transport = require("@ledgerhq/hw-transport-node-speculos").default;
let Ckb = require("@ledgerhq/hw-app-ckb").default;

apduPort = 9999;
tp=Transport.open( { apduPort } );

const getWalletId = async () => {
  const transport = await tp;
  const ckb = new Ckb(transport);
  /*
   * The wallet ID is a unique identifier for the particular ledger, derived
   * from the public key of 44'/309' on the ledger. The purpose of this opaque
   * identifier is to improve user experience by checking that they have the
   * correct ledger plugged in before attempting to sign for a given
   * transaction. We can't use the public key for this purpose as the ledger
   * protects access to the public key behind a set of prompts, to prevent
   * silent association of a particular key with a particular user from a
   * compromised client (that may even be a compromised webpage).  It is
   * important to remember that this feature is only for improving user
   * experience by detecting incorrect situations early; it is trivial to spoof
   * the ledger ID and this should never be used for any form of authentication
   * or security purposes, and only for detecting whether to prompt the user to
   * attach their ledger device or switch to the correct device.
   *
   * The expectation is that this ID and the third component of the bip32 path
   * form a unique identifier for a ledger-backed account, and an app will use
   * getExtendedPublicKey once to fetch the account's extended public key and
   * store the result.
   */
  const result = await ckb.getWalletId();
  return result;
};

const signTransaction = async () => {
  const transport = await tp;
  const ckb = new Ckb(transport);
	
  /* 
   * A large part of the security of the ledger devices is that they provide
   * enough UI on the device for the user to verify that what they are signing
   * is what they intended to sign even if the blockchain client in their
   * computer is compromised; in the context of Nervos CKB this means we need
   * significantly more information than just the transaction hash or even just
   * the transaction data itself.
   * The transaction can either be a hex string containing the bytes of the
   * RawTransaction part of the transaction we are signing, or as shown here,
   * it can be an object following the same format as the get_transaction and
   * send_transaction RPC calls, with the addition that the "0x" on may strings
   * is optional and that bytes and arrays of 2 or 4 bytes can be represented
   * as numbers, which will be written into the structure in little-endian
   * order.
   */
  const transaction = {
    "version": "0x0",
    "cell_deps": [
      {
        "out_point": {
          "tx_hash": "a563884b3686078ec7e7677a5f86449b15cf2693f3c1241766c6996f206cc541",
          "index": "0x2"
        },
        "dep_type": "code"
      },
      {
        "out_point": {
          "tx_hash": "ace5ea83c478bb866edf122ff862085789158f5cbff155b7bb5f13058555b708",
          "index": "0x0"
        },
        "dep_type": "dep_group"
      }
    ],
    "header_deps": [],
    "inputs": [
      {
        "since": "0000000000000000",
        "previous_output": {
          "tx_hash": "b1b547956a0dfb7ea618231563b3acd23607586e939f88e5a6db5f392b2e78d5",
          "index": "0x1"
        }
      },
      {
        "since": "0000000000000000",
        "previous_output": {
          "tx_hash": "258e82bab2af21fd8899fc872742f4acea831f5e4c232297816b9bf4a19597a9",
          "index": "0x0"
        }
      }
    ],
    "outputs": [
      {
        "capacity": "00e8764817000000",
        "lock": {
          "code_hash": "9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          "hash_type": "type",
          "args": "e5260d839a786ac2a909181df9a423f1efbe863d"
        },
        "type_": null
      },
      {
        "capacity": "e91c708e17000000",
        "lock": {
          "code_hash": "9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          "hash_type": "type",
          "args": "e5260d839a786ac2a909181df9a423f1efbe863d"
        },
        "type_": null
      }
    ],
    "outputs_data": [
      "",
      ""
    ]
  };
  /*
   * Because important information is not represented in the transaction
   * itself, in particular the capacity and type script of the input cells, we
   * also need to provide "context transactions", which are the full
   * RawTransaction that originated each input to the current transaction.
   * With these, we can provide the guarantee that either:
   *
   *  - the transactions exist on the blockchain and the transaction does what
   *    we say it does.
   *  - the transactions do _not_ exist (or the outputs have been spent) and
   *    the signature we provided is to a transaction that can not be applied
   *    on-chain.
   *
   * In particular, in neither case can the host have us unlock one cell but
   * prompt the user as if it is a different cell and thus lie about what the
   * signature they provide can do.
   * 
   * Given the predictability of transaction hashes, it is possible that the
   * inputs could become available at a later date, and this "signing a
   * hypothetical transaction" flow is both unavoidable given the constraints
   * of the ledger and acceptable as the user has still had an opportunity to
   * securely review the exact transaction sent before signing it.
   *
   * The unpacked format used here should match the result of the
   * get_transaction RPC, but interaction with a node is outside of the scope
   * of ledgerjs and in the hypothetical case they must come from some other
   * source. They may also be supplied as hex-encoded strings.
   */
  const contexts = [
    {
      "version": "0x0",
      "cell_deps": [
        {
          "out_point": {
            "tx_hash": "a563884b3686078ec7e7677a5f86449b15cf2693f3c1241766c6996f206cc541",
            "index": "0x2"
          },
          "dep_type": "code"
        },
        {
          "out_point": {
            "tx_hash": "ace5ea83c478bb866edf122ff862085789158f5cbff155b7bb5f13058555b708",
            "index": "0x0"
          },
          "dep_type": "dep_group"
        }
      ],
      "header_deps": [
        "327f1fc62c53530c6c27018f1e8cee27c35c0370c3b4d3376daf8fe110e7d8cb"
      ],
      "inputs": [
        {
          "since": "0000000000000000",
          "previous_output": {
            "tx_hash": "c399495011b912999dbc72cf54982924e328ae170654ef76c8aba190ca376307",
            "index": "0x0"
          }
        },
        {
          "since": "0000000000000000",
          "previous_output": {
            "tx_hash": "c317d0b0b2a513ab1206e6d454c1960de7d7b4b80d0748a3e1f9cb197b74b8a5",
            "index": "0x1"
          }
        }
      ],
      "outputs": [
        {
          "capacity": "00e8764817000000",
          "lock": {
            "code_hash": "9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
            "hash_type": "type",
            "args": "e5260d839a786ac2a909181df9a423f1efbe863d"
          },
          "type_": {
            "code_hash": "82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
            "hash_type": "type",
            "args": ""
          }
        },
        {
          "capacity": "64e5b27317000000",
          "lock": {
            "code_hash": "9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
            "hash_type": "type",
            "args": "e5260d839a786ac2a909181df9a423f1efbe863d"
          },
          "type_": null
        }
      ],
      "outputs_data": [
        "5207000000000000",
        ""
      ]
    },
    {
      "version": "0x0",
      "cell_deps": [
        {
          "out_point": {
            "tx_hash": "a563884b3686078ec7e7677a5f86449b15cf2693f3c1241766c6996f206cc541",
            "index": "0x2"
          },
          "dep_type": "code" 
        },
        {
          "out_point": {
            "tx_hash": "ace5ea83c478bb866edf122ff862085789158f5cbff155b7bb5f13058555b708",
            "index": "0x0"
          },
          "dep_type": "dep_group" 
        }
      ],
      "header_deps": [
        "327f1fc62c53530c6c27018f1e8cee27c35c0370c3b4d3376daf8fe110e7d8cb",
        "4930ba433e606a53f4f283f02dddeb6d51b0dc3e463629b14a27995de9c71eca"
      ],
      "inputs": [
        {
          "since": "ba08000000010020",
          "previous_output": {
            "tx_hash": "b1b547956a0dfb7ea618231563b3acd23607586e939f88e5a6db5f392b2e78d5",
            "index": "0x0"
          }
        }
      ],
      "outputs": [
        {
          "capacity": "c561436317000000",
          "lock": {
            "code_hash": "9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
            "hash_type": "type",
            "args": "e5260d839a786ac2a909181df9a423f1efbe863d"
          },
          "type_": null
        }
      ],
      "outputs_data": [
        ""
      ]
    }
  ];
  
  /* The ledger expects us to provide just the witnesses for the current input
   * group that we are signing, so we provide that separately and supply a raw
   * transaction to sign rather than a full transaction.
   */
  witnesses = [ ckb.defaultSighashWitness, "" ];

  /* The ledger does not perform any search for particular public keys or
   * public key hashes; we must provide the BIP32 path of the key to sign with.
   * */
  sign_path = "44'/309'/1/0";

  /* The ledger requires that we provide it with a change address by BIP32
   * path, so that it can verify that the user is retaining posession of the
   * funds in the change cell; this allows the ledger to elide that amount from
   * the prompts to the user. In this case, we are using the same address as sign_path */
  change_path = "44'/309'/1/0";

  /* The result is represented in hexadecimal notation. */
  const result = await ckb.signTransaction(sign_path, transaction, witnesses, contexts, change_path);
  return result;
}

const signMessage = async () => {
  const transport = await tp;
  const ckb = new Ckb(transport);
	
  sign_path = "44'/309'/1/0";

  /* The result is represented in hexadecimal notation. If the last argument is
   * true, show the literal hex; otherwise here we would show the string "hello
   * world" on the ledger, which is what this hex is interpreted as ASCII or
   * utf8.*/

  const result = await ckb.signMessage(sign_path, "48656c6c6f20776f726c64", false);

  return result;
};

const getVersion = async () => {
  const transport = await tp;
  const ckb = new Ckb(transport);
  const versionInfo = await ckb.getAppConfiguration();
  return versionInfo;
};

const getAddress = async () => {
  const transport = await tp;
  const ckb = new Ckb(transport);
  const result = await ckb.getWalletPublicKey("44'/309'/0'/1/0");
  return result;
};

const getPublicKey = async () => {
  const transport = await tp;
  const ckb = new Ckb(transport);
  const result = await ckb.getWalletPublicKey("44'/309'/0'/1/0");
  return result;
};

const getExtendedPublicKey = async () => {
  const transport = await tp;
  const ckb = new Ckb(transport);
  const result = await ckb.getWalletExtendedPublicKey("44'/309'/0'/1/0");
  return result;
};

const doAll = async () => {
    walletId = await getWalletId();
    console.log(walletId);
    version = await getVersion();
    console.log(version);
    publicKey = await getPublicKey();;
    console.log(publicKey);
    extendedPublicKey = await getExtendedPublicKey();;
    console.log(extendedPublicKey);
    signature = await signTransaction();
    console.log(signature);
    signature = await signMessage();
    console.log(signature);
    process.exit(0);
};

doAll().catch(err => console.log(err));
