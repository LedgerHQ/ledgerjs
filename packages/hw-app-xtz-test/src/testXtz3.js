import Xtz from "@ledgerhq/hw-app-xtz";

export default async transport => {
    const xtz = new Xtz(transport);
    // This contains a transaction between two tz1... addresses
    const result = await xtz.signOperation("44'/1729'/0'/0'", "030483b371215e04efe3ff5ff8481411b51698f2bba25d8fe550691fbf51c90a736b00cf49f66b9ea137e11818f2a78b4b6fc9895b4e50e90902904e00002bd63c99d6b449a2a64a8cb043a063f6e6140a625a7c0fec387d7e1d9a40ab9e6c00cf49f66b9ea137e11818f2a78b4b6fc9895b4e50a20903c35000c0c393070000cf49f66b9ea137e11818f2a78b4b6fc9895b4e5000", 3);
    return result;
};
