const axios = require("axios");
const fs = require("fs");
const path = require("path");

const importers = [
  require("./importers/ethereum-plugins"),
  require("./importers/erc20-signatures"),
  require("./importers/erc20full"),
  require("./importers/erc20exchange"),
  require("./importers/bep20full"),
  require("./importers/polygontokensfull"),
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
        imp.paths.map((p) => {
          const folder = path.join(inputFolder, "assets", p);
          const signatureFolder = path.join(inputFolder, "signatures/prod/", p);
          const items = fs.readdirSync(folder);
          const shouldLoad = ((id) => imp.shouldLoad ? imp.shouldLoad({ folder, id }) : !id.endsWith(".json"));
          return promiseAllBatched(
            50,
            items.sort().filter(shouldLoad),
            (id) =>
              Promise.resolve()
                .then(() => imp.loader({ signatureFolder, folder, id }))
                .catch((e) => {
                  console.log("FAILED " + id + " " + e);
                })
          );
        })
      )
        .then((all) => all.flat())
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

async function promiseAllBatched(batch, items, fn) {
  const data = Array(items.length);
  const queue = items.map((item, index) => ({
    item,
    index,
  }));
  async function step() {
    if (queue.length === 0) return;
    const first = queue.shift();
    if (first) {
      const { item, index } = first;
      data[index] = await fn(item, index);
    }
    await step(); // each time an item redeem, we schedule another one
  }
  // initially, we schedule <batch> items in parallel
  await Promise.all(
    Array(Math.min(batch, items.length))
      .fill(() => undefined)
      .map(step)
  );
  return data;
}
