const path = require("path");
const Buffer = require("buffer").Buffer;
const { readFileJSON } = require("../utils");

const inferChainId = common =>
  common.blockchain_name === "foundation"
    ? 1
    : common.blockchain_name === "ropsten"
      ? 3
      : null;

const asUint4be = n => {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n);
  return b;
};

module.exports = {
  path: "tokens/ethereum/erc20",
  id: "erc20",

  join: buffers =>
    buffers.reduce(
      (acc, b) => Buffer.concat([acc, asUint4be(b.length), b]),
      Buffer.alloc(0)
    ),

  loader: ({ folder, id }) =>
    Promise.all([
      readFileJSON(path.join(folder, id, "common.json")),
      readFileJSON(path.join(folder, id, "ledger_signature.json"))
    ]).then(([common, ledgerSignature]) => {
      const decimals = asUint4be(common.decimals);
      const contractAddress = Buffer.from(
        common.contract_address.slice(2),
        "hex"
      );
      const ticker = Buffer.from(common.ticker, "ascii");
      const chainId = asUint4be(inferChainId(common));
      const signature = Buffer.from(ledgerSignature, "hex");
      return Buffer.concat([
        Buffer.from([ticker.length]),
        ticker,
        contractAddress,
        decimals,
        chainId,
        signature
      ]);
    })
};
