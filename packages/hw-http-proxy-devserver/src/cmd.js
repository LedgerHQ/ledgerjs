import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import http from "http";
import express from "express";
import cors from "cors";
import WebSocket from "ws";
import bodyParser from "body-parser";
import os from "os";

const ifaces = os.networkInterfaces();
const ips = Object.keys(ifaces)
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
    const transport = await TransportNodeHid.create(5000);
    try {
      data = await transport.exchange(Buffer.from(req.body.apduHex, "hex"));
    } finally {
      transport.close();
    }
  } catch (e) {
    error = e.toString();
  }
  pending = false;
  const result = { data, error };
  if (data) {
    console.log("HTTP:", req.body.apduHex, "=>", data.toString("hex"));
  } else {
    console.log("HTTP:", req.body.apduHex, "=>", error);
  }
  res.json(result);
});

let wsIndex = 0;
wss.on("connection", ws => {
  const index = ++wsIndex;
  try {
    let transportP;
    let transport;
    let destroyed = false;

    ws.on("close", () => {
      destroyed = true;
      if (transportP) {
        transportP.then(transport => transport.close());
        console.log(`WS(${index}): close`);
      }
    });

    ws.on("message", async apduHex => {
      if (apduHex === "open") {
        console.log(`WS(${index}): opening...`);
        transportP = TransportNodeHid.create(5000);
        if (destroyed) return;
        transport = await transportP;
        transport.on("disconnect", () => ws.close());
        console.log(`WS(${index}): opened!`);
        ws.send(JSON.stringify({ type: "opened" }));
        return;
      }
      if (!transport) {
        console.warn("received message before device was opened");
        return;
      }
      try {
        const res = await transport.exchange(Buffer.from(apduHex, "hex"));
        console.log(`WS(${index}): ${apduHex} => ${res.toString("hex")}`);
        if (destroyed) return;
        ws.send(
          JSON.stringify({ type: "response", data: res.toString("hex") })
        );
      } catch (e) {
        console.log(`WS(${index}): ${apduHex} =>`, e);
        if (destroyed) return;
        ws.send(JSON.stringify({ type: "error", error: e.message }));
      }
    });
  } catch (e) {
    ws.close();
  }
});

server.listen(PORT, () => {
  console.log("hw-transport-http-proxy-debug listening on " + PORT + "...");
  console.log(
    "DEBUG_COMM_HTTP_PROXY=" +
      ["localhost", ...ips].map(ip => `ws://${ip}:${PORT}`).join("|")
  );
});
