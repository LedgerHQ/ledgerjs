"use strict";
exports.__esModule = true;
exports.wrapApdu = void 0;
function wrapApdu(apdu, key) {
    if (apdu.length === 0)
        return apdu;
    var result = Buffer.alloc(apdu.length);
    for (var i = 0; i < apdu.length; i++) {
        result[i] = apdu[i] ^ key[i % key.length];
    }
    return result;
}
exports.wrapApdu = wrapApdu;
//# sourceMappingURL=scrambling.js.map