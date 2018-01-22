export default device =>
  (device.vendorId === 0x2581 && device.productId === 0x3b7c) ||
  device.vendorId === 0x2c97;
