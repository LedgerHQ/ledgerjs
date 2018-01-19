// @flow

import EventEmitter from "events";
import getDevices from "./getDevices";

export default (
  delay: number = 100
): {
  events: EventEmitter,
  stop: () => void
} => {
  const events = new EventEmitter();
  events.setMaxListeners(0);
  let timeoutDetection;
  let listDevices = getDevices();

  const flatDevice = device => device.path;

  const getFlatDevices = () => [
    ...new Set(getDevices().map(device => flatDevice(device)))
  ];
  const getDeviceByPath = ids =>
    listDevices.find(device => flatDevice(device) === ids);

  let lastDevices = getFlatDevices();

  const checkDevices = () => {
    timeoutDetection = setTimeout(() => {
      const currentDevices = getFlatDevices();

      const addDevice = currentDevices.find(
        device => !lastDevices.includes(device)
      );
      const removeDevice = lastDevices.find(
        device => !currentDevices.includes(device)
      );

      if (addDevice) {
        listDevices = getDevices();
        events.emit("add", getDeviceByPath(addDevice));
      }

      if (removeDevice) {
        events.emit("remove", getDeviceByPath(removeDevice));
        listDevices = listDevices.filter(
          device => flatDevice(device) !== removeDevice
        );
      }

      lastDevices = currentDevices;

      checkDevices();
    }, delay);
  };

  checkDevices();

  return {
    stop: () => {
      clearTimeout(timeoutDetection);
    },
    events
  };
};
