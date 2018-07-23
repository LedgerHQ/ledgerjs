// @flow

import EventEmitter from "events";
import usbDetect from "usb-detection";
import getDevices from "./getDevices";

const VENDOR_ID = 11415; // Ledger's Vendor ID for filtering
const MAX_ATTEMPTS = 10;

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

  const poll = (type, attempt = 1) => {
    let changeFound = false;

    if (!listenDevicesPollingSkip()) {
      debug(`Polling for ${type} [attempt ${attempt}/${MAX_ATTEMPTS}]`);

      const currentDevices = getFlatDevices();

      if (type === "add") {
        const newDevices = currentDevices.filter(d => !lastDevices.includes(d));

        if (newDevices.length > 0) {
          debug("New device found:", newDevices);

          listDevices = getDevices();
          events.emit("add", getDeviceByPaths(newDevices));

          changeFound = true;
        } else {
          debug("No new device found");
        }
      }

      if (type === "remove") {
        const removeDevices = lastDevices.filter(
          d => !currentDevices.includes(d)
        );

        if (removeDevices.length > 0) {
          debug("Removed device found:", removeDevices);

          events.emit("remove", getDeviceByPaths(removeDevices));
          listDevices = listDevices.filter(
            d => !removeDevices.includes(flatDevice(d))
          );

          changeFound = true;
        } else {
          debug("No removed device found");
        }
      }

      if (changeFound) {
        lastDevices = currentDevices;
      } else {
        if (attempt < MAX_ATTEMPTS) {
          const newDelay = delay * attempt;

          debug(`Repolling ${type} in ${newDelay}ms`);

          setTimeout(() => {
            poll(type, attempt + 1);
          }, newDelay);
        } else {
          debug(`Giving up after ${attempt} attempts`);
        }
      }
    } else {
      debug(`Polling skipped, retrying in ${delay}ms`);

      setTimeout(() => {
        poll(type);
      }, delay);
    }
  };

  debug("Starting to monitor USB for ledger devices");
  usbDetect.startMonitoring();

  // Detect add
  usbDetect.on(`add:${VENDOR_ID}`, device => {
    debug("Device add detected:", device.deviceName);

    poll("add");
  });

  // Detect remove
  usbDetect.on(`remove:${VENDOR_ID}`, device => {
    debug("Device removal detected:", device.deviceName);

    poll("remove");
  });

  return {
    stop: () => {
      debug("Stopping USB monitoring");
      usbDetect.stopMonitoring();
    },
    events
  };
};
