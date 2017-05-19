
if (typeof ledger == 'undefined') {
    ledger = require('../src');
    comm = ledger.comm_node;
    browser = false;
}
else {
    browser = true;
    comm = ledger.comm_u2f;
}

var Q = require('q');

var TIMEOUT = 20;

var tests = [
    {name: 'testBtc', run: require('./testBtc')},
    {name: 'testBtc2', run: require('./testBtc2')},
    {name: 'testBtc3', run: require('./testBtc3')},
    {name: 'testBtc4', run: require('./testBtc4')},
    {
        run: function () {
            var deferred = Q.defer();
            var s = 15;
            console.info('You have ' + s + ' seconds to switch to eth app ...');
            var interval = setInterval(function () {
                if (--s) {
                    console.log(s + ' ...');
                } else {
                    clearInterval(interval);
                    deferred.resolve();
                }
            }, 1000);
            return deferred.promise;
        }
    },
    {name: 'testEth', run: require('./testEth')},
    {name: 'testEth2', run: require('./testEth2')},
    {name: 'testEth3', run: require('./testEth3')},
    {name: 'testEth4', run: require('./testEth4')}
];

function runTests() {
    tests.reduce(function (a, step) {
        return a.then(function () {
            console.info(step.name ? 'Running test ' + step.name : '');
            return (step.run)(comm, ledger, TIMEOUT);
        }).fail(function (err) {
            console.error('Failed test', step.name, err);
        })
    }, Q.resolve());
}

if (!browser) {
    runTests();
}

module.exports = runTests;