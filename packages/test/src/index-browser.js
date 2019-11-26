

import TransportU2F from "@ledgerhq/hw-transport-u2f";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import TransportWebBLE from "@ledgerhq/hw-transport-web-ble";
import runTests from "./runTests";

window.Buffer = require("buffer").Buffer;

window.TransportWebBLE = TransportWebBLE;
window.TransportWebUSB = TransportWebUSB;

const transports = [
  { name: "U2F transport", clazz: TransportU2F },
  { name: "WebUSB transport", clazz: TransportWebUSB },
  { name: "Web Bluetooth transport", clazz: TransportWebBLE }
];
const transportSelect = document.createElement("select");
transports.forEach((t, i) => {
  const opt = document.createElement("option");
  opt.value = i;
  opt.innerText = t.name;
  transportSelect.appendChild(opt);
});
document.body.appendChild(transportSelect);

const btn = document.createElement("button");
btn.textContent = "run tests";
document.body.appendChild(btn);

const errorEl = document.createElement("code");
errorEl.style.color = "#a33";
const pre = document.createElement("pre");
pre.appendChild(errorEl);
document.body.appendChild(pre);

btn.onclick = () => {
  errorEl.textContent = "";
  runTests({
    getTransportClass: () => transports[transportSelect.selectedIndex].clazz,
    timeout: 5000,
    waitForAppSwitch: step =>
      new Promise(resolve => {
        alert("Please switch to " + step.appName + " app ...");
        resolve();
      })
  }).then(
    () => {
      console.log("ALL PASS");
    },
    e => {
      console.error(e);
      errorEl.textContent = e.message;
    }
  );
};
