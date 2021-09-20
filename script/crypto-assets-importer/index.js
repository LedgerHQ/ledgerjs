const axios = require("axios");
const fs = require("fs");
const path = require("path");

const importers = [
  require("./importers/ethereum-plugins"),
  require("./importers/erc20-signatures"),
  require("./importers/erc20full"),
  require("./importers/erc20exchange"),
  require("./importers/bep20full"),
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
  .get("https://countervalues.live.ledger.com/v2/tickers")
  .then(({ data: countervaluesTickers }) => {
    importers.forEach((imp) => {
      const outputJS = path.join(
        outputFolder,
        imp.output ? imp.output : imp.path + ".js"
      );
      Promise.all(
        imp.paths.flatMap((p) => {
          const folder = path.join(inputFolder, "assets", p);
          const signatureFolder = path.join(inputFolder, "signatures/prod/", p);
          const items = fs.readdirSync(folder);
          return items
            .sort()
            .filter((a) => !a.endsWith(".json"))
            .map((id) =>
              imp.loader({ signatureFolder, folder, id }).catch((e) => {
                console.log("FAILED " + id + " " + e);
              })
            );
        })
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
