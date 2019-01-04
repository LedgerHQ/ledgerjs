import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import AppAda from "@ledgerhq/hw-app-ada";

async function example() {
  const transport = await TransportNodeHid.create(5000);
  transport.setDebugMode(true);
  const appAda = new AppAda(transport);

  // console.log(
  //   await appAda.getExtendedPublicKey([
  //     0x80000000 + 44,
  //     0x80000000 + 1815,
  //     0x80000000 + 1
  //   ])
  // );

  console.log(await appAda.getVersion());
}

example();
