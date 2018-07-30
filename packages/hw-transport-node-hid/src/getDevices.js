// @flow
import HID from "node-hid";

export default function getDevices(): Array<*> {
  return HID.devices(0x2c97, 0x0);
}
