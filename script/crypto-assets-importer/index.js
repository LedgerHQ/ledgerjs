const axios = require("axios");
const fs = require("fs");
const path = require("path");

const importers = [
  require("./importers/erc20-signatures"),
  require("./importers/erc20full"),
  require("./importers/erc20exchange"),
  require("./importers/currenciesExchange"),
];

const outputFolder = path.join(__dirname, "../../packages/cryptoassets");
const inputFolder = process.argv[2];
if (!inputFolder) {
  console.error(
    "The folder of ledger's crypto-assets is required in parameter"
  );
  process.exit(1);
}

axios
  .get("https://countervalues.api.live.ledger.com/tickers")
  .then(({ data: countervaluesTickers }) => {
    importers.forEach((imp) => {
      const folder = path.join(inputFolder, imp.path);
      const outputJS = path.join(
        outputFolder,
        imp.output ? imp.output : imp.path + ".js"
      );
      const items = fs.readdirSync(folder);
      Promise.all(
        items
          .sort()
          .filter((a) => !a.endsWith(".json"))
          .map((id) =>
            imp.loader({ folder, id }).catch((e) => {
              console.log("FAILED " + id + " " + e);
            })
          )
      )
        .then((all) => all.filter(Boolean))
        .then((all) =>
          imp.validate ? imp.validate(all, countervaluesTickers) : all
        )
        .then((all) => {
          const data = imp.join ? imp.join(all) : all;
          fs.writeFileSync(outputJS, imp.outputTemplate(data), "utf-8");
        });
    });
  });
