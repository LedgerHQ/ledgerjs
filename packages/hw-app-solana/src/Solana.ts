import Transport, { TransportError } from "@ledgerhq/hw-transport";

import BIPPath from "bip32-path";
import bs58check from "bs58check";

const P1_NON_CONFIRM = 0x00;
const P1_CONFIRM = 0x01;

const P2_EXTEND = 0x01;
const P2_MORE = 0x02;

const MAX_PAYLOAD = 255;

const LEDGER_CLA = 0xe0;

const INS = {
    GET_VERSION: 0x04,
    GET_ADDR: 0x05,
    SIGN: 0x06,
};

const HARDENED_MIN = 0x80000000;

/**
 * Solana API
 *
 * @example
 * import Solana from "@ledgerhq/hw-app-solana";
 * const solana = new Solana(transport)
 */
export default class Solana {
    constructor(
        private transport: Transport,
        scrambleKey = "solana_default_scramble_key"
    ) {
        this.transport.decorateAppAPIMethods(
            this,
            ["getAddress", "signTransaction", "getAppConfiguration"],
            scrambleKey
        );
    }

    /**
     * Get address
     *
     * @param path a BIP32 path
     * @param display should display or not
     * @returns string
     */
    async getAddress(
        path: string,
        display: boolean = false
    ): Promise<{
        address: string;
    }> {
        const pathBuffer = this.pathToBuffer(path);

        const addressBuffer = await this.sendToDevice(
            INS.GET_ADDR,
            display ? P1_CONFIRM : P1_NON_CONFIRM,
            pathBuffer
        );

        return {
            address: bs58check.encode(addressBuffer),
        };
    }

    async signTransaction(
        path: string,
        txBuffer: Buffer
    ): Promise<{
        signature: Buffer;
    }> {
        const pathBuffer = this.pathToBuffer(path);
        // Ledger app supports only a single derivation path per call ATM
        const pathsCountBuffer = Buffer.alloc(1);
        pathsCountBuffer.writeUInt8(1, 0);

        const payload = Buffer.concat([pathsCountBuffer, pathBuffer, txBuffer]);

        const signatureBuffer = await this.sendToDevice(
            INS.SIGN,
            P1_CONFIRM,
            payload
        );

        return {
            signature: signatureBuffer,
        };
    }

    async getAppConfiguration(): Promise<{
        version: string;
    }> {
        const [, , major, minor, patch] = await this.sendToDevice(
            INS.GET_VERSION,
            P1_NON_CONFIRM,
            Buffer.alloc(0)
        );
        return {
            version: `${major}.${minor}.${patch}`,
        };
    }

    private pathToBuffer(path: string) {
        const pathNums: number[] = BIPPath.fromString(path).toPathArray();
        if (pathNums.some((num) => num < HARDENED_MIN)) {
            throw new Error("All path indices must be hardened");
        }
        return this.serializePath(pathNums);
    }

    private serializePath(path: number[]) {
        const buf = Buffer.alloc(1 + path.length * 4);
        buf.writeUInt8(path.length, 0);
        for (const [i, num] of path.entries()) {
            buf.writeUInt32BE(num, 1 + i * 4);
        }
        return buf;
    }
    /*
     * Helper for chunked send of large payloads
     */
    private async sendToDevice(
        instruction: number,
        p1: number,
        payload: Buffer
    ) {
        let p2 = 0;
        let payload_offset = 0;

        if (payload.length > MAX_PAYLOAD) {
            while (payload.length - payload_offset > MAX_PAYLOAD) {
                const buf = payload.slice(
                    payload_offset,
                    payload_offset + MAX_PAYLOAD
                );
                payload_offset += MAX_PAYLOAD;
                // console.log( "send", (p2 | P2_MORE).toString(16), buf.length.toString(16), buf);
                const reply = await this.transport.send(
                    LEDGER_CLA,
                    instruction,
                    p1,
                    p2 | P2_MORE,
                    buf
                );
                if (reply.length != 2) {
                    throw new TransportError(
                        "sendToDevice: Received unexpected reply payload",
                        "UnexpectedReplyPayload"
                    );
                }
                p2 |= P2_EXTEND;
            }
        }

        const buf = payload.slice(payload_offset);
        // console.log("send", p2.toString(16), buf.length.toString(16), buf);
        const reply = await this.transport.send(
            LEDGER_CLA,
            instruction,
            p1,
            p2,
            buf
        );

        return reply.slice(0, reply.length - 2);
    }
}
