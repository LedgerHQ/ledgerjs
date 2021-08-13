const path = require("path");
const { readFileJSON } = require("../utils");

const mapObject = (obj, fn) => Object.fromEntries(Object.entries(obj).map(fn));

module.exports = {
  paths: ["dapps/ethereum"],
  output: "ethereum.json", // to be put in crypto assets list
  outputTemplate: (data) =>
    JSON.stringify(
      data.reduce(
        (acc, obj) => ({
          ...acc,
          ...obj,
        }),
        {}
      ),
      null,
      2
    ),

  loader: async ({ folder, id }) => {
    const [signatures, bare] = await Promise.all([
      readFileJSON(path.join(folder, id, "b2c_signatures.json")),
      readFileJSON(path.join(folder, id, "b2c.json")),
    ]);

    const addresses = Object.keys(signatures);

    const abisList = await Promise.all(
      addresses.map((address) =>
        readFileJSON(
          path.join(folder, id, "abis", `${address}.abi.json`)
        ).catch(() => {})
      )
    );

    const abis = addresses.reduce(
      (acc, address, i) => ({
        ...acc,
        [address.toLowerCase()]: abisList[i],
      }),
      {}
    );

    return bare.contracts.reduce(
      (acc, contract) => ({
        ...acc,
        [contract.address.toLowerCase()]: {
          ...mapObject(contract.selectors, ([selector, data]) => [
            selector,
            {
              ...(signatures[contract.address.toLowerCase()][selector] || {}),
              erc20OfInterest: data.erc20OfInterest,
            },
          ]),
          abi: abis[contract.address.toLowerCase()],
        },
      }),
      {}
    );
  },
};
