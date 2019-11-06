const fs = require("fs");
const path = require("path");

const importers = [require("./importers/erc20")];

const outputFolder = path.join(__dirname, "../../packages/hw-app-eth/data");
const inputFolder = process.argv[2];
if (!inputFolder) {
  console.error(
    "The folder of ledger's crypto-assets is required in parameter"
  );
  process.exit(1);
}
importers.forEach(imp => {
  const folder = path.join(inputFolder, imp.path);
  const outputJS = path.join(outputFolder, imp.id + ".js");
  const items = fs.readdirSync(folder);
  Promise.all(items.sort().map(id => imp.loader({ folder, id })))
    .then(all => all.filter(Boolean))
    .then(all => {
      const data = imp.join(all);
      fs.writeFileSync(
        outputJS,
        "module.exports = " + JSON.stringify(data.toString("base64")) + ";"
      );
    });
});
