import Xtz from "@ledgerhq/hw-app-xtz";

export default async transport => {
    const xtz = new Xtz(transport);
    const result = await xtz.signOperation("44'/1729'/0'/0'", "0300354b1dfdc830860c41a95edad8716489dbff9476740810aca72f36609518be6b01dc643afacb230f5bfab1b5faced897ac90a47ce3ea0902904e000102034101d95a367721422fdac1cea3a0a4e89046aba5ab387c8fadfc77d2bb39246c01dc643afacb230f5bfab1b5faced897ac90a47ce3a20903c35000c0c393070001dc643afacb230f5bfab1b5faced897ac90a47ce300", 1);
    return result;
};
