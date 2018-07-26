// @flow

import EventEmitter from "events";
import usbDetect from "usb-detection";
import { debounce } from "lodash";
import getDevices from "./getDevices";

const VENDOR_ID = 11415; // Ledger's Vendor ID for filtering

export default (
  delay: number,
  listenDevicesPollingSkip: () => boolean,
  debug: (...any) => void
): {
  events: EventEmitter,
  stop: () => void
} => {
  const events = new EventEmitter();
  events.setMaxListeners(0);

  let listDevices = getDevices();

  const flatDevice = d => d.path;

  const getFlatDevices = () => [
    ...new Set(getDevices().map(d => flatDevice(d)))
  ];

  const getDeviceByPaths = paths =>
    listDevices.find(d => paths.includes(flatDevice(d)));

  let lastDevices = getFlatDevices();

  const poll = () => {
    if (!listenDevicesPollingSkip()) {
      debug("Polling for added or removed devices");

      let changeFound = false;
      const currentDevices = getFlatDevices();
      const newDevices = currentDevices.filter(d => !lastDevices.includes(d));

      if (newDevices.length > 0) {
        debug("New device found:", newDevices);

        listDevices = getDevices();
        events.emit("add", getDeviceByPaths(newDevices));

        changeFound = true;
      } else {
        debug("No new device found");
      }

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

      if (changeFound) {
        lastDevices = currentDevices;
      }
    } else {
      debug("Polling skipped, re-debouncing");
      debouncedPoll();
    }
  };

  const debouncedPoll = debounce(poll, delay);

  debug("Starting to monitor USB for ledger devices");
  usbDetect.startMonitoring();

  // Detect add
  usbDetect.on(`add:${VENDOR_ID}`, device => {
    debug("Device add detected:", device.deviceName);

    debouncedPoll();
  });

  // Detect remove
  usbDetect.on(`remove:${VENDOR_ID}`, device => {
    debug("Device removal detected:", device.deviceName);

    debouncedPoll();
  });

  return {
    stop: () => {
      debug("Stopping USB monitoring");
      debouncedPoll.cancel();
      usbDetect.stopMonitoring();
    },
    events
  };
};
