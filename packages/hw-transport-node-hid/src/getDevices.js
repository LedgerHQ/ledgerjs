const HID = require('node-hid')

module.exports = function getDevices () {
  // $FlowFixMe bug in HID flow def
  return HID.devices(0x2c97, 0x0).filter(device => {
    return ['win32', 'darwin'].includes(process.platform)
      ? device.usagePage === 0xffa0
      : device.interface === 0
  })
}
