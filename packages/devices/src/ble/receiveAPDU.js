"use strict";
exports.__esModule = true;
exports.receiveAPDU = void 0;
var errors_1 = require("@ledgerhq/errors");
var rxjs_1 = require("rxjs");
var logs_1 = require("@ledgerhq/logs");
var TagId = 0x05;
// operator that transform the input raw stream into one apdu response and finishes
var receiveAPDU = function (rawStream) {
    return rxjs_1.Observable.create(function (o) {
        var notifiedIndex = 0;
        var notifiedDataLength = 0;
        var notifiedData = Buffer.alloc(0);
        var sub = rawStream.subscribe({
            complete: function () {
                o.error(new errors_1.DisconnectedDevice());
                sub.unsubscribe();
            },
            error: function (e) {
                logs_1.log("ble-error", "in receiveAPDU " + String(e));
                o.error(e);
                sub.unsubscribe();
            },
            next: function (value) {
                var tag = value.readUInt8(0);
                var index = value.readUInt16BE(1);
                var data = value.slice(3);
                if (tag !== TagId) {
                    o.error(new errors_1.TransportError("Invalid tag " + tag.toString(16), "InvalidTag"));
                    return;
                }
                if (notifiedIndex !== index) {
                    o.error(new errors_1.TransportError("BLE: Invalid sequence number. discontinued chunk. Received " +
                        index +
                        " but expected " +
                        notifiedIndex, "InvalidSequence"));
                    return;
                }
                if (index === 0) {
                    notifiedDataLength = data.readUInt16BE(0);
                    data = data.slice(2);
                }
                notifiedIndex++;
                notifiedData = Buffer.concat([notifiedData, data]);
                if (notifiedData.length > notifiedDataLength) {
                    o.error(new errors_1.TransportError("BLE: received too much data. discontinued chunk. Received " +
                        notifiedData.length +
                        " but expected " +
                        notifiedDataLength, "BLETooMuchData"));
                    return;
                }
                if (notifiedData.length === notifiedDataLength) {
                    o.next(notifiedData);
                    o.complete();
                    sub.unsubscribe();
                }
            }
        });
        return function () {
            sub.unsubscribe();
        };
    });
};
exports.receiveAPDU = receiveAPDU;
//# sourceMappingURL=receiveAPDU.js.map