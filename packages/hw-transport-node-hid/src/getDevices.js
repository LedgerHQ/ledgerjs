// @flow
import HID from "node-hid";
import isLedgerDevice from "./isLedgerDevice";
export default function getDevices(): Array<*> {
  return HID.devices().filter(isLedgerDevice);
}
