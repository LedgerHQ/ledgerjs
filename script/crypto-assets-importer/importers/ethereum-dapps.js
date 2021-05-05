const path = require("path");
const { readFileJSON } = require("../utils");

module.exports = {
  paths: ["dapps/ethereum"],
  output: "data/dapps/ethereum.js",
  outputTemplate: (data) =>
    "module.exports = " +
    JSON.stringify(
      data.reduce(
        (acc, obj) => ({
          ...acc,
          ...obj,
        }),
        {}
      )
    ),

  loader: ({ folder, id }) =>
    readFileJSON(path.join(folder, id, "b2c_signatures.json")),
};
