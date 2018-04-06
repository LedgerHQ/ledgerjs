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

  const flatDevice = d => d.path;

  const getFlatDevices = () => [
    ...new Set(getDevices().map(d => flatDevice(d)))
  ];

  const getDeviceByPaths = paths =>
    listDevices.find(d => paths.includes(flatDevice(d)));

  let lastDevices = getFlatDevices();

  const checkDevices = () => {
    timeoutDetection = setTimeout(() => {
      const currentDevices = getFlatDevices();

      const newDevices = currentDevices.filter(d => !lastDevices.includes(d));
      const removeDevices = lastDevices.filter(
        d => !currentDevices.includes(d)
      );

      if (newDevices.length > 0) {
        listDevices = getDevices();
        events.emit("add", getDeviceByPaths(newDevices));
      }

      if (removeDevices.length > 0) {
        events.emit("remove", getDeviceByPaths(removeDevices));
        listDevices = listDevices.filter(
          d => !removeDevices.includes(flatDevice(d))
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
