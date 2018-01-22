import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

var app = express();

const PORT = process.env.PORT || 8435;

TransportNodeHid.create(5000, process.env.DEBUG || false).then(
  transport => {
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
        data = await transport.exchange(Buffer.from(req.body.apduHex, "hex"));
      } catch (e) {
        error = e.toString();
      }
      pending = false;
      const result = { data, error };
      if (data) {
        console.log("APDU:", req.body.apduHex, "=>", data.toString("hex"));
      } else {
        console.log("APDU failed:", req.body.apduHex, "=>", error);
      }
      res.json(result);
    });

    app.listen(PORT, () => {
      console.log("hw-transport-http-proxy-debug listening on " + PORT + "...");
    });
  },
  e => {
    console.error(e);
    process.exit(1);
  }
);
