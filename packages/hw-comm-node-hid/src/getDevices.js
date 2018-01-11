// @flow

import HID from "node-hid";

export default function getDevices(): Array<*> {
  return HID.devices();
}
