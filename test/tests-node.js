
if (typeof ledger == 'undefined') {
    ledger = require('../src');
    comm = ledger.comm_node;
    browser = false;
}
else {
    browser = true;
    comm = ledger.comm_u2f;
}

var TIMEOUT = 20;

var tests = [
    {name:'testBtc' , test: require('./testBtc')},
    {name:'testBtc2' , test: require('./testBtc2')},
    {name:'testBtc3' , test: require('./testBtc3')},
    {name:'testBtc4' , test: require('./testBtc4')},
    {name:'testEth' , test: require('./testEth')},
    {name:'testEth2' , test: require('./testEth2')},
    {name:'testEth3' , test: require('./testEth3')},
    {name:'testEth4' , test: require('./testEth4')}
];

var Q = require('q');

function runTests() {
    tests.reduce(function (a, test) {
        return a.then(function () {
            console.warn('Running test', test.name);
            return (test.test)(comm, ledger, TIMEOUT);
        }).fail(function (err) {
            console.error('Failed test', test.name, err);
        })
    }, Q.resolve());
}

if (!browser) {
    runTests();
}

module.exports = runTests;