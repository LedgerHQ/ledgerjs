import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  const [descriptor] = await TransportNodeHid.list();
  if (!descriptor) throw new Error("no device found");
  const transport = await TransportNodeHid.open(descriptor);
  let queue = [],
    unqueueRunning = false;
  async function unqueue() {
    if (unqueueRunning) return;
    unqueueRunning = true;
    try {
      while (queue.length) {
        const cmd = queue.shift();
        const res = await transport.exchange(cmd);
        console.log(res.toString("hex"));
      }
    } catch (e) {
      console.error("transport.exchange failed", e);
      process.exit(1);
    }
    unqueueRunning = false;
  }
  rl.on("line", input => {
    input.split("\n").forEach(line => queue.push(Buffer.from(line, "hex")));
    unqueue();
  });
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
