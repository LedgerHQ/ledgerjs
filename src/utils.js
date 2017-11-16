/********************************************************************************
*   Ledger Node JS API
*   (c) 2016-2017 Ledger
*
*  Licensed under the Apache License, Version 2.0 (the "License");
*  you may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
********************************************************************************/

'use strict';

var LedgerUtils = {}

LedgerUtils.eachSeries = function (arr, fun) {
    return arr.reduce( function (p, e) { return p.then(function () { return fun(e) }) }, Promise.resolve())
}

LedgerUtils.splitPath = function(path) {
	var result = [];
	var components = path.split('/');
	components.forEach(function (element, index) {
		var number = parseInt(element, 10);
		if (isNaN(number)) {
			return;
		}
		if ((element.length > 1) && (element[element.length - 1] == "'")) {
			number += 0x80000000;
		}
		result.push(number);
	});
	return result;
}

LedgerUtils.foreach = function (arr, callback) {
	function iterate(index, array, result) {
		if (index >= array.length) {
			return result
		}
		else return callback(array[index], index).then(function (res) {
			result.push(res);
			return iterate(index + 1, array, result);
		})
	}
    return Promise.resolve().then(function () {
        return iterate(0, arr, []);
    });
}

LedgerUtils.doIf = function(condition, callback) {
	return Promise.resolve()
		.then(function () {
            if (condition) {
                return callback()
            }
        })
}

LedgerUtils.asyncWhile = function(condition, callback) {
	function iterate(result) {
		if (!condition()) {
            return result
		}
        else {
			return callback().then(function (res) {
                result.push(res);
                return iterate(result);
            })
        }
	}
	return Promise.resolve([]).then(iterate);
}


module.exports = LedgerUtils;

