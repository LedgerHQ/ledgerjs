import {
  RecordStore,
  createTransportRecorder,
  createTransportReplayer
} from "@ledgerhq/hw-transport-mocker";
import commandLineArgs from "command-line-args";
import fs from "fs";
import http from "http";
import express from "express";
import cors from "cors";
import WebSocket from "ws";
import bodyParser from "body-parser";
import os from "os";

const mainOptions = commandLineArgs([
  {
    name: "file",
    alias: "f",
    type: String
  },
  {
    name: "silent",
    alias: "s",
    type: Boolean
  }
]);

let Transport;
let saveToFile = null;
let recordStore;

const log = mainOptions.silent ? () => {} : (...args) => console.log(...args);

// --mock <file>
// There are two ways to use the mock, either you record or you replay
// - record means that it's a decoration in node-hid that will just save to a file
// - replay means that it's going to re-use a recorded file and mock a transport instead of using an actual device
// replay mode is the default unless environment RECORD_APDU_TO_FILE is defined, this allow to easily replay tests in record mode.
if (mainOptions.file) {
  if (process.env.RECORD_APDU_TO_FILE) {
    log(`the APDUs will be recorded in ${mainOptions.file}`);
    saveToFile = mainOptions.file;
    recordStore = new RecordStore([]);
    Transport = createTransportRecorder(
      require("@ledgerhq/hw-transport-node-hid").default,
      recordStore
    );
  } else {
    recordStore = RecordStore.fromString(
      fs.readFileSync(mainOptions.file, "utf8")
    );
    if (recordStore.isEmpty()) {
      process.exit(0);
    }
    log(
      `${recordStore.queue.length} mocked APDUs will be replayed from ${
        mainOptions.file
      }`
    );
    Transport = createTransportReplayer(recordStore);
  }
} else {
  Transport = require("@ledgerhq/hw-transport-node-hid").default;
}

const ifaces = os.networkInterfaces();
export const ips = Object.keys(ifaces)
  .reduce(
    (acc, ifname) =>
      acc.concat(
        ifaces[ifname].map(iface => {
          if ("IPv4" !== iface.family || iface.internal !== false) {
            // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
            return;
          }
          return iface.address;
        })
      ),
    []
  )
  .filter(a => a);

const PORT = process.env.PORT || "8435";

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());

app.get("/", (req, res) => {
  res.sendStatus(200);
});

if (recordStore) {
  app.post("/end", (req, res) => {
    try {
      if (!saveToFile) {
        recordStore.ensureQueueEmpty();
      }
      res.sendStatus(200);
      process.exit(0);
    } catch (e) {
      res.sendStatus(400);
      console.error(e.message);
      process.exit(1);
    }
  });
}

let pending = false;
app.post("/", bodyParser.json(), async (req, res) => {
  if (!req.body) return res.sendStatus(400);
  let data = null,
    error = null;
  if (pending) {
    return res
      .status(400)
      .json({ error: "an exchange query was already pending" });
  }
  pending = true;
  try {
    const transport = await Transport.create(5000);
    try {
      data = await transport.exchange(Buffer.from(req.body.apduHex, "hex"));
    } finally {
      transport.close();
      if (saveToFile) {
        fs.writeFileSync(saveToFile, recordStore.toString());
      } else if (recordStore) {
        if (recordStore.isEmpty()) {
          process.exit(0);
        }
      }
    }
  } catch (e) {
    error = e.toString();
  }
  pending = false;
  const result = { data, error };
  if (data) {
    log("HTTP:", req.body.apduHex, "=>", data.toString("hex"));
  } else {
    log("HTTP:", req.body.apduHex, "=>", error);
  }
  res.json(result);
  if (error && error.name === "RecordStoreWrongAPDU") {
    console.error(error.message);
    process.exit(1);
  }
});

let wsIndex = 0;
let wsBusyIndex = 0;

wss.on("connection", ws => {
  const index = ++wsIndex;
  try {
    let transport, transportP;
    let destroyed = false;

    const onClose = async () => {
      if (destroyed) return;
      destroyed = true;
      if (wsBusyIndex === index) {
        log(`WS(${index}): close`);
        await transportP.then(transport => transport.close(), () => {});
        wsBusyIndex = 0;
      }
      if (saveToFile) {
        fs.writeFileSync(saveToFile, recordStore.toString());
      } else if (recordStore) {
        if (recordStore.isEmpty()) {
          process.exit(0);
        }
      }
    };

    ws.on("close", onClose);

    ws.on("message", async apduHex => {
      if (destroyed) return;

      if (apduHex === "open") {
        if (wsBusyIndex) {
          ws.send(
            JSON.stringify({
              error: "WebSocket is busy (previous session not closed)"
            })
          );
          ws.close();
          destroyed = true;
          return;
        }
        transportP = Transport.create(5000);
        wsBusyIndex = index;

        log(`WS(${index}): opening...`);
        try {
          transport = await transportP;
          transport.on("disconnect", () => ws.close());
          log(`WS(${index}): opened!`);
          ws.send(JSON.stringify({ type: "opened" }));
        } catch (e) {
          log(`WS(${index}): open failed! ${e}`);
          ws.send(
            JSON.stringify({
              error: e.message
            })
          );
          ws.close();
        }
        return;
      }

      if (wsBusyIndex !== index) {
        console.warn("ignoring message because busy transport");
        return;
      }

      if (!transport) {
        console.warn("received message before device was opened");
        return;
      }
      try {
        const res = await transport.exchange(Buffer.from(apduHex, "hex"));
        log(`WS(${index}): ${apduHex} => ${res.toString("hex")}`);
        if (destroyed) return;
        ws.send(
          JSON.stringify({ type: "response", data: res.toString("hex") })
        );
      } catch (e) {
        log(`WS(${index}): ${apduHex} =>`, e);
        if (destroyed) return;
        ws.send(JSON.stringify({ type: "error", error: e.message }));
        if (e.name === "RecordStoreWrongAPDU") {
          console.error(e.message);
          process.exit(1);
        }
      }
    });
  } catch (e) {
    ws.close();
  }
});

log(
  "DEVICE_PROXY_URL=" +
    ["localhost", ...ips].map(ip => `ws://${ip}:${PORT}`).join("|")
);

server.listen(PORT, () => {
  log(`\nNano S proxy started on ${ips[0]}\n`);
});
