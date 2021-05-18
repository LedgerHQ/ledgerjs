module.exports = {
  "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643": {
    "0xa0712d68": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e645d3a536e4d6dbd6114cc1ead35777bab948e3643a0712d68",
      "signature": "304402201d01e8ba9af5ca38da50ad21f5c75c51eada79ece415bc5a4312d0bbc7837df8022002202f22cedb7bb6e3ddabd4e3a8a95bf9a619fac769d459d2a61367f87b2bc2"
    },
    "0xdb006a75": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e645d3a536e4d6dbd6114cc1ead35777bab948e3643db006a75",
      "signature": "3045022100d344d8f641b9bdda6cd872e0d572c0c0beaa973fda19dc3e6e3c6e1c09d6947d02204ced2c978601e383da4c689c8010a8b422f241efe7b6b4d13dc01645dd4ae96f"
    },
    "0x852a12e3": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e645d3a536e4d6dbd6114cc1ead35777bab948e3643852a12e3",
      "signature": "3045022100815c65999cf9eb8e4842af02c79c0d5d577746ff290a6b9403e0da9d409a4d1a0220274110ccb0009e32284fb0d9b3d7778cc431b717bb0a3102891eed7644396bd3"
    },
    "abi": [
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "underlying_",
            "type": "address"
          },
          {
            "internalType": "contract ComptrollerInterface",
            "name": "comptroller_",
            "type": "address"
          },
          {
            "internalType": "contract InterestRateModel",
            "name": "interestRateModel_",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "initialExchangeRateMantissa_",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "name_",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "symbol_",
            "type": "string"
          },
          {
            "internalType": "uint8",
            "name": "decimals_",
            "type": "uint8"
          },
          {
            "internalType": "address payable",
            "name": "admin_",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "implementation_",
            "type": "address"
          },
          {
            "internalType": "bytes",
            "name": "becomeImplementationData",
            "type": "bytes"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "cashPrior",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "interestAccumulated",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "borrowIndex",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "AccrueInterest",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "spender",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "Approval",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "borrowAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "accountBorrows",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "Borrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "error",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "info",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "detail",
            "type": "uint256"
          }
        ],
        "name": "Failure",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "liquidator",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "cTokenCollateral",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "seizeTokens",
            "type": "uint256"
          }
        ],
        "name": "LiquidateBorrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "minter",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "mintAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "mintTokens",
            "type": "uint256"
          }
        ],
        "name": "Mint",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "oldAdmin",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "newAdmin",
            "type": "address"
          }
        ],
        "name": "NewAdmin",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "contract ComptrollerInterface",
            "name": "oldComptroller",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "contract ComptrollerInterface",
            "name": "newComptroller",
            "type": "address"
          }
        ],
        "name": "NewComptroller",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "oldImplementation",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "newImplementation",
            "type": "address"
          }
        ],
        "name": "NewImplementation",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "contract InterestRateModel",
            "name": "oldInterestRateModel",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "contract InterestRateModel",
            "name": "newInterestRateModel",
            "type": "address"
          }
        ],
        "name": "NewMarketInterestRateModel",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "oldPendingAdmin",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "newPendingAdmin",
            "type": "address"
          }
        ],
        "name": "NewPendingAdmin",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "oldReserveFactorMantissa",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "newReserveFactorMantissa",
            "type": "uint256"
          }
        ],
        "name": "NewReserveFactor",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "redeemer",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "redeemAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "redeemTokens",
            "type": "uint256"
          }
        ],
        "name": "Redeem",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "payer",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "accountBorrows",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "RepayBorrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "benefactor",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "addAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "newTotalReserves",
            "type": "uint256"
          }
        ],
        "name": "ReservesAdded",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "admin",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "reduceAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "newTotalReserves",
            "type": "uint256"
          }
        ],
        "name": "ReservesReduced",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "Transfer",
        "type": "event"
      },
      {
        "payable": true,
        "stateMutability": "payable",
        "type": "fallback"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "_acceptAdmin",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "uint256",
            "name": "addAmount",
            "type": "uint256"
          }
        ],
        "name": "_addReserves",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "uint256",
            "name": "reduceAmount",
            "type": "uint256"
          }
        ],
        "name": "_reduceReserves",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "contract ComptrollerInterface",
            "name": "newComptroller",
            "type": "address"
          }
        ],
        "name": "_setComptroller",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "implementation_",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "allowResign",
            "type": "bool"
          },
          {
            "internalType": "bytes",
            "name": "becomeImplementationData",
            "type": "bytes"
          }
        ],
        "name": "_setImplementation",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "contract InterestRateModel",
            "name": "newInterestRateModel",
            "type": "address"
          }
        ],
        "name": "_setInterestRateModel",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address payable",
            "name": "newPendingAdmin",
            "type": "address"
          }
        ],
        "name": "_setPendingAdmin",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "uint256",
            "name": "newReserveFactorMantissa",
            "type": "uint256"
          }
        ],
        "name": "_setReserveFactor",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "accrualBlockNumber",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "accrueInterest",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "admin",
        "outputs": [
          {
            "internalType": "address payable",
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "spender",
            "type": "address"
          }
        ],
        "name": "allowance",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "spender",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "approve",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "balanceOfUnderlying",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "uint256",
            "name": "borrowAmount",
            "type": "uint256"
          }
        ],
        "name": "borrow",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "borrowBalanceCurrent",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "borrowBalanceStored",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "borrowIndex",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "borrowRatePerBlock",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "comptroller",
        "outputs": [
          {
            "internalType": "contract ComptrollerInterface",
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
          {
            "internalType": "uint8",
            "name": "",
            "type": "uint8"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          }
        ],
        "name": "delegateToImplementation",
        "outputs": [
          {
            "internalType": "bytes",
            "name": "",
            "type": "bytes"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          }
        ],
        "name": "delegateToViewImplementation",
        "outputs": [
          {
            "internalType": "bytes",
            "name": "",
            "type": "bytes"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "exchangeRateCurrent",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "exchangeRateStored",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "getAccountSnapshot",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getCash",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "implementation",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "interestRateModel",
        "outputs": [
          {
            "internalType": "contract InterestRateModel",
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "isCToken",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "borrower",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "internalType": "contract CTokenInterface",
            "name": "cTokenCollateral",
            "type": "address"
          }
        ],
        "name": "liquidateBorrow",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "uint256",
            "name": "mintAmount",
            "type": "uint256"
          }
        ],
        "name": "mint",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "pendingAdmin",
        "outputs": [
          {
            "internalType": "address payable",
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "uint256",
            "name": "redeemTokens",
            "type": "uint256"
          }
        ],
        "name": "redeem",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "uint256",
            "name": "redeemAmount",
            "type": "uint256"
          }
        ],
        "name": "redeemUnderlying",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "uint256",
            "name": "repayAmount",
            "type": "uint256"
          }
        ],
        "name": "repayBorrow",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "borrower",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "repayAmount",
            "type": "uint256"
          }
        ],
        "name": "repayBorrowBehalf",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "reserveFactorMantissa",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "liquidator",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "borrower",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "seizeTokens",
            "type": "uint256"
          }
        ],
        "name": "seize",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "supplyRatePerBlock",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalBorrows",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "totalBorrowsCurrent",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalReserves",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "dst",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "transfer",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "src",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "dst",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "transferFrom",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "underlying",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      }
    ]
  },
  "0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5": {
    "0x1249c58b": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e644ddc2d193948926d02f9b1fe9e1daa0718270ed51249c58b",
      "signature": "3044022016dce2a1cf10e6635f1beeb5003a8d0cc3766fc17be88ecc44031187a0488c9b022043de1c6ae0f700a08dd2f1f5cbdb379acb89b83d3375d973516a0babb1e0c409"
    },
    "0xdb006a75": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e644ddc2d193948926d02f9b1fe9e1daa0718270ed5db006a75",
      "signature": "3045022100a1326e502b21790d466403b17fd41f35bf6e85587339cc51e4b0217e4e30b28b022040442d2b68fd5dd71735ee9a0fc5b834275314cbb7df3da8501d97b5764a35ce"
    },
    "0x852a12e3": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e644ddc2d193948926d02f9b1fe9e1daa0718270ed5852a12e3",
      "signature": "3044022007c52cd0b6baa6fe8d60fd62c4aa230daac5d4a7ef738d9c28fefaec981baf3c022023f49e213360273bde3abdcbc06c26e080d8fddc06477470473cf044e18ffb45"
    },
    "abi": [
      {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "spender",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "approve",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "mint",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "reserveFactorMantissa",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "account",
            "type": "address"
          }
        ],
        "name": "borrowBalanceCurrent",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "exchangeRateStored",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "src",
            "type": "address"
          },
          {
            "name": "dst",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "transferFrom",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "pendingAdmin",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "balanceOfUnderlying",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getCash",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newComptroller",
            "type": "address"
          }
        ],
        "name": "_setComptroller",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalBorrows",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "repayBorrow",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "comptroller",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "reduceAmount",
            "type": "uint256"
          }
        ],
        "name": "_reduceReserves",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "initialExchangeRateMantissa",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "accrualBlockNumber",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "totalBorrowsCurrent",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "redeemAmount",
            "type": "uint256"
          }
        ],
        "name": "redeemUnderlying",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalReserves",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "account",
            "type": "address"
          }
        ],
        "name": "borrowBalanceStored",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "accrueInterest",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "dst",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "transfer",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "borrowIndex",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "borrower",
            "type": "address"
          },
          {
            "name": "cTokenCollateral",
            "type": "address"
          }
        ],
        "name": "liquidateBorrow",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "supplyRatePerBlock",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "liquidator",
            "type": "address"
          },
          {
            "name": "borrower",
            "type": "address"
          },
          {
            "name": "seizeTokens",
            "type": "uint256"
          }
        ],
        "name": "seize",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newPendingAdmin",
            "type": "address"
          }
        ],
        "name": "_setPendingAdmin",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "exchangeRateCurrent",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "account",
            "type": "address"
          }
        ],
        "name": "getAccountSnapshot",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "borrowAmount",
            "type": "uint256"
          }
        ],
        "name": "borrow",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "redeemTokens",
            "type": "uint256"
          }
        ],
        "name": "redeem",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "owner",
            "type": "address"
          },
          {
            "name": "spender",
            "type": "address"
          }
        ],
        "name": "allowance",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "borrower",
            "type": "address"
          }
        ],
        "name": "repayBorrowBehalf",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "_acceptAdmin",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newInterestRateModel",
            "type": "address"
          }
        ],
        "name": "_setInterestRateModel",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "interestRateModel",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "admin",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "borrowRatePerBlock",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newReserveFactorMantissa",
            "type": "uint256"
          }
        ],
        "name": "_setReserveFactor",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "isCToken",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "comptroller_",
            "type": "address"
          },
          {
            "name": "interestRateModel_",
            "type": "address"
          },
          {
            "name": "initialExchangeRateMantissa_",
            "type": "uint256"
          },
          {
            "name": "name_",
            "type": "string"
          },
          {
            "name": "symbol_",
            "type": "string"
          },
          {
            "name": "decimals_",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "payable": true,
        "stateMutability": "payable",
        "type": "fallback"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "interestAccumulated",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "borrowIndex",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "AccrueInterest",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "minter",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "mintAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "mintTokens",
            "type": "uint256"
          }
        ],
        "name": "Mint",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "redeemer",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "redeemAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "redeemTokens",
            "type": "uint256"
          }
        ],
        "name": "Redeem",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "borrowAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "accountBorrows",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "Borrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "payer",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "accountBorrows",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "RepayBorrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "liquidator",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "cTokenCollateral",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "seizeTokens",
            "type": "uint256"
          }
        ],
        "name": "LiquidateBorrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldPendingAdmin",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newPendingAdmin",
            "type": "address"
          }
        ],
        "name": "NewPendingAdmin",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldAdmin",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newAdmin",
            "type": "address"
          }
        ],
        "name": "NewAdmin",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldComptroller",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newComptroller",
            "type": "address"
          }
        ],
        "name": "NewComptroller",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldInterestRateModel",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newInterestRateModel",
            "type": "address"
          }
        ],
        "name": "NewMarketInterestRateModel",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldReserveFactorMantissa",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "newReserveFactorMantissa",
            "type": "uint256"
          }
        ],
        "name": "NewReserveFactor",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "admin",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "reduceAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "newTotalReserves",
            "type": "uint256"
          }
        ],
        "name": "ReservesReduced",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "error",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "info",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "detail",
            "type": "uint256"
          }
        ],
        "name": "Failure",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "Transfer",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "spender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "Approval",
        "type": "event"
      }
    ]
  },
  "0x39aa39c021dfbae8fac545936693ac917d5e7563": {
    "0xa0712d68": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e6439aa39c021dfbae8fac545936693ac917d5e7563a0712d68",
      "signature": "3045022100e2e5b47f874dc73a69f4c173e3a42bc465c7676fd5cd7418ccaaac1e9354f97002206737751faa640e99f9948ba1d49559e6d4c5b27706051d0fe43b23df3f34eb79"
    },
    "0xdb006a75": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e6439aa39c021dfbae8fac545936693ac917d5e7563db006a75",
      "signature": "304402203c9fe6a607de137c9b79afe596e5a35460b750ed126e6c55b48694d87f48467202207434bb00fb10b63d1dd0ff72eb731bf90f4a7613b49952b37707b091cfa5d1d6"
    },
    "0x852a12e3": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e6439aa39c021dfbae8fac545936693ac917d5e7563852a12e3",
      "signature": "304402207c0189dcc3f7a3510092a17ec2f1c3a185b2bbff507d0f3d8a50bc3d23fb025402202f3aad577ebef6382f54f3ed90056c1de0197746540ab454d42f8f36bb0651e7"
    },
    "abi": [
      {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "spender",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "approve",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "repayAmount",
            "type": "uint256"
          }
        ],
        "name": "repayBorrow",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "reserveFactorMantissa",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "account",
            "type": "address"
          }
        ],
        "name": "borrowBalanceCurrent",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "exchangeRateStored",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "src",
            "type": "address"
          },
          {
            "name": "dst",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "transferFrom",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "borrower",
            "type": "address"
          },
          {
            "name": "repayAmount",
            "type": "uint256"
          }
        ],
        "name": "repayBorrowBehalf",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "pendingAdmin",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "balanceOfUnderlying",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getCash",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newComptroller",
            "type": "address"
          }
        ],
        "name": "_setComptroller",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalBorrows",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "comptroller",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "reduceAmount",
            "type": "uint256"
          }
        ],
        "name": "_reduceReserves",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "initialExchangeRateMantissa",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "accrualBlockNumber",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "underlying",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "totalBorrowsCurrent",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "redeemAmount",
            "type": "uint256"
          }
        ],
        "name": "redeemUnderlying",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalReserves",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "account",
            "type": "address"
          }
        ],
        "name": "borrowBalanceStored",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "mintAmount",
            "type": "uint256"
          }
        ],
        "name": "mint",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "accrueInterest",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "dst",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "transfer",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "borrowIndex",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "supplyRatePerBlock",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "liquidator",
            "type": "address"
          },
          {
            "name": "borrower",
            "type": "address"
          },
          {
            "name": "seizeTokens",
            "type": "uint256"
          }
        ],
        "name": "seize",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newPendingAdmin",
            "type": "address"
          }
        ],
        "name": "_setPendingAdmin",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "exchangeRateCurrent",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "account",
            "type": "address"
          }
        ],
        "name": "getAccountSnapshot",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "borrowAmount",
            "type": "uint256"
          }
        ],
        "name": "borrow",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "redeemTokens",
            "type": "uint256"
          }
        ],
        "name": "redeem",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "owner",
            "type": "address"
          },
          {
            "name": "spender",
            "type": "address"
          }
        ],
        "name": "allowance",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "_acceptAdmin",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newInterestRateModel",
            "type": "address"
          }
        ],
        "name": "_setInterestRateModel",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "interestRateModel",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "borrower",
            "type": "address"
          },
          {
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "name": "cTokenCollateral",
            "type": "address"
          }
        ],
        "name": "liquidateBorrow",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "admin",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "borrowRatePerBlock",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newReserveFactorMantissa",
            "type": "uint256"
          }
        ],
        "name": "_setReserveFactor",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "isCToken",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "underlying_",
            "type": "address"
          },
          {
            "name": "comptroller_",
            "type": "address"
          },
          {
            "name": "interestRateModel_",
            "type": "address"
          },
          {
            "name": "initialExchangeRateMantissa_",
            "type": "uint256"
          },
          {
            "name": "name_",
            "type": "string"
          },
          {
            "name": "symbol_",
            "type": "string"
          },
          {
            "name": "decimals_",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "interestAccumulated",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "borrowIndex",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "AccrueInterest",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "minter",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "mintAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "mintTokens",
            "type": "uint256"
          }
        ],
        "name": "Mint",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "redeemer",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "redeemAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "redeemTokens",
            "type": "uint256"
          }
        ],
        "name": "Redeem",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "borrowAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "accountBorrows",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "Borrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "payer",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "accountBorrows",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "RepayBorrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "liquidator",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "cTokenCollateral",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "seizeTokens",
            "type": "uint256"
          }
        ],
        "name": "LiquidateBorrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldPendingAdmin",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newPendingAdmin",
            "type": "address"
          }
        ],
        "name": "NewPendingAdmin",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldAdmin",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newAdmin",
            "type": "address"
          }
        ],
        "name": "NewAdmin",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldComptroller",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newComptroller",
            "type": "address"
          }
        ],
        "name": "NewComptroller",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldInterestRateModel",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newInterestRateModel",
            "type": "address"
          }
        ],
        "name": "NewMarketInterestRateModel",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldReserveFactorMantissa",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "newReserveFactorMantissa",
            "type": "uint256"
          }
        ],
        "name": "NewReserveFactor",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "admin",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "reduceAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "newTotalReserves",
            "type": "uint256"
          }
        ],
        "name": "ReservesReduced",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "error",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "info",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "detail",
            "type": "uint256"
          }
        ],
        "name": "Failure",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "Transfer",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "spender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "Approval",
        "type": "event"
      }
    ]
  },
  "0xb3319f5d18bc0d84dd1b4825dcde5d5f7266d407": {
    "0xa0712d68": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e64b3319f5d18bc0d84dd1b4825dcde5d5f7266d407a0712d68",
      "signature": "30440220247499df8557d212c609105b19248f2103b6dce5e475724f0f1370a61bf5162002202f6af6c2e45a78cb0acf0b8fb37d57b6860b0d003e3bcfe6f6acfecddd4e2754"
    },
    "0xdb006a75": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e64b3319f5d18bc0d84dd1b4825dcde5d5f7266d407db006a75",
      "signature": "30450221009e609aa1e1915ae93416dca68290b6a06b674ed4d936dbe6d90311512b345518022012eb1b2654614cad7d40b3bdbaad48eb17b83b8f25cfeac46f541ee6b5f34578"
    },
    "0x852a12e3": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e64b3319f5d18bc0d84dd1b4825dcde5d5f7266d407852a12e3",
      "signature": "30440220161ffc6594f0aa89136d1909aa2782cc85fc50b5ce128e6d63564dd6723db87f02202c1bac84674495815b14f14e52a5f933bb8374193ecf625e8720e957722686f1"
    },
    "abi": [
      {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "spender",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "approve",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "repayAmount",
            "type": "uint256"
          }
        ],
        "name": "repayBorrow",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "reserveFactorMantissa",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "account",
            "type": "address"
          }
        ],
        "name": "borrowBalanceCurrent",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "exchangeRateStored",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "src",
            "type": "address"
          },
          {
            "name": "dst",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "transferFrom",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "borrower",
            "type": "address"
          },
          {
            "name": "repayAmount",
            "type": "uint256"
          }
        ],
        "name": "repayBorrowBehalf",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "pendingAdmin",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "balanceOfUnderlying",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getCash",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newComptroller",
            "type": "address"
          }
        ],
        "name": "_setComptroller",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalBorrows",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "comptroller",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "reduceAmount",
            "type": "uint256"
          }
        ],
        "name": "_reduceReserves",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "initialExchangeRateMantissa",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "accrualBlockNumber",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "underlying",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "totalBorrowsCurrent",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "redeemAmount",
            "type": "uint256"
          }
        ],
        "name": "redeemUnderlying",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalReserves",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "account",
            "type": "address"
          }
        ],
        "name": "borrowBalanceStored",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "mintAmount",
            "type": "uint256"
          }
        ],
        "name": "mint",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "accrueInterest",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "dst",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "transfer",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "borrowIndex",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "supplyRatePerBlock",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "liquidator",
            "type": "address"
          },
          {
            "name": "borrower",
            "type": "address"
          },
          {
            "name": "seizeTokens",
            "type": "uint256"
          }
        ],
        "name": "seize",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newPendingAdmin",
            "type": "address"
          }
        ],
        "name": "_setPendingAdmin",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "exchangeRateCurrent",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "account",
            "type": "address"
          }
        ],
        "name": "getAccountSnapshot",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "borrowAmount",
            "type": "uint256"
          }
        ],
        "name": "borrow",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "redeemTokens",
            "type": "uint256"
          }
        ],
        "name": "redeem",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "owner",
            "type": "address"
          },
          {
            "name": "spender",
            "type": "address"
          }
        ],
        "name": "allowance",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "_acceptAdmin",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newInterestRateModel",
            "type": "address"
          }
        ],
        "name": "_setInterestRateModel",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "interestRateModel",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "borrower",
            "type": "address"
          },
          {
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "name": "cTokenCollateral",
            "type": "address"
          }
        ],
        "name": "liquidateBorrow",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "admin",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "borrowRatePerBlock",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newReserveFactorMantissa",
            "type": "uint256"
          }
        ],
        "name": "_setReserveFactor",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "isCToken",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "underlying_",
            "type": "address"
          },
          {
            "name": "comptroller_",
            "type": "address"
          },
          {
            "name": "interestRateModel_",
            "type": "address"
          },
          {
            "name": "initialExchangeRateMantissa_",
            "type": "uint256"
          },
          {
            "name": "name_",
            "type": "string"
          },
          {
            "name": "symbol_",
            "type": "string"
          },
          {
            "name": "decimals_",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "interestAccumulated",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "borrowIndex",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "AccrueInterest",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "minter",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "mintAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "mintTokens",
            "type": "uint256"
          }
        ],
        "name": "Mint",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "redeemer",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "redeemAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "redeemTokens",
            "type": "uint256"
          }
        ],
        "name": "Redeem",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "borrowAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "accountBorrows",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "Borrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "payer",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "accountBorrows",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "RepayBorrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "liquidator",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "cTokenCollateral",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "seizeTokens",
            "type": "uint256"
          }
        ],
        "name": "LiquidateBorrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldPendingAdmin",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newPendingAdmin",
            "type": "address"
          }
        ],
        "name": "NewPendingAdmin",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldAdmin",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newAdmin",
            "type": "address"
          }
        ],
        "name": "NewAdmin",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldComptroller",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newComptroller",
            "type": "address"
          }
        ],
        "name": "NewComptroller",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldInterestRateModel",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newInterestRateModel",
            "type": "address"
          }
        ],
        "name": "NewMarketInterestRateModel",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldReserveFactorMantissa",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "newReserveFactorMantissa",
            "type": "uint256"
          }
        ],
        "name": "NewReserveFactor",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "admin",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "reduceAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "newTotalReserves",
            "type": "uint256"
          }
        ],
        "name": "ReservesReduced",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "error",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "info",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "detail",
            "type": "uint256"
          }
        ],
        "name": "Failure",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "Transfer",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "spender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "Approval",
        "type": "event"
      }
    ]
  },
  "0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9": {
    "0xa0712d68": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e64f650c3d88d12db855b8bf7d11be6c55a4e07dcc9a0712d68",
      "signature": "3045022100e21e9d85453761784eadc85636a962f6777128911f2d385fb75b43f6f2f0d254022016f05d0fb9a068f4b4371b869a9ee708c47d8ce568d272223277fabf7c6ef6ee"
    },
    "0xdb006a75": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e64f650c3d88d12db855b8bf7d11be6c55a4e07dcc9db006a75",
      "signature": "3045022100b22b83ce4bf9c64c610b16ae2290e099254e8830aafdbd62cc28a42acf5c9acd0220474ba67ab2ef6d4cb8e1f7dd5ac9f2d77cf98b9723caa14f7cbb3ace7dcd22c0"
    },
    "0x852a12e3": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e64f650c3d88d12db855b8bf7d11be6c55a4e07dcc9852a12e3",
      "signature": "3045022100d386d7ef9f7f3d1a95953045c9e8927b6b474b1c9da811ea423c936ffb88bce4022074deb4f8f8afa595478c04dde495c00f1414dae245720164c4e1b4e647687af9"
    },
    "abi": [
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "underlying_",
            "type": "address"
          },
          {
            "internalType": "contract ComptrollerInterface",
            "name": "comptroller_",
            "type": "address"
          },
          {
            "internalType": "contract InterestRateModel",
            "name": "interestRateModel_",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "initialExchangeRateMantissa_",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "name_",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "symbol_",
            "type": "string"
          },
          {
            "internalType": "uint8",
            "name": "decimals_",
            "type": "uint8"
          },
          {
            "internalType": "address payable",
            "name": "admin_",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "implementation_",
            "type": "address"
          },
          {
            "internalType": "bytes",
            "name": "becomeImplementationData",
            "type": "bytes"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "cashPrior",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "interestAccumulated",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "borrowIndex",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "AccrueInterest",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "spender",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "Approval",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "borrowAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "accountBorrows",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "Borrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "error",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "info",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "detail",
            "type": "uint256"
          }
        ],
        "name": "Failure",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "liquidator",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "cTokenCollateral",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "seizeTokens",
            "type": "uint256"
          }
        ],
        "name": "LiquidateBorrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "minter",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "mintAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "mintTokens",
            "type": "uint256"
          }
        ],
        "name": "Mint",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "oldAdmin",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "newAdmin",
            "type": "address"
          }
        ],
        "name": "NewAdmin",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "contract ComptrollerInterface",
            "name": "oldComptroller",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "contract ComptrollerInterface",
            "name": "newComptroller",
            "type": "address"
          }
        ],
        "name": "NewComptroller",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "oldImplementation",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "newImplementation",
            "type": "address"
          }
        ],
        "name": "NewImplementation",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "contract InterestRateModel",
            "name": "oldInterestRateModel",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "contract InterestRateModel",
            "name": "newInterestRateModel",
            "type": "address"
          }
        ],
        "name": "NewMarketInterestRateModel",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "oldPendingAdmin",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "newPendingAdmin",
            "type": "address"
          }
        ],
        "name": "NewPendingAdmin",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "oldReserveFactorMantissa",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "newReserveFactorMantissa",
            "type": "uint256"
          }
        ],
        "name": "NewReserveFactor",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "redeemer",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "redeemAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "redeemTokens",
            "type": "uint256"
          }
        ],
        "name": "Redeem",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "payer",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "accountBorrows",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "RepayBorrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "benefactor",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "addAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "newTotalReserves",
            "type": "uint256"
          }
        ],
        "name": "ReservesAdded",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "admin",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "reduceAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "newTotalReserves",
            "type": "uint256"
          }
        ],
        "name": "ReservesReduced",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "Transfer",
        "type": "event"
      },
      {
        "payable": true,
        "stateMutability": "payable",
        "type": "fallback"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "_acceptAdmin",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "uint256",
            "name": "addAmount",
            "type": "uint256"
          }
        ],
        "name": "_addReserves",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "uint256",
            "name": "reduceAmount",
            "type": "uint256"
          }
        ],
        "name": "_reduceReserves",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "contract ComptrollerInterface",
            "name": "newComptroller",
            "type": "address"
          }
        ],
        "name": "_setComptroller",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "implementation_",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "allowResign",
            "type": "bool"
          },
          {
            "internalType": "bytes",
            "name": "becomeImplementationData",
            "type": "bytes"
          }
        ],
        "name": "_setImplementation",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "contract InterestRateModel",
            "name": "newInterestRateModel",
            "type": "address"
          }
        ],
        "name": "_setInterestRateModel",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address payable",
            "name": "newPendingAdmin",
            "type": "address"
          }
        ],
        "name": "_setPendingAdmin",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "uint256",
            "name": "newReserveFactorMantissa",
            "type": "uint256"
          }
        ],
        "name": "_setReserveFactor",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "accrualBlockNumber",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "accrueInterest",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "admin",
        "outputs": [
          {
            "internalType": "address payable",
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "spender",
            "type": "address"
          }
        ],
        "name": "allowance",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "spender",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "approve",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "balanceOfUnderlying",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "uint256",
            "name": "borrowAmount",
            "type": "uint256"
          }
        ],
        "name": "borrow",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "borrowBalanceCurrent",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "borrowBalanceStored",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "borrowIndex",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "borrowRatePerBlock",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "comptroller",
        "outputs": [
          {
            "internalType": "contract ComptrollerInterface",
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
          {
            "internalType": "uint8",
            "name": "",
            "type": "uint8"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          }
        ],
        "name": "delegateToImplementation",
        "outputs": [
          {
            "internalType": "bytes",
            "name": "",
            "type": "bytes"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          }
        ],
        "name": "delegateToViewImplementation",
        "outputs": [
          {
            "internalType": "bytes",
            "name": "",
            "type": "bytes"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "exchangeRateCurrent",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "exchangeRateStored",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "getAccountSnapshot",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getCash",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "implementation",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "interestRateModel",
        "outputs": [
          {
            "internalType": "contract InterestRateModel",
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "isCToken",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "borrower",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "internalType": "contract CTokenInterface",
            "name": "cTokenCollateral",
            "type": "address"
          }
        ],
        "name": "liquidateBorrow",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "uint256",
            "name": "mintAmount",
            "type": "uint256"
          }
        ],
        "name": "mint",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "pendingAdmin",
        "outputs": [
          {
            "internalType": "address payable",
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "uint256",
            "name": "redeemTokens",
            "type": "uint256"
          }
        ],
        "name": "redeem",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "uint256",
            "name": "redeemAmount",
            "type": "uint256"
          }
        ],
        "name": "redeemUnderlying",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "uint256",
            "name": "repayAmount",
            "type": "uint256"
          }
        ],
        "name": "repayBorrow",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "borrower",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "repayAmount",
            "type": "uint256"
          }
        ],
        "name": "repayBorrowBehalf",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "reserveFactorMantissa",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "liquidator",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "borrower",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "seizeTokens",
            "type": "uint256"
          }
        ],
        "name": "seize",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "supplyRatePerBlock",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalBorrows",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "totalBorrowsCurrent",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalReserves",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "dst",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "transfer",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "src",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "dst",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "transferFrom",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "underlying",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      }
    ]
  },
  "0xc11b1268c1a384e55c48c2391d8d480264a3a7f4": {
    "0xa0712d68": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e64c11b1268c1a384e55c48c2391d8d480264a3a7f4a0712d68",
      "signature": "3045022100e2968945511f181185bb9c38f0e3d5a30d77f65efcc337a29ed7efdf0fef515d02205996e738fb665163e223977e1d63b5f3a4db12b47e5fd6b32c6cfad5fe750c33"
    },
    "0xdb006a75": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e64c11b1268c1a384e55c48c2391d8d480264a3a7f4db006a75",
      "signature": "3045022100955599c6dcb1bebb60052ca2d8f4c09950bd084b5f55efa1cca6df6a2f2f33b102200f9607465ada40b3cbd9aee2ff0ff7a5bd9a8bcede8c527f7c91bf9b936b0ffa"
    },
    "0x852a12e3": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e64c11b1268c1a384e55c48c2391d8d480264a3a7f4852a12e3",
      "signature": "3045022100d397ac236631a1d7d1c7c71a591e0e78c8bc5fbdc8945f002a4eae2f18314d8602203df6b5ba296ded323f9599c7ab8675c6bbc09f3c070bd8b044c41252eba7ff12"
    },
    "abi": [
      {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "spender",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "approve",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "repayAmount",
            "type": "uint256"
          }
        ],
        "name": "repayBorrow",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "reserveFactorMantissa",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "account",
            "type": "address"
          }
        ],
        "name": "borrowBalanceCurrent",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "exchangeRateStored",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "src",
            "type": "address"
          },
          {
            "name": "dst",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "transferFrom",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "borrower",
            "type": "address"
          },
          {
            "name": "repayAmount",
            "type": "uint256"
          }
        ],
        "name": "repayBorrowBehalf",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "pendingAdmin",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "balanceOfUnderlying",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getCash",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newComptroller",
            "type": "address"
          }
        ],
        "name": "_setComptroller",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalBorrows",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "comptroller",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "reduceAmount",
            "type": "uint256"
          }
        ],
        "name": "_reduceReserves",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "initialExchangeRateMantissa",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "accrualBlockNumber",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "underlying",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "totalBorrowsCurrent",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "redeemAmount",
            "type": "uint256"
          }
        ],
        "name": "redeemUnderlying",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalReserves",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "account",
            "type": "address"
          }
        ],
        "name": "borrowBalanceStored",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "mintAmount",
            "type": "uint256"
          }
        ],
        "name": "mint",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "accrueInterest",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "dst",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "transfer",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "borrowIndex",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "supplyRatePerBlock",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "liquidator",
            "type": "address"
          },
          {
            "name": "borrower",
            "type": "address"
          },
          {
            "name": "seizeTokens",
            "type": "uint256"
          }
        ],
        "name": "seize",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newPendingAdmin",
            "type": "address"
          }
        ],
        "name": "_setPendingAdmin",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "exchangeRateCurrent",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "account",
            "type": "address"
          }
        ],
        "name": "getAccountSnapshot",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "borrowAmount",
            "type": "uint256"
          }
        ],
        "name": "borrow",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "redeemTokens",
            "type": "uint256"
          }
        ],
        "name": "redeem",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "owner",
            "type": "address"
          },
          {
            "name": "spender",
            "type": "address"
          }
        ],
        "name": "allowance",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "_acceptAdmin",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newInterestRateModel",
            "type": "address"
          }
        ],
        "name": "_setInterestRateModel",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "interestRateModel",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "borrower",
            "type": "address"
          },
          {
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "name": "cTokenCollateral",
            "type": "address"
          }
        ],
        "name": "liquidateBorrow",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "admin",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "borrowRatePerBlock",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newReserveFactorMantissa",
            "type": "uint256"
          }
        ],
        "name": "_setReserveFactor",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "isCToken",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "underlying_",
            "type": "address"
          },
          {
            "name": "comptroller_",
            "type": "address"
          },
          {
            "name": "interestRateModel_",
            "type": "address"
          },
          {
            "name": "initialExchangeRateMantissa_",
            "type": "uint256"
          },
          {
            "name": "name_",
            "type": "string"
          },
          {
            "name": "symbol_",
            "type": "string"
          },
          {
            "name": "decimals_",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "interestAccumulated",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "borrowIndex",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "AccrueInterest",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "minter",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "mintAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "mintTokens",
            "type": "uint256"
          }
        ],
        "name": "Mint",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "redeemer",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "redeemAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "redeemTokens",
            "type": "uint256"
          }
        ],
        "name": "Redeem",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "borrowAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "accountBorrows",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "Borrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "payer",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "accountBorrows",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "RepayBorrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "liquidator",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "cTokenCollateral",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "seizeTokens",
            "type": "uint256"
          }
        ],
        "name": "LiquidateBorrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldPendingAdmin",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newPendingAdmin",
            "type": "address"
          }
        ],
        "name": "NewPendingAdmin",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldAdmin",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newAdmin",
            "type": "address"
          }
        ],
        "name": "NewAdmin",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldComptroller",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newComptroller",
            "type": "address"
          }
        ],
        "name": "NewComptroller",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldInterestRateModel",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newInterestRateModel",
            "type": "address"
          }
        ],
        "name": "NewMarketInterestRateModel",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldReserveFactorMantissa",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "newReserveFactorMantissa",
            "type": "uint256"
          }
        ],
        "name": "NewReserveFactor",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "admin",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "reduceAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "newTotalReserves",
            "type": "uint256"
          }
        ],
        "name": "ReservesReduced",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "error",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "info",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "detail",
            "type": "uint256"
          }
        ],
        "name": "Failure",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "Transfer",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "spender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "Approval",
        "type": "event"
      }
    ]
  },
  "0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e": {
    "0xa0712d68": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e646c8c6b02e7b2be14d4fa6022dfd6d75921d90e4ea0712d68",
      "signature": "3045022100bf70202f316255a51e8f3219d8801f855cae5ef90d4d35104ea3649b07f2f4bb022007853c4b24c1faf34272914ee2d579f7c33df35cd47faac20146207d797a859b"
    },
    "0xdb006a75": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e646c8c6b02e7b2be14d4fa6022dfd6d75921d90e4edb006a75",
      "signature": "3045022100a5a1cf15ec44c687d80a7404133263b058985b4982c9c61210680508cec04e1f02202a4b10fed7e5e48cddeeffef3c506a0729fe62cf44359f7c720340f5e16a470b"
    },
    "0x852a12e3": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e646c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e852a12e3",
      "signature": "304402203a62daf293f498c06102dc322eb1f2be9aad9ee09da5647983e73ebd8542afd9022040bc7dc7a703663650b9ac9afe98f02755f5209cd633795331ec5cc51e023657"
    },
    "abi": [
      {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "spender",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "approve",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "repayAmount",
            "type": "uint256"
          }
        ],
        "name": "repayBorrow",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "reserveFactorMantissa",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "account",
            "type": "address"
          }
        ],
        "name": "borrowBalanceCurrent",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "exchangeRateStored",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "src",
            "type": "address"
          },
          {
            "name": "dst",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "transferFrom",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "borrower",
            "type": "address"
          },
          {
            "name": "repayAmount",
            "type": "uint256"
          }
        ],
        "name": "repayBorrowBehalf",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "pendingAdmin",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "balanceOfUnderlying",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getCash",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newComptroller",
            "type": "address"
          }
        ],
        "name": "_setComptroller",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalBorrows",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "comptroller",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "reduceAmount",
            "type": "uint256"
          }
        ],
        "name": "_reduceReserves",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "initialExchangeRateMantissa",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "accrualBlockNumber",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "underlying",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "totalBorrowsCurrent",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "redeemAmount",
            "type": "uint256"
          }
        ],
        "name": "redeemUnderlying",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalReserves",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "account",
            "type": "address"
          }
        ],
        "name": "borrowBalanceStored",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "mintAmount",
            "type": "uint256"
          }
        ],
        "name": "mint",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "accrueInterest",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "dst",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "transfer",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "borrowIndex",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "supplyRatePerBlock",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "liquidator",
            "type": "address"
          },
          {
            "name": "borrower",
            "type": "address"
          },
          {
            "name": "seizeTokens",
            "type": "uint256"
          }
        ],
        "name": "seize",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newPendingAdmin",
            "type": "address"
          }
        ],
        "name": "_setPendingAdmin",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "exchangeRateCurrent",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "account",
            "type": "address"
          }
        ],
        "name": "getAccountSnapshot",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "borrowAmount",
            "type": "uint256"
          }
        ],
        "name": "borrow",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "redeemTokens",
            "type": "uint256"
          }
        ],
        "name": "redeem",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "owner",
            "type": "address"
          },
          {
            "name": "spender",
            "type": "address"
          }
        ],
        "name": "allowance",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "_acceptAdmin",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newInterestRateModel",
            "type": "address"
          }
        ],
        "name": "_setInterestRateModel",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "interestRateModel",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "borrower",
            "type": "address"
          },
          {
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "name": "cTokenCollateral",
            "type": "address"
          }
        ],
        "name": "liquidateBorrow",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "admin",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "borrowRatePerBlock",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newReserveFactorMantissa",
            "type": "uint256"
          }
        ],
        "name": "_setReserveFactor",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "isCToken",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "underlying_",
            "type": "address"
          },
          {
            "name": "comptroller_",
            "type": "address"
          },
          {
            "name": "interestRateModel_",
            "type": "address"
          },
          {
            "name": "initialExchangeRateMantissa_",
            "type": "uint256"
          },
          {
            "name": "name_",
            "type": "string"
          },
          {
            "name": "symbol_",
            "type": "string"
          },
          {
            "name": "decimals_",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "interestAccumulated",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "borrowIndex",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "AccrueInterest",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "minter",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "mintAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "mintTokens",
            "type": "uint256"
          }
        ],
        "name": "Mint",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "redeemer",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "redeemAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "redeemTokens",
            "type": "uint256"
          }
        ],
        "name": "Redeem",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "borrowAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "accountBorrows",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "Borrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "payer",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "accountBorrows",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "RepayBorrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "liquidator",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "cTokenCollateral",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "seizeTokens",
            "type": "uint256"
          }
        ],
        "name": "LiquidateBorrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldPendingAdmin",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newPendingAdmin",
            "type": "address"
          }
        ],
        "name": "NewPendingAdmin",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldAdmin",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newAdmin",
            "type": "address"
          }
        ],
        "name": "NewAdmin",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldComptroller",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newComptroller",
            "type": "address"
          }
        ],
        "name": "NewComptroller",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldInterestRateModel",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newInterestRateModel",
            "type": "address"
          }
        ],
        "name": "NewMarketInterestRateModel",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldReserveFactorMantissa",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "newReserveFactorMantissa",
            "type": "uint256"
          }
        ],
        "name": "NewReserveFactor",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "admin",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "reduceAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "newTotalReserves",
            "type": "uint256"
          }
        ],
        "name": "ReservesReduced",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "error",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "info",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "detail",
            "type": "uint256"
          }
        ],
        "name": "Failure",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "Transfer",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "spender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "Approval",
        "type": "event"
      }
    ]
  },
  "0x158079ee67fce2f58472a96584a73c7ab9ac95c1": {
    "0xa0712d68": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e64158079ee67fce2f58472a96584a73c7ab9ac95c1a0712d68",
      "signature": "304402202a28ff715fbe2c837228469e721344765302561e589f77b3875fc1baef0984cd02206532153849fc47e62a59eb417b7b5eb317bde061736f0710e07fcf1e5a2b7459"
    },
    "0xdb006a75": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e64158079ee67fce2f58472a96584a73c7ab9ac95c1db006a75",
      "signature": "304402203218be07a366cd322ef13096b6b310118072e70bcebca873d8d2f3f201e8426c022059aa2f4856d9505b831a80a453ecd4bddc51a470e2c217ded112d6050428931b"
    },
    "0x852a12e3": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e64158079ee67fce2f58472a96584a73c7ab9ac95c1852a12e3",
      "signature": "304502210080d4322e5d45f5d5e8912f8d18d554a6ebbe883e464e04294113928e26e42028022062003bed2bb6042d65234242b3a9bf14d22e8e99398ff61e4c8a897b159bd78a"
    },
    "abi": [
      {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "spender",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "approve",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "repayAmount",
            "type": "uint256"
          }
        ],
        "name": "repayBorrow",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "reserveFactorMantissa",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "account",
            "type": "address"
          }
        ],
        "name": "borrowBalanceCurrent",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "exchangeRateStored",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "src",
            "type": "address"
          },
          {
            "name": "dst",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "transferFrom",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "borrower",
            "type": "address"
          },
          {
            "name": "repayAmount",
            "type": "uint256"
          }
        ],
        "name": "repayBorrowBehalf",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "pendingAdmin",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "balanceOfUnderlying",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getCash",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newComptroller",
            "type": "address"
          }
        ],
        "name": "_setComptroller",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalBorrows",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "comptroller",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "reduceAmount",
            "type": "uint256"
          }
        ],
        "name": "_reduceReserves",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "initialExchangeRateMantissa",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "accrualBlockNumber",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "underlying",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "totalBorrowsCurrent",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "redeemAmount",
            "type": "uint256"
          }
        ],
        "name": "redeemUnderlying",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalReserves",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "account",
            "type": "address"
          }
        ],
        "name": "borrowBalanceStored",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "mintAmount",
            "type": "uint256"
          }
        ],
        "name": "mint",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "accrueInterest",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "dst",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "transfer",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "borrowIndex",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "supplyRatePerBlock",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "liquidator",
            "type": "address"
          },
          {
            "name": "borrower",
            "type": "address"
          },
          {
            "name": "seizeTokens",
            "type": "uint256"
          }
        ],
        "name": "seize",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newPendingAdmin",
            "type": "address"
          }
        ],
        "name": "_setPendingAdmin",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "exchangeRateCurrent",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "account",
            "type": "address"
          }
        ],
        "name": "getAccountSnapshot",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "borrowAmount",
            "type": "uint256"
          }
        ],
        "name": "borrow",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "redeemTokens",
            "type": "uint256"
          }
        ],
        "name": "redeem",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "owner",
            "type": "address"
          },
          {
            "name": "spender",
            "type": "address"
          }
        ],
        "name": "allowance",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "_acceptAdmin",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newInterestRateModel",
            "type": "address"
          }
        ],
        "name": "_setInterestRateModel",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "interestRateModel",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "borrower",
            "type": "address"
          },
          {
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "name": "cTokenCollateral",
            "type": "address"
          }
        ],
        "name": "liquidateBorrow",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "admin",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "borrowRatePerBlock",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newReserveFactorMantissa",
            "type": "uint256"
          }
        ],
        "name": "_setReserveFactor",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "isCToken",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "underlying_",
            "type": "address"
          },
          {
            "name": "comptroller_",
            "type": "address"
          },
          {
            "name": "interestRateModel_",
            "type": "address"
          },
          {
            "name": "initialExchangeRateMantissa_",
            "type": "uint256"
          },
          {
            "name": "name_",
            "type": "string"
          },
          {
            "name": "symbol_",
            "type": "string"
          },
          {
            "name": "decimals_",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "interestAccumulated",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "borrowIndex",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "AccrueInterest",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "minter",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "mintAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "mintTokens",
            "type": "uint256"
          }
        ],
        "name": "Mint",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "redeemer",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "redeemAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "redeemTokens",
            "type": "uint256"
          }
        ],
        "name": "Redeem",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "borrowAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "accountBorrows",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "Borrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "payer",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "accountBorrows",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "RepayBorrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "liquidator",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "cTokenCollateral",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "seizeTokens",
            "type": "uint256"
          }
        ],
        "name": "LiquidateBorrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldPendingAdmin",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newPendingAdmin",
            "type": "address"
          }
        ],
        "name": "NewPendingAdmin",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldAdmin",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newAdmin",
            "type": "address"
          }
        ],
        "name": "NewAdmin",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldComptroller",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newComptroller",
            "type": "address"
          }
        ],
        "name": "NewComptroller",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldInterestRateModel",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newInterestRateModel",
            "type": "address"
          }
        ],
        "name": "NewMarketInterestRateModel",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldReserveFactorMantissa",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "newReserveFactorMantissa",
            "type": "uint256"
          }
        ],
        "name": "NewReserveFactor",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "admin",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "reduceAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "newTotalReserves",
            "type": "uint256"
          }
        ],
        "name": "ReservesReduced",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "error",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "info",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "detail",
            "type": "uint256"
          }
        ],
        "name": "Failure",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "Transfer",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "spender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "Approval",
        "type": "event"
      }
    ]
  },
  "0xf5dce57282a584d2746faf1593d3121fcac444dc": {
    "0xa0712d68": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e64f5dce57282a584d2746faf1593d3121fcac444dca0712d68",
      "signature": "304402200f285b98614526c25c2fd6d8a74e41b6b3bf24846bd7486dee7dd12634e09cc6022064b1281775fe296d1df4dc99427b5dc57a3e82c06e4203f7ad04ea9ff0b7b22c"
    },
    "0xdb006a75": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e64f5dce57282a584d2746faf1593d3121fcac444dcdb006a75",
      "signature": "30440220667a2c0546fa49ac9d86c50075502aa79f082aaeae82061ddfb5453497cae186022006d8107b6e333eca5e3393f9b38818112b698c16465c846fd46c269fd6f33e03"
    },
    "0x852a12e3": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e64f5dce57282a584d2746faf1593d3121fcac444dc852a12e3",
      "signature": "304402202ab26883dfd1150deeead12ae6b1d618f10ff907e95a9827ca451aaff6655bea0220510a216d74ea688ef5b89f32a001c31f64d7efd038ee176760976e8f7d9f7b52"
    },
    "abi": [
      {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "spender",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "approve",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "repayAmount",
            "type": "uint256"
          }
        ],
        "name": "repayBorrow",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "reserveFactorMantissa",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "account",
            "type": "address"
          }
        ],
        "name": "borrowBalanceCurrent",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "exchangeRateStored",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "src",
            "type": "address"
          },
          {
            "name": "dst",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "transferFrom",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "borrower",
            "type": "address"
          },
          {
            "name": "repayAmount",
            "type": "uint256"
          }
        ],
        "name": "repayBorrowBehalf",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "pendingAdmin",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "balanceOfUnderlying",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getCash",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newComptroller",
            "type": "address"
          }
        ],
        "name": "_setComptroller",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalBorrows",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "comptroller",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "reduceAmount",
            "type": "uint256"
          }
        ],
        "name": "_reduceReserves",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "initialExchangeRateMantissa",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "accrualBlockNumber",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "underlying",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "totalBorrowsCurrent",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "redeemAmount",
            "type": "uint256"
          }
        ],
        "name": "redeemUnderlying",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalReserves",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "account",
            "type": "address"
          }
        ],
        "name": "borrowBalanceStored",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "mintAmount",
            "type": "uint256"
          }
        ],
        "name": "mint",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "accrueInterest",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "dst",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "transfer",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "borrowIndex",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "supplyRatePerBlock",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "liquidator",
            "type": "address"
          },
          {
            "name": "borrower",
            "type": "address"
          },
          {
            "name": "seizeTokens",
            "type": "uint256"
          }
        ],
        "name": "seize",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newPendingAdmin",
            "type": "address"
          }
        ],
        "name": "_setPendingAdmin",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "exchangeRateCurrent",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "account",
            "type": "address"
          }
        ],
        "name": "getAccountSnapshot",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "uint256"
          },
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "borrowAmount",
            "type": "uint256"
          }
        ],
        "name": "borrow",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "redeemTokens",
            "type": "uint256"
          }
        ],
        "name": "redeem",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "owner",
            "type": "address"
          },
          {
            "name": "spender",
            "type": "address"
          }
        ],
        "name": "allowance",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "_acceptAdmin",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newInterestRateModel",
            "type": "address"
          }
        ],
        "name": "_setInterestRateModel",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "interestRateModel",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "borrower",
            "type": "address"
          },
          {
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "name": "cTokenCollateral",
            "type": "address"
          }
        ],
        "name": "liquidateBorrow",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "admin",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "borrowRatePerBlock",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newReserveFactorMantissa",
            "type": "uint256"
          }
        ],
        "name": "_setReserveFactor",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "isCToken",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "underlying_",
            "type": "address"
          },
          {
            "name": "comptroller_",
            "type": "address"
          },
          {
            "name": "interestRateModel_",
            "type": "address"
          },
          {
            "name": "initialExchangeRateMantissa_",
            "type": "uint256"
          },
          {
            "name": "name_",
            "type": "string"
          },
          {
            "name": "symbol_",
            "type": "string"
          },
          {
            "name": "decimals_",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "interestAccumulated",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "borrowIndex",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "AccrueInterest",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "minter",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "mintAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "mintTokens",
            "type": "uint256"
          }
        ],
        "name": "Mint",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "redeemer",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "redeemAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "redeemTokens",
            "type": "uint256"
          }
        ],
        "name": "Redeem",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "borrowAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "accountBorrows",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "Borrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "payer",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "accountBorrows",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "RepayBorrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "liquidator",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "cTokenCollateral",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "seizeTokens",
            "type": "uint256"
          }
        ],
        "name": "LiquidateBorrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldPendingAdmin",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newPendingAdmin",
            "type": "address"
          }
        ],
        "name": "NewPendingAdmin",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldAdmin",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newAdmin",
            "type": "address"
          }
        ],
        "name": "NewAdmin",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldComptroller",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newComptroller",
            "type": "address"
          }
        ],
        "name": "NewComptroller",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldInterestRateModel",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newInterestRateModel",
            "type": "address"
          }
        ],
        "name": "NewMarketInterestRateModel",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "oldReserveFactorMantissa",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "newReserveFactorMantissa",
            "type": "uint256"
          }
        ],
        "name": "NewReserveFactor",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "admin",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "reduceAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "newTotalReserves",
            "type": "uint256"
          }
        ],
        "name": "ReservesReduced",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "error",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "info",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "detail",
            "type": "uint256"
          }
        ],
        "name": "Failure",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "Transfer",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "spender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "Approval",
        "type": "event"
      }
    ]
  },
  "0x35a18000230da775cac24873d00ff85bccded550": {
    "0xa0712d68": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e6435a18000230da775cac24873d00ff85bccded550a0712d68",
      "signature": "3044022022a474f1737b92b493358e7df6adac8614c7672b3d00a4e926b84651159de7fc02202676fdd5e2b4645275ce6f83b3ae5a1af7688d49c1ad311f2b99a5c28190a306"
    },
    "0xdb006a75": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e6435a18000230da775cac24873d00ff85bccded550db006a75",
      "signature": "3044022006bbedf0ace84001e8fa6b0e352c17e94b82c1db5229d30918de4e2e9633092602206021f2ebcd09b6147314bf859b776dd7697e9ca6f57b3d1ecccff327da28c637"
    },
    "0x852a12e3": {
      "plugin": "Compound",
      "serialized_data": "08436f6d706f756e6435a18000230da775cac24873d00ff85bccded550852a12e3",
      "signature": "3045022100a77522a53fbbfa302c32c3c478da986e81b4baddfb1459af83829e98afc95ebf022069e52b2377f5c5d6b3e4c3e6e0aa4fa2fe13247b1c8c4d2b846b9b67d577bd01"
    },
    "abi": [
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "underlying_",
            "type": "address"
          },
          {
            "internalType": "contract ComptrollerInterface",
            "name": "comptroller_",
            "type": "address"
          },
          {
            "internalType": "contract InterestRateModel",
            "name": "interestRateModel_",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "initialExchangeRateMantissa_",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "name_",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "symbol_",
            "type": "string"
          },
          {
            "internalType": "uint8",
            "name": "decimals_",
            "type": "uint8"
          },
          {
            "internalType": "address payable",
            "name": "admin_",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "implementation_",
            "type": "address"
          },
          {
            "internalType": "bytes",
            "name": "becomeImplementationData",
            "type": "bytes"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "cashPrior",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "interestAccumulated",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "borrowIndex",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "AccrueInterest",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "spender",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "Approval",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "borrowAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "accountBorrows",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "Borrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "error",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "info",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "detail",
            "type": "uint256"
          }
        ],
        "name": "Failure",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "liquidator",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "cTokenCollateral",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "seizeTokens",
            "type": "uint256"
          }
        ],
        "name": "LiquidateBorrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "minter",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "mintAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "mintTokens",
            "type": "uint256"
          }
        ],
        "name": "Mint",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "oldAdmin",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "newAdmin",
            "type": "address"
          }
        ],
        "name": "NewAdmin",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "contract ComptrollerInterface",
            "name": "oldComptroller",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "contract ComptrollerInterface",
            "name": "newComptroller",
            "type": "address"
          }
        ],
        "name": "NewComptroller",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "oldImplementation",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "newImplementation",
            "type": "address"
          }
        ],
        "name": "NewImplementation",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "contract InterestRateModel",
            "name": "oldInterestRateModel",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "contract InterestRateModel",
            "name": "newInterestRateModel",
            "type": "address"
          }
        ],
        "name": "NewMarketInterestRateModel",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "oldPendingAdmin",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "newPendingAdmin",
            "type": "address"
          }
        ],
        "name": "NewPendingAdmin",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "oldReserveFactorMantissa",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "newReserveFactorMantissa",
            "type": "uint256"
          }
        ],
        "name": "NewReserveFactor",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "redeemer",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "redeemAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "redeemTokens",
            "type": "uint256"
          }
        ],
        "name": "Redeem",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "payer",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "accountBorrows",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "totalBorrows",
            "type": "uint256"
          }
        ],
        "name": "RepayBorrow",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "benefactor",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "addAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "newTotalReserves",
            "type": "uint256"
          }
        ],
        "name": "ReservesAdded",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "admin",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "reduceAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "newTotalReserves",
            "type": "uint256"
          }
        ],
        "name": "ReservesReduced",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "Transfer",
        "type": "event"
      },
      {
        "payable": true,
        "stateMutability": "payable",
        "type": "fallback"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "_acceptAdmin",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "uint256",
            "name": "addAmount",
            "type": "uint256"
          }
        ],
        "name": "_addReserves",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "uint256",
            "name": "reduceAmount",
            "type": "uint256"
          }
        ],
        "name": "_reduceReserves",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "contract ComptrollerInterface",
            "name": "newComptroller",
            "type": "address"
          }
        ],
        "name": "_setComptroller",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "implementation_",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "allowResign",
            "type": "bool"
          },
          {
            "internalType": "bytes",
            "name": "becomeImplementationData",
            "type": "bytes"
          }
        ],
        "name": "_setImplementation",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "contract InterestRateModel",
            "name": "newInterestRateModel",
            "type": "address"
          }
        ],
        "name": "_setInterestRateModel",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address payable",
            "name": "newPendingAdmin",
            "type": "address"
          }
        ],
        "name": "_setPendingAdmin",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "uint256",
            "name": "newReserveFactorMantissa",
            "type": "uint256"
          }
        ],
        "name": "_setReserveFactor",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "accrualBlockNumber",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "accrueInterest",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "admin",
        "outputs": [
          {
            "internalType": "address payable",
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "spender",
            "type": "address"
          }
        ],
        "name": "allowance",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "spender",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "approve",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "balanceOfUnderlying",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "uint256",
            "name": "borrowAmount",
            "type": "uint256"
          }
        ],
        "name": "borrow",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "borrowBalanceCurrent",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "borrowBalanceStored",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "borrowIndex",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "borrowRatePerBlock",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "comptroller",
        "outputs": [
          {
            "internalType": "contract ComptrollerInterface",
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
          {
            "internalType": "uint8",
            "name": "",
            "type": "uint8"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          }
        ],
        "name": "delegateToImplementation",
        "outputs": [
          {
            "internalType": "bytes",
            "name": "",
            "type": "bytes"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          }
        ],
        "name": "delegateToViewImplementation",
        "outputs": [
          {
            "internalType": "bytes",
            "name": "",
            "type": "bytes"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "exchangeRateCurrent",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "exchangeRateStored",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "getAccountSnapshot",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getCash",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "implementation",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "interestRateModel",
        "outputs": [
          {
            "internalType": "contract InterestRateModel",
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "isCToken",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "borrower",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "repayAmount",
            "type": "uint256"
          },
          {
            "internalType": "contract CTokenInterface",
            "name": "cTokenCollateral",
            "type": "address"
          }
        ],
        "name": "liquidateBorrow",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "uint256",
            "name": "mintAmount",
            "type": "uint256"
          }
        ],
        "name": "mint",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "pendingAdmin",
        "outputs": [
          {
            "internalType": "address payable",
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "uint256",
            "name": "redeemTokens",
            "type": "uint256"
          }
        ],
        "name": "redeem",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "uint256",
            "name": "redeemAmount",
            "type": "uint256"
          }
        ],
        "name": "redeemUnderlying",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "uint256",
            "name": "repayAmount",
            "type": "uint256"
          }
        ],
        "name": "repayBorrow",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "borrower",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "repayAmount",
            "type": "uint256"
          }
        ],
        "name": "repayBorrowBehalf",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "reserveFactorMantissa",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "liquidator",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "borrower",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "seizeTokens",
            "type": "uint256"
          }
        ],
        "name": "seize",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "supplyRatePerBlock",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalBorrows",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "totalBorrowsCurrent",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalReserves",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "dst",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "transfer",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "address",
            "name": "src",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "dst",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "transferFrom",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "underlying",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      }
    ]
  },
  "0x1bd435f3c054b6e901b7b108a0ab7617c808677b": {
    "0x8f00eccb": {
      "plugin": "Paraswap",
      "serialized_data": "0850617261737761701bd435f3c054b6e901b7b108a0ab7617c808677b8f00eccb",
      "signature": "30450221009a0afd48e31d3e0ec2d7c4c362b293f8893dbcacb5b705ecb92370a031bcd85e0220697a15b3eb546033a167a476c9c7cd8c24359585e6316563dadfbacaf6e3b520",
      "erc20OfInterest": [
        "data.fromToken",
        "data.path.-1.to"
      ]
    },
    "0x58b9d179": {
      "plugin": "Paraswap",
      "serialized_data": "0850617261737761701bd435f3c054b6e901b7b108a0ab7617c808677b58b9d179",
      "signature": "3045022100fcf9f8608a5907d4a350ee04cb1f4871d1fcc55928b2884179c299f269b036cd022071846ae2faef7383de89adfc91440243f5a30b7249c899a49fa4333e882e20bf",
      "erc20OfInterest": [
        "path.0",
        "path.-1"
      ]
    },
    "0x0863b7ac": {
      "plugin": "Paraswap",
      "serialized_data": "0850617261737761701bd435f3c054b6e901b7b108a0ab7617c808677b0863b7ac",
      "signature": "3045022100f6e1a922c745e244fa3ed9a865491672808ef93f492ee0410861d748c5de201f0220160d6522499f3a84fa3e744b3b81e49e129e997b28495e58671a1169b16fa777",
      "erc20OfInterest": [
        "path.0",
        "path.-1"
      ]
    },
    "0xcfc0afeb": {
      "plugin": "Paraswap",
      "serialized_data": "0850617261737761701bd435f3c054b6e901b7b108a0ab7617c808677bcfc0afeb",
      "signature": "304402201c0cbe69aac517825b3a6eb5e7251e8fd57ff93a43bd3df52c7a841818eda81b022001a10cc326efaee2463fc96e7c29739c308fb8179bd2ac37303662bae4f7705c",
      "erc20OfInterest": [
        "fromToken",
        "toToken"
      ]
    },
    "0xec1d21dd": {
      "plugin": "Paraswap",
      "serialized_data": "0850617261737761701bd435f3c054b6e901b7b108a0ab7617c808677bec1d21dd",
      "signature": "3045022100ee2b33270cf910f481e64b7781c4693e7bc86e338476d65c30c9f3d41fa4924e022079fc72cc69954f5ab1949e7d2f3023948f10dc94c9455999eb2ef38ac25fe33d",
      "erc20OfInterest": [
        "data.fromToken",
        "data.path.0.path.-1.to"
      ]
    },
    "0xf9355f72": {
      "plugin": "Paraswap",
      "serialized_data": "0850617261737761701bd435f3c054b6e901b7b108a0ab7617c808677bf9355f72",
      "signature": "304502210083e27fb14f09dc5e52a3ab9374ff39bf5cfd1fa373f957f675f122b74a867fb202202d6e107b219ea246b8c51f19df738c4968974d17b0ee128e8a44de9254507678",
      "erc20OfInterest": [
        "path.0",
        "path.-1"
      ]
    },
    "0x33635226": {
      "plugin": "Paraswap",
      "serialized_data": "0850617261737761701bd435f3c054b6e901b7b108a0ab7617c808677b33635226",
      "signature": "3044022065ca71afa7794dfe2734a30dc898e1c68c63c88ff0f6ebda231bdc3142af95400220036ed1ce1d692602cfe3cd8f242343e46fdb4a65fd8e4336b50ffa8df630ff60",
      "erc20OfInterest": [
        "path.0",
        "path.-1"
      ]
    },
    "0xa27e8b6b": {
      "plugin": "Paraswap",
      "serialized_data": "0850617261737761701bd435f3c054b6e901b7b108a0ab7617c808677ba27e8b6b",
      "signature": "304402200f2f9a1cba30bc4b7795003a311095a8ce4820416e7899659874acec47369a6c02205efddb555434ece84b42ea3dcc53b01d8eec2c212fe0f5af057546f487a8429c",
      "erc20OfInterest": [
        "fromToken",
        "toToken"
      ]
    },
    "0xf95a49eb": {
      "plugin": "Paraswap",
      "serialized_data": "0850617261737761701bd435f3c054b6e901b7b108a0ab7617c808677bf95a49eb",
      "signature": "304402201e93873c5d1c7e07ae016757fd21f4c97bdfd4bf60e35f214e0f9e174b0f3fc80220639ff1e38daad2c7f3a5f4cafb020ebcc867f10be4c4a465e342ae791fab0c24",
      "erc20OfInterest": [
        "data.fromToken",
        "data.toToken"
      ]
    },
    "abi": [
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "adapter",
            "type": "address"
          }
        ],
        "name": "AdapterInitialized",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "initiator",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "beneficiary",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "srcToken",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "destToken",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "srcAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "receivedAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "string",
            "name": "referrer",
            "type": "string"
          }
        ],
        "name": "Bought",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "fee",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "partnerShare",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "paraswapShare",
            "type": "uint256"
          }
        ],
        "name": "FeeTaken",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "previousOwner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "initiator",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "beneficiary",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "srcToken",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "destToken",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "srcAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "receivedAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "expectedAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "string",
            "name": "referrer",
            "type": "string"
          }
        ],
        "name": "Swapped",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "token",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "approve",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "components": [
              {
                "internalType": "address",
                "name": "fromToken",
                "type": "address"
              },
              {
                "internalType": "address",
                "name": "toToken",
                "type": "address"
              },
              {
                "internalType": "uint256",
                "name": "fromAmount",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "toAmount",
                "type": "uint256"
              },
              {
                "internalType": "address payable",
                "name": "beneficiary",
                "type": "address"
              },
              {
                "internalType": "string",
                "name": "referrer",
                "type": "string"
              },
              {
                "internalType": "bool",
                "name": "useReduxToken",
                "type": "bool"
              },
              {
                "components": [
                  {
                    "internalType": "address payable",
                    "name": "exchange",
                    "type": "address"
                  },
                  {
                    "internalType": "address",
                    "name": "targetExchange",
                    "type": "address"
                  },
                  {
                    "internalType": "uint256",
                    "name": "fromAmount",
                    "type": "uint256"
                  },
                  {
                    "internalType": "uint256",
                    "name": "toAmount",
                    "type": "uint256"
                  },
                  {
                    "internalType": "bytes",
                    "name": "payload",
                    "type": "bytes"
                  },
                  {
                    "internalType": "uint256",
                    "name": "networkFee",
                    "type": "uint256"
                  }
                ],
                "internalType": "struct Utils.BuyRoute[]",
                "name": "route",
                "type": "tuple[]"
              }
            ],
            "internalType": "struct Utils.BuyData",
            "name": "data",
            "type": "tuple"
          }
        ],
        "name": "buy",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "amountInMax",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amountOut",
            "type": "uint256"
          },
          {
            "internalType": "address[]",
            "name": "path",
            "type": "address[]"
          },
          {
            "internalType": "uint8",
            "name": "referrer",
            "type": "uint8"
          }
        ],
        "name": "buyOnUniswap",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "factory",
            "type": "address"
          },
          {
            "internalType": "bytes32",
            "name": "initCode",
            "type": "bytes32"
          },
          {
            "internalType": "uint256",
            "name": "amountInMax",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amountOut",
            "type": "uint256"
          },
          {
            "internalType": "address[]",
            "name": "path",
            "type": "address[]"
          },
          {
            "internalType": "uint8",
            "name": "referrer",
            "type": "uint8"
          }
        ],
        "name": "buyOnUniswapFork",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "uniswapProxy",
            "type": "address"
          }
        ],
        "name": "changeUniswapProxy",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "confirmUniswapProxyChange",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getChangeRequestedBlock",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "key",
            "type": "bytes32"
          }
        ],
        "name": "getData",
        "outputs": [
          {
            "internalType": "bytes",
            "name": "",
            "type": "bytes"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getFeeWallet",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getPartnerRegistry",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getPendingUniswapProxy",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getTimeLock",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getTokenTransferProxy",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getUniswapProxy",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getVersion",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getWhitelistAddress",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "whitelist",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "reduxToken",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "partnerRegistry",
            "type": "address"
          },
          {
            "internalType": "address payable",
            "name": "feeWallet",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "uniswapProxy",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "timelock",
            "type": "uint256"
          }
        ],
        "name": "initialize",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "adapter",
            "type": "address"
          },
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          }
        ],
        "name": "initializeAdapter",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "key",
            "type": "bytes32"
          }
        ],
        "name": "isInitialized",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "components": [
              {
                "internalType": "address",
                "name": "fromToken",
                "type": "address"
              },
              {
                "internalType": "uint256",
                "name": "fromAmount",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "toAmount",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "expectedAmount",
                "type": "uint256"
              },
              {
                "internalType": "address payable",
                "name": "beneficiary",
                "type": "address"
              },
              {
                "internalType": "string",
                "name": "referrer",
                "type": "string"
              },
              {
                "internalType": "bool",
                "name": "useReduxToken",
                "type": "bool"
              },
              {
                "components": [
                  {
                    "internalType": "uint256",
                    "name": "fromAmountPercent",
                    "type": "uint256"
                  },
                  {
                    "components": [
                      {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                      },
                      {
                        "internalType": "uint256",
                        "name": "totalNetworkFee",
                        "type": "uint256"
                      },
                      {
                        "components": [
                          {
                            "internalType": "address payable",
                            "name": "exchange",
                            "type": "address"
                          },
                          {
                            "internalType": "address",
                            "name": "targetExchange",
                            "type": "address"
                          },
                          {
                            "internalType": "uint256",
                            "name": "percent",
                            "type": "uint256"
                          },
                          {
                            "internalType": "bytes",
                            "name": "payload",
                            "type": "bytes"
                          },
                          {
                            "internalType": "uint256",
                            "name": "networkFee",
                            "type": "uint256"
                          }
                        ],
                        "internalType": "struct Utils.Route[]",
                        "name": "routes",
                        "type": "tuple[]"
                      }
                    ],
                    "internalType": "struct Utils.Path[]",
                    "name": "path",
                    "type": "tuple[]"
                  }
                ],
                "internalType": "struct Utils.MegaSwapPath[]",
                "name": "path",
                "type": "tuple[]"
              }
            ],
            "internalType": "struct Utils.MegaSwapSellData",
            "name": "data",
            "type": "tuple"
          }
        ],
        "name": "megaSwap",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "components": [
              {
                "internalType": "address",
                "name": "fromToken",
                "type": "address"
              },
              {
                "internalType": "uint256",
                "name": "fromAmount",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "toAmount",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "expectedAmount",
                "type": "uint256"
              },
              {
                "internalType": "address payable",
                "name": "beneficiary",
                "type": "address"
              },
              {
                "internalType": "string",
                "name": "referrer",
                "type": "string"
              },
              {
                "internalType": "bool",
                "name": "useReduxToken",
                "type": "bool"
              },
              {
                "components": [
                  {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                  },
                  {
                    "internalType": "uint256",
                    "name": "totalNetworkFee",
                    "type": "uint256"
                  },
                  {
                    "components": [
                      {
                        "internalType": "address payable",
                        "name": "exchange",
                        "type": "address"
                      },
                      {
                        "internalType": "address",
                        "name": "targetExchange",
                        "type": "address"
                      },
                      {
                        "internalType": "uint256",
                        "name": "percent",
                        "type": "uint256"
                      },
                      {
                        "internalType": "bytes",
                        "name": "payload",
                        "type": "bytes"
                      },
                      {
                        "internalType": "uint256",
                        "name": "networkFee",
                        "type": "uint256"
                      }
                    ],
                    "internalType": "struct Utils.Route[]",
                    "name": "routes",
                    "type": "tuple[]"
                  }
                ],
                "internalType": "struct Utils.Path[]",
                "name": "path",
                "type": "tuple[]"
              }
            ],
            "internalType": "struct Utils.SellData",
            "name": "data",
            "type": "tuple"
          }
        ],
        "name": "multiSwap",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address payable",
            "name": "feeWallet",
            "type": "address"
          }
        ],
        "name": "setFeeWallet",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "partnerRegistry",
            "type": "address"
          }
        ],
        "name": "setPartnerRegistry",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "whitelisted",
            "type": "address"
          }
        ],
        "name": "setWhitelistAddress",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "fromToken",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "toToken",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "fromAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "toAmount",
            "type": "uint256"
          },
          {
            "internalType": "address[]",
            "name": "callees",
            "type": "address[]"
          },
          {
            "internalType": "bytes",
            "name": "exchangeData",
            "type": "bytes"
          },
          {
            "internalType": "uint256[]",
            "name": "startIndexes",
            "type": "uint256[]"
          },
          {
            "internalType": "uint256[]",
            "name": "values",
            "type": "uint256[]"
          },
          {
            "internalType": "address payable",
            "name": "beneficiary",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "referrer",
            "type": "string"
          },
          {
            "internalType": "bool",
            "name": "useReduxToken",
            "type": "bool"
          }
        ],
        "name": "simplBuy",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "fromToken",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "toToken",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "fromAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "toAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "expectedAmount",
            "type": "uint256"
          },
          {
            "internalType": "address[]",
            "name": "callees",
            "type": "address[]"
          },
          {
            "internalType": "bytes",
            "name": "exchangeData",
            "type": "bytes"
          },
          {
            "internalType": "uint256[]",
            "name": "startIndexes",
            "type": "uint256[]"
          },
          {
            "internalType": "uint256[]",
            "name": "values",
            "type": "uint256[]"
          },
          {
            "internalType": "address payable",
            "name": "beneficiary",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "referrer",
            "type": "string"
          },
          {
            "internalType": "bool",
            "name": "useReduxToken",
            "type": "bool"
          }
        ],
        "name": "simpleSwap",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "receivedAmount",
            "type": "uint256"
          }
        ],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "amountIn",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amountOutMin",
            "type": "uint256"
          },
          {
            "internalType": "address[]",
            "name": "path",
            "type": "address[]"
          },
          {
            "internalType": "uint8",
            "name": "referrer",
            "type": "uint8"
          }
        ],
        "name": "swapOnUniswap",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "factory",
            "type": "address"
          },
          {
            "internalType": "bytes32",
            "name": "initCode",
            "type": "bytes32"
          },
          {
            "internalType": "uint256",
            "name": "amountIn",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amountOutMin",
            "type": "uint256"
          },
          {
            "internalType": "address[]",
            "name": "path",
            "type": "address[]"
          },
          {
            "internalType": "uint8",
            "name": "referrer",
            "type": "uint8"
          }
        ],
        "name": "swapOnUniswapFork",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "token",
            "type": "address"
          },
          {
            "internalType": "address payable",
            "name": "destination",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "transferTokens",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "contract IWETH",
            "name": "token",
            "type": "address"
          }
        ],
        "name": "withdrawAllWETH",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "stateMutability": "payable",
        "type": "receive"
      }
    ]
  }
}