import SpeculosTransport from "@ledgerhq/hw-transport-node-speculos";
import Solana from "../src/Solana";

const SPECULOS_APDU_PORT = 9999;

(async () => {
    const speculosTransport = await SpeculosTransport.open({
        apduPort: SPECULOS_APDU_PORT,
    });
    try {
        const solana = new Solana(speculosTransport);

        const appConfig = await solana.getAppConfiguration();
        console.log(appConfig);

        const address = await solana.getAddress("44'/501'/0'/0'/0'");
        console.log(address);

        const txBuffer = Buffer.from(
            "010001035eb9862fe23e544a2a0969cc157cb31fd72901cc2824d536a67fb8ee911e02363b9ba3a2ebaf40c1cd672a80a8e1932b982cca8264be33c39359701e113c3da20000000000000000000000000000000000000000000000000000000000000000030303030303030303030303030303030303030303030303030303030303030301020200010c020000002a00000000000000",
            "hex"
        );
        console.log("Please approve the transaction on speculos");
        const txSignature = await solana.signTransaction("44'/501'", txBuffer);
        console.log(txSignature.signature.toString("hex"));
    } catch (e) {
        console.error(e);
    } finally {
        speculosTransport.close();
    }
})();
