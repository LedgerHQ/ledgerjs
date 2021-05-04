"use strict";
exports.__esModule = true;
exports.NotEnoughBalanceInParentAccount = exports.NotEnoughBalanceToDelegate = exports.NotEnoughBalance = exports.NoAddressesFound = exports.NetworkDown = exports.ManagerUninstallBTCDep = exports.ManagerNotEnoughSpaceError = exports.ManagerFirmwareNotEnoughSpaceError = exports.ManagerDeviceLockedError = exports.ManagerAppDepUninstallRequired = exports.ManagerAppDepInstallRequired = exports.ManagerAppRelyOnBTCError = exports.ManagerAppAlreadyInstalledError = exports.LedgerAPINotAvailable = exports.LedgerAPIErrorWithMessage = exports.LedgerAPIError = exports.UnknownMCU = exports.LatestMCUInstalledError = exports.InvalidAddressBecauseDestinationIsAlsoSource = exports.InvalidAddress = exports.InvalidXRPTag = exports.HardResetFail = exports.FirmwareNotRecognized = exports.FeeEstimationFailed = exports.EthAppPleaseEnableContractData = exports.EnpointConfigError = exports.DisconnectedDeviceDuringOperation = exports.DisconnectedDevice = exports.DeviceSocketNoBulkStatus = exports.DeviceSocketFail = exports.DeviceNameInvalid = exports.DeviceHalted = exports.DeviceInOSUExpected = exports.DeviceOnDashboardUnexpected = exports.DeviceOnDashboardExpected = exports.DeviceNotGenuineError = exports.DeviceGenuineSocketEarlyClose = exports.DeviceAppVerifyNotSupported = exports.CurrencyNotSupported = exports.CashAddrNotSupported = exports.CantOpenDevice = exports.BtcUnmatchedApp = exports.BluetoothRequired = exports.AmountRequired = exports.AccountNotSupported = exports.AccountNameRequiredError = exports.addCustomErrorDeserializer = exports.createCustomErrorClass = exports.deserializeError = exports.serializeError = void 0;
exports.StatusCodes = exports.TransportError = exports.DBNotReset = exports.DBWrongPassword = exports.NoDBPathGiven = exports.FirmwareOrAppUpdateRequired = exports.LedgerAPI5xx = exports.LedgerAPI4xx = exports.GenuineCheckFailed = exports.PairingFailed = exports.SyncError = exports.FeeTooHigh = exports.FeeRequired = exports.FeeNotLoaded = exports.CantScanQRCode = exports.ETHAddressNonEIP = exports.WrongAppForCurrency = exports.WrongDeviceForAccount = exports.WebsocketConnectionFailed = exports.WebsocketConnectionError = exports.DeviceShouldStayInApp = exports.TransportWebUSBGestureRequired = exports.TransportRaceCondition = exports.TransportInterfaceNotAvailable = exports.TransportOpenUserCancelled = exports.UserRefusedOnDevice = exports.UserRefusedAllowManager = exports.UserRefusedFirmwareUpdate = exports.UserRefusedAddress = exports.UserRefusedDeviceNameChange = exports.UpdateYourApp = exports.UpdateIncorrectSig = exports.UpdateIncorrectHash = exports.UpdateFetchFileFail = exports.UnavailableTezosOriginatedAccountSend = exports.UnavailableTezosOriginatedAccountReceive = exports.RecipientRequired = exports.MCUNotGenuineToDashboard = exports.UnexpectedBootloader = exports.TimeoutTagged = exports.RecommendUndelegation = exports.RecommendSubAccountsToEmpty = exports.PasswordIncorrectError = exports.PasswordsDontMatchError = exports.GasLessThanEstimate = exports.NotSupportedLegacyAddress = exports.NotEnoughGas = exports.NoAccessToCamera = exports.NotEnoughBalanceBecauseDestinationNotCreated = exports.NotEnoughSpendableBalance = void 0;
exports.TransportStatusError = exports.getAltStatusMessage = void 0;
var helpers_1 = require("./helpers");
exports.serializeError = helpers_1.serializeError;
exports.deserializeError = helpers_1.deserializeError;
exports.createCustomErrorClass = helpers_1.createCustomErrorClass;
exports.addCustomErrorDeserializer = helpers_1.addCustomErrorDeserializer;
exports.AccountNameRequiredError = helpers_1.createCustomErrorClass("AccountNameRequired");
exports.AccountNotSupported = helpers_1.createCustomErrorClass("AccountNotSupported");
exports.AmountRequired = helpers_1.createCustomErrorClass("AmountRequired");
exports.BluetoothRequired = helpers_1.createCustomErrorClass("BluetoothRequired");
exports.BtcUnmatchedApp = helpers_1.createCustomErrorClass("BtcUnmatchedApp");
exports.CantOpenDevice = helpers_1.createCustomErrorClass("CantOpenDevice");
exports.CashAddrNotSupported = helpers_1.createCustomErrorClass("CashAddrNotSupported");
exports.CurrencyNotSupported = helpers_1.createCustomErrorClass("CurrencyNotSupported");
exports.DeviceAppVerifyNotSupported = helpers_1.createCustomErrorClass("DeviceAppVerifyNotSupported");
exports.DeviceGenuineSocketEarlyClose = helpers_1.createCustomErrorClass("DeviceGenuineSocketEarlyClose");
exports.DeviceNotGenuineError = helpers_1.createCustomErrorClass("DeviceNotGenuine");
exports.DeviceOnDashboardExpected = helpers_1.createCustomErrorClass("DeviceOnDashboardExpected");
exports.DeviceOnDashboardUnexpected = helpers_1.createCustomErrorClass("DeviceOnDashboardUnexpected");
exports.DeviceInOSUExpected = helpers_1.createCustomErrorClass("DeviceInOSUExpected");
exports.DeviceHalted = helpers_1.createCustomErrorClass("DeviceHalted");
exports.DeviceNameInvalid = helpers_1.createCustomErrorClass("DeviceNameInvalid");
exports.DeviceSocketFail = helpers_1.createCustomErrorClass("DeviceSocketFail");
exports.DeviceSocketNoBulkStatus = helpers_1.createCustomErrorClass("DeviceSocketNoBulkStatus");
exports.DisconnectedDevice = helpers_1.createCustomErrorClass("DisconnectedDevice");
exports.DisconnectedDeviceDuringOperation = helpers_1.createCustomErrorClass("DisconnectedDeviceDuringOperation");
exports.EnpointConfigError = helpers_1.createCustomErrorClass("EnpointConfig");
exports.EthAppPleaseEnableContractData = helpers_1.createCustomErrorClass("EthAppPleaseEnableContractData");
exports.FeeEstimationFailed = helpers_1.createCustomErrorClass("FeeEstimationFailed");
exports.FirmwareNotRecognized = helpers_1.createCustomErrorClass("FirmwareNotRecognized");
exports.HardResetFail = helpers_1.createCustomErrorClass("HardResetFail");
exports.InvalidXRPTag = helpers_1.createCustomErrorClass("InvalidXRPTag");
exports.InvalidAddress = helpers_1.createCustomErrorClass("InvalidAddress");
exports.InvalidAddressBecauseDestinationIsAlsoSource = helpers_1.createCustomErrorClass("InvalidAddressBecauseDestinationIsAlsoSource");
exports.LatestMCUInstalledError = helpers_1.createCustomErrorClass("LatestMCUInstalledError");
exports.UnknownMCU = helpers_1.createCustomErrorClass("UnknownMCU");
exports.LedgerAPIError = helpers_1.createCustomErrorClass("LedgerAPIError");
exports.LedgerAPIErrorWithMessage = helpers_1.createCustomErrorClass("LedgerAPIErrorWithMessage");
exports.LedgerAPINotAvailable = helpers_1.createCustomErrorClass("LedgerAPINotAvailable");
exports.ManagerAppAlreadyInstalledError = helpers_1.createCustomErrorClass("ManagerAppAlreadyInstalled");
exports.ManagerAppRelyOnBTCError = helpers_1.createCustomErrorClass("ManagerAppRelyOnBTC");
exports.ManagerAppDepInstallRequired = helpers_1.createCustomErrorClass("ManagerAppDepInstallRequired");
exports.ManagerAppDepUninstallRequired = helpers_1.createCustomErrorClass("ManagerAppDepUninstallRequired");
exports.ManagerDeviceLockedError = helpers_1.createCustomErrorClass("ManagerDeviceLocked");
exports.ManagerFirmwareNotEnoughSpaceError = helpers_1.createCustomErrorClass("ManagerFirmwareNotEnoughSpace");
exports.ManagerNotEnoughSpaceError = helpers_1.createCustomErrorClass("ManagerNotEnoughSpace");
exports.ManagerUninstallBTCDep = helpers_1.createCustomErrorClass("ManagerUninstallBTCDep");
exports.NetworkDown = helpers_1.createCustomErrorClass("NetworkDown");
exports.NoAddressesFound = helpers_1.createCustomErrorClass("NoAddressesFound");
exports.NotEnoughBalance = helpers_1.createCustomErrorClass("NotEnoughBalance");
exports.NotEnoughBalanceToDelegate = helpers_1.createCustomErrorClass("NotEnoughBalanceToDelegate");
exports.NotEnoughBalanceInParentAccount = helpers_1.createCustomErrorClass("NotEnoughBalanceInParentAccount");
exports.NotEnoughSpendableBalance = helpers_1.createCustomErrorClass("NotEnoughSpendableBalance");
exports.NotEnoughBalanceBecauseDestinationNotCreated = helpers_1.createCustomErrorClass("NotEnoughBalanceBecauseDestinationNotCreated");
exports.NoAccessToCamera = helpers_1.createCustomErrorClass("NoAccessToCamera");
exports.NotEnoughGas = helpers_1.createCustomErrorClass("NotEnoughGas");
exports.NotSupportedLegacyAddress = helpers_1.createCustomErrorClass("NotSupportedLegacyAddress");
exports.GasLessThanEstimate = helpers_1.createCustomErrorClass("GasLessThanEstimate");
exports.PasswordsDontMatchError = helpers_1.createCustomErrorClass("PasswordsDontMatch");
exports.PasswordIncorrectError = helpers_1.createCustomErrorClass("PasswordIncorrect");
exports.RecommendSubAccountsToEmpty = helpers_1.createCustomErrorClass("RecommendSubAccountsToEmpty");
exports.RecommendUndelegation = helpers_1.createCustomErrorClass("RecommendUndelegation");
exports.TimeoutTagged = helpers_1.createCustomErrorClass("TimeoutTagged");
exports.UnexpectedBootloader = helpers_1.createCustomErrorClass("UnexpectedBootloader");
exports.MCUNotGenuineToDashboard = helpers_1.createCustomErrorClass("MCUNotGenuineToDashboard");
exports.RecipientRequired = helpers_1.createCustomErrorClass("RecipientRequired");
exports.UnavailableTezosOriginatedAccountReceive = helpers_1.createCustomErrorClass("UnavailableTezosOriginatedAccountReceive");
exports.UnavailableTezosOriginatedAccountSend = helpers_1.createCustomErrorClass("UnavailableTezosOriginatedAccountSend");
exports.UpdateFetchFileFail = helpers_1.createCustomErrorClass("UpdateFetchFileFail");
exports.UpdateIncorrectHash = helpers_1.createCustomErrorClass("UpdateIncorrectHash");
exports.UpdateIncorrectSig = helpers_1.createCustomErrorClass("UpdateIncorrectSig");
exports.UpdateYourApp = helpers_1.createCustomErrorClass("UpdateYourApp");
exports.UserRefusedDeviceNameChange = helpers_1.createCustomErrorClass("UserRefusedDeviceNameChange");
exports.UserRefusedAddress = helpers_1.createCustomErrorClass("UserRefusedAddress");
exports.UserRefusedFirmwareUpdate = helpers_1.createCustomErrorClass("UserRefusedFirmwareUpdate");
exports.UserRefusedAllowManager = helpers_1.createCustomErrorClass("UserRefusedAllowManager");
exports.UserRefusedOnDevice = helpers_1.createCustomErrorClass("UserRefusedOnDevice"); // TODO rename because it's just for transaction refusal
exports.TransportOpenUserCancelled = helpers_1.createCustomErrorClass("TransportOpenUserCancelled");
exports.TransportInterfaceNotAvailable = helpers_1.createCustomErrorClass("TransportInterfaceNotAvailable");
exports.TransportRaceCondition = helpers_1.createCustomErrorClass("TransportRaceCondition");
exports.TransportWebUSBGestureRequired = helpers_1.createCustomErrorClass("TransportWebUSBGestureRequired");
exports.DeviceShouldStayInApp = helpers_1.createCustomErrorClass("DeviceShouldStayInApp");
exports.WebsocketConnectionError = helpers_1.createCustomErrorClass("WebsocketConnectionError");
exports.WebsocketConnectionFailed = helpers_1.createCustomErrorClass("WebsocketConnectionFailed");
exports.WrongDeviceForAccount = helpers_1.createCustomErrorClass("WrongDeviceForAccount");
exports.WrongAppForCurrency = helpers_1.createCustomErrorClass("WrongAppForCurrency");
exports.ETHAddressNonEIP = helpers_1.createCustomErrorClass("ETHAddressNonEIP");
exports.CantScanQRCode = helpers_1.createCustomErrorClass("CantScanQRCode");
exports.FeeNotLoaded = helpers_1.createCustomErrorClass("FeeNotLoaded");
exports.FeeRequired = helpers_1.createCustomErrorClass("FeeRequired");
exports.FeeTooHigh = helpers_1.createCustomErrorClass("FeeTooHigh");
exports.SyncError = helpers_1.createCustomErrorClass("SyncError");
exports.PairingFailed = helpers_1.createCustomErrorClass("PairingFailed");
exports.GenuineCheckFailed = helpers_1.createCustomErrorClass("GenuineCheckFailed");
exports.LedgerAPI4xx = helpers_1.createCustomErrorClass("LedgerAPI4xx");
exports.LedgerAPI5xx = helpers_1.createCustomErrorClass("LedgerAPI5xx");
exports.FirmwareOrAppUpdateRequired = helpers_1.createCustomErrorClass("FirmwareOrAppUpdateRequired");
// db stuff, no need to translate
exports.NoDBPathGiven = helpers_1.createCustomErrorClass("NoDBPathGiven");
exports.DBWrongPassword = helpers_1.createCustomErrorClass("DBWrongPassword");
exports.DBNotReset = helpers_1.createCustomErrorClass("DBNotReset");
/**
 * TransportError is used for any generic transport errors.
 * e.g. Error thrown when data received by exchanges are incorrect or if exchanged failed to communicate with the device for various reason.
 */
function TransportError(message, id) {
    this.name = "TransportError";
    this.message = message;
    this.stack = new Error().stack;
    this.id = id;
}
exports.TransportError = TransportError;
TransportError.prototype = new Error();
helpers_1.addCustomErrorDeserializer("TransportError", function (e) { return new TransportError(e.message, e.id); });
exports.StatusCodes = {
    PIN_REMAINING_ATTEMPTS: 0x63c0,
    INCORRECT_LENGTH: 0x6700,
    MISSING_CRITICAL_PARAMETER: 0x6800,
    COMMAND_INCOMPATIBLE_FILE_STRUCTURE: 0x6981,
    SECURITY_STATUS_NOT_SATISFIED: 0x6982,
    CONDITIONS_OF_USE_NOT_SATISFIED: 0x6985,
    INCORRECT_DATA: 0x6a80,
    NOT_ENOUGH_MEMORY_SPACE: 0x6a84,
    REFERENCED_DATA_NOT_FOUND: 0x6a88,
    FILE_ALREADY_EXISTS: 0x6a89,
    INCORRECT_P1_P2: 0x6b00,
    INS_NOT_SUPPORTED: 0x6d00,
    CLA_NOT_SUPPORTED: 0x6e00,
    TECHNICAL_PROBLEM: 0x6f00,
    OK: 0x9000,
    MEMORY_PROBLEM: 0x9240,
    NO_EF_SELECTED: 0x9400,
    INVALID_OFFSET: 0x9402,
    FILE_NOT_FOUND: 0x9404,
    INCONSISTENT_FILE: 0x9408,
    ALGORITHM_NOT_SUPPORTED: 0x9484,
    INVALID_KCV: 0x9485,
    CODE_NOT_INITIALIZED: 0x9802,
    ACCESS_CONDITION_NOT_FULFILLED: 0x9804,
    CONTRADICTION_SECRET_CODE_STATUS: 0x9808,
    CONTRADICTION_INVALIDATION: 0x9810,
    CODE_BLOCKED: 0x9840,
    MAX_VALUE_REACHED: 0x9850,
    GP_AUTH_FAILED: 0x6300,
    LICENSING: 0x6f42,
    HALTED: 0x6faa
};
function getAltStatusMessage(code) {
    switch (code) {
        // improve text of most common errors
        case 0x6700:
            return "Incorrect length";
        case 0x6800:
            return "Missing critical parameter";
        case 0x6982:
            return "Security not satisfied (dongle locked or have invalid access rights)";
        case 0x6985:
            return "Condition of use not satisfied (denied by the user?)";
        case 0x6a80:
            return "Invalid data received";
        case 0x6b00:
            return "Invalid parameter received";
    }
    if (0x6f00 <= code && code <= 0x6fff) {
        return "Internal error, please report";
    }
}
exports.getAltStatusMessage = getAltStatusMessage;
/**
 * Error thrown when a device returned a non success status.
 * the error.statusCode is one of the `StatusCodes` exported by this library.
 */
function TransportStatusError(statusCode) {
    this.name = "TransportStatusError";
    var statusText = Object.keys(exports.StatusCodes).find(function (k) { return exports.StatusCodes[k] === statusCode; }) ||
        "UNKNOWN_ERROR";
    var smsg = getAltStatusMessage(statusCode) || statusText;
    var statusCodeStr = statusCode.toString(16);
    this.message = "Ledger device: " + smsg + " (0x" + statusCodeStr + ")";
    this.stack = new Error().stack;
    this.statusCode = statusCode;
    this.statusText = statusText;
}
exports.TransportStatusError = TransportStatusError;
TransportStatusError.prototype = new Error();
helpers_1.addCustomErrorDeserializer("TransportStatusError", function (e) { return new TransportStatusError(e.statusCode); });
//# sourceMappingURL=index.js.map