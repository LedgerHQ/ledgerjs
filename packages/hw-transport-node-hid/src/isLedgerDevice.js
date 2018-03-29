// We check the usagePage on Win/OSX, and interface on Linux for get only HID device
export default d =>
  (["win32", "darwin"].includes(process.platform)
    ? d.usagePage === 0xffa0
    : d.interface === 0) &&
  ((d.vendorId === 0x2581 && d.productId === 0x3b7c) || d.vendorId === 0x2c97);
