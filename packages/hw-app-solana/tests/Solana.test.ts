import {
    openTransportReplayer,
    RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Solana from "../src/Solana";

test("getAppConfiguration", async () => {
    const transport = await openTransportReplayer(
        RecordStore.fromString(`
            => e004000000
            <= 00000100069000
        `)
    );
    const solana = new Solana(transport);
    const result = await solana.getAppConfiguration();
    expect(result).toEqual({ version: "1.0.6" });
});

test("getAddress", async () => {
    const transport = await openTransportReplayer(
        RecordStore.fromString(`
            => e005000015058000002c800001f5800000008000000080000000
            <= 4d65a10662b9759d62bb59048366705454654cf4f9b4b3525cf314429e46c6919000
        `)
    );
    const solana = new Solana(transport);
    const result = await solana.getAddress("44'/501'/0'/0'/0'", false);
    //TODO: add true to confirm
    expect(result).toEqual({
        address: "b618MxXG8ALdrfbQsUihobzfbQkgvkXzAiRL4RazWYEga89j5",
    });
});

test("signTransaction", async () => {
    const transport = await openTransportReplayer(
        RecordStore.fromString(`
    => e0060100a001028000002c800001f5010001035eb9862fe23e544a2a0969cc157cb31fd72901cc2824d536a67fb8ee911e02363b9ba3a2ebaf40c1cd672a80a8e1932b982cca8264be33c39359701e113c3da20000000000000000000000000000000000000000000000000000000000000000030303030303030303030303030303030303030303030303030303030303030301020200010c020000002a00000000000000
    <= 1ad0702faddc8b2072c59547637c10e6affad2f186b69cf3288f2b029de2e309e1d73b73eb925a79f7b0d026ee07203d714e15807267001fbd3914de76a5490e9000
    `)
    );
    const solana = new Solana(transport);
    const transaction = Buffer.from(
        "010001035eb9862fe23e544a2a0969cc157cb31fd72901cc2824d536a67fb8ee911e02363b9ba3a2ebaf40c1cd672a80a8e1932b982cca8264be33c39359701e113c3da20000000000000000000000000000000000000000000000000000000000000000030303030303030303030303030303030303030303030303030303030303030301020200010c020000002a00000000000000",
        "hex"
    );
    const { signature } = await solana.signTransaction("44'/501'", transaction);
    const result = signature.toString("hex");
    expect(result).toEqual(
        "1ad0702faddc8b2072c59547637c10e6affad2f186b69cf3288f2b029de2e309e1d73b73eb925a79f7b0d026ee07203d714e15807267001fbd3914de76a5490e"
    );
});
