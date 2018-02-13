import "babel-polyfill";

import Transport from "@ledgerhq/hw-transport-u2f";
import runTests from "./runTests";

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
  runTests(Transport).then(
    () => {
      console.log("ALL PASS");
    },
    e => {
      console.error(e);
      errorEl.textContent = e.message;
    }
  );
};
