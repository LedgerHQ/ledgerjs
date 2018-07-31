// @flow
import HID from "node-hid";

const filterInterface = device =>
  ["win32", "darwin"].includes(process.platform)
    ? device.usagePage === 0xffa0
    : device.interface === 0;

export default function getDevices(): Array<*> {
  return HID.devices(0x2c97, 0x0).filter(filterInterface);
}
