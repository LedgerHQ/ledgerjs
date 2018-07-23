// @flow

import EventEmitter from "events";
import usbDetect from "usb-detection";
import getDevices from "./getDevices";

const VENDOR_ID = 11415; // Ledger's Vendor ID for filtering

export default (
  delay: number,
  listenDevicesPollingSkip: () => boolean,
  debugMode: boolean
): {
  events: EventEmitter,
  stop: () => void
} => {
  const events = new EventEmitter();
  events.setMaxListeners(0);

  let timeoutDetection;
  let listDevices = getDevices();

  const debug = (...args) => {
    if (debugMode && args[0]) {
      console.log("[listenDevices]", ...args);
    }
  };

  const flatDevice = d => d.path;

  const getFlatDevices = () => [
    ...new Set(getDevices().map(d => flatDevice(d)))
  ];

  const getDeviceByPaths = paths =>
    listDevices.find(d => paths.includes(flatDevice(d)));

  let lastDevices = getFlatDevices();

  const pollAdd = () => {
    if (listenDevicesPollingSkip()) {
      debug("Polling skipped");
      return;
    }

    debug("Polling for added device");

    const currentDevices = getFlatDevices();
    const newDevices = currentDevices.filter(d => !lastDevices.includes(d));

    if (newDevices.length > 0) {
      debug("New device found:", newDevices);
      listDevices = getDevices();
      events.emit("add", getDeviceByPaths(newDevices));

      lastDevices = currentDevices;
    } else {
      debug("No new device found, repolling in " + delay);
      setTimeout(pollAdd, delay);
    }
  };

  const pollRemove = () => {
    if (listenDevicesPollingSkip()) {
      debug("Polling skipped");
      return;
    }

    debug("Polling for removed device");

    const currentDevices = getFlatDevices();
    const removeDevices = lastDevices.filter(d => !currentDevices.includes(d));

    if (removeDevices.length > 0) {
      debug("Removed device found:", removeDevices);
      events.emit("remove", getDeviceByPaths(removeDevices));
      listDevices = listDevices.filter(
        d => !removeDevices.includes(flatDevice(d))
      );

      lastDevices = currentDevices;
    } else {
      debug("No removed device found, repolling in " + delay);
      setTimeout(pollRemove, delay);
    }
  };

  debug("Starting to monitor USB for ledger devices");
  usbDetect.startMonitoring();

  // Detect add
  usbDetect.on(`add:${VENDOR_ID}`, device => {
    debug("Device add detected:", device.deviceName);

    pollAdd();
  });

  // Detect remove
  usbDetect.on(`remove:${VENDOR_ID}`, device => {
    debug("Device removal detected:", device.deviceName);

    pollRemove();
  });

  return {
    stop: () => {
      debug("Stopping USB monitoring");
      usbDetect.stopMonitoring();
    },
    events
  };
};
