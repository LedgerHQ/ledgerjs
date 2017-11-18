#/bin/bash

rm -rf browser/ lib/ &&
babel src -d lib &&
flow-copy-source src lib &&
mkdir -p browser &&
browserify lib/index-browser.js -s=ledger -o browser/ledger.js &&
uglifyjs -o browser/ledger.min.js browser/ledger.js &&
browserify test/tests-node.js -s=runTests -o test/tests-browser.js
