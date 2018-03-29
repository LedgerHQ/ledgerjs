// We check the usagePage for get only HID device
export default d =>
  d.usagePage === 0xffa0 &&
  ((d.vendorId === 0x2581 && d.productId === 0x3b7c) || d.vendorId === 0x2c97);
