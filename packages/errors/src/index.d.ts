import { serializeError, deserializeError, createCustomErrorClass, addCustomErrorDeserializer } from "./helpers";
export { serializeError, deserializeError, createCustomErrorClass, addCustomErrorDeserializer, };
export declare const AccountNameRequiredError: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const AccountNotSupported: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const AmountRequired: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const BluetoothRequired: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const BtcUnmatchedApp: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const CantOpenDevice: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const CashAddrNotSupported: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const CurrencyNotSupported: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const DeviceAppVerifyNotSupported: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const DeviceGenuineSocketEarlyClose: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const DeviceNotGenuineError: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const DeviceOnDashboardExpected: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const DeviceOnDashboardUnexpected: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const DeviceInOSUExpected: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const DeviceHalted: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const DeviceNameInvalid: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const DeviceSocketFail: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const DeviceSocketNoBulkStatus: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const DisconnectedDevice: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const DisconnectedDeviceDuringOperation: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const EnpointConfigError: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const EthAppPleaseEnableContractData: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const FeeEstimationFailed: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const FirmwareNotRecognized: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const HardResetFail: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const InvalidXRPTag: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const InvalidAddress: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const InvalidAddressBecauseDestinationIsAlsoSource: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const LatestMCUInstalledError: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const UnknownMCU: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const LedgerAPIError: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const LedgerAPIErrorWithMessage: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const LedgerAPINotAvailable: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const ManagerAppAlreadyInstalledError: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const ManagerAppRelyOnBTCError: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const ManagerAppDepInstallRequired: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const ManagerAppDepUninstallRequired: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const ManagerDeviceLockedError: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const ManagerFirmwareNotEnoughSpaceError: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const ManagerNotEnoughSpaceError: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const ManagerUninstallBTCDep: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const NetworkDown: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const NoAddressesFound: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const NotEnoughBalance: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const NotEnoughBalanceToDelegate: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const NotEnoughBalanceInParentAccount: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const NotEnoughSpendableBalance: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const NotEnoughBalanceBecauseDestinationNotCreated: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const NoAccessToCamera: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const NotEnoughGas: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const NotSupportedLegacyAddress: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const GasLessThanEstimate: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const PasswordsDontMatchError: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const PasswordIncorrectError: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const RecommendSubAccountsToEmpty: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const RecommendUndelegation: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const TimeoutTagged: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const UnexpectedBootloader: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const MCUNotGenuineToDashboard: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const RecipientRequired: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const UnavailableTezosOriginatedAccountReceive: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const UnavailableTezosOriginatedAccountSend: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const UpdateFetchFileFail: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const UpdateIncorrectHash: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const UpdateIncorrectSig: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const UpdateYourApp: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const UserRefusedDeviceNameChange: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const UserRefusedAddress: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const UserRefusedFirmwareUpdate: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const UserRefusedAllowManager: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const UserRefusedOnDevice: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const TransportOpenUserCancelled: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const TransportInterfaceNotAvailable: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const TransportRaceCondition: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const TransportWebUSBGestureRequired: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const DeviceShouldStayInApp: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const WebsocketConnectionError: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const WebsocketConnectionFailed: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const WrongDeviceForAccount: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const WrongAppForCurrency: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const ETHAddressNonEIP: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const CantScanQRCode: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const FeeNotLoaded: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const FeeRequired: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const FeeTooHigh: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const SyncError: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const PairingFailed: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const GenuineCheckFailed: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const LedgerAPI4xx: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const LedgerAPI5xx: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const FirmwareOrAppUpdateRequired: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const NoDBPathGiven: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const DBWrongPassword: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
export declare const DBNotReset: (message?: string | undefined, fields?: {
    [key: string]: any;
} | undefined) => void;
/**
 * TransportError is used for any generic transport errors.
 * e.g. Error thrown when data received by exchanges are incorrect or if exchanged failed to communicate with the device for various reason.
 */
export declare function TransportError(message: string, id: string): void;
export declare namespace TransportError {
    var prototype: Error;
}
export declare const StatusCodes: {
    PIN_REMAINING_ATTEMPTS: number;
    INCORRECT_LENGTH: number;
    MISSING_CRITICAL_PARAMETER: number;
    COMMAND_INCOMPATIBLE_FILE_STRUCTURE: number;
    SECURITY_STATUS_NOT_SATISFIED: number;
    CONDITIONS_OF_USE_NOT_SATISFIED: number;
    INCORRECT_DATA: number;
    NOT_ENOUGH_MEMORY_SPACE: number;
    REFERENCED_DATA_NOT_FOUND: number;
    FILE_ALREADY_EXISTS: number;
    INCORRECT_P1_P2: number;
    INS_NOT_SUPPORTED: number;
    CLA_NOT_SUPPORTED: number;
    TECHNICAL_PROBLEM: number;
    OK: number;
    MEMORY_PROBLEM: number;
    NO_EF_SELECTED: number;
    INVALID_OFFSET: number;
    FILE_NOT_FOUND: number;
    INCONSISTENT_FILE: number;
    ALGORITHM_NOT_SUPPORTED: number;
    INVALID_KCV: number;
    CODE_NOT_INITIALIZED: number;
    ACCESS_CONDITION_NOT_FULFILLED: number;
    CONTRADICTION_SECRET_CODE_STATUS: number;
    CONTRADICTION_INVALIDATION: number;
    CODE_BLOCKED: number;
    MAX_VALUE_REACHED: number;
    GP_AUTH_FAILED: number;
    LICENSING: number;
    HALTED: number;
};
export declare function getAltStatusMessage(code: number): string | undefined | null;
/**
 * Error thrown when a device returned a non success status.
 * the error.statusCode is one of the `StatusCodes` exported by this library.
 */
export declare function TransportStatusError(statusCode: number): void;
export declare namespace TransportStatusError {
    var prototype: Error;
}
//# sourceMappingURL=index.d.ts.map