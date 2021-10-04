import Transport from '@ledgerhq/hw-transport';

/**
 * Solana API
 *
 * @example
 * import Solana from "@ledgerhq/hw-app-solana";
 * const solana = new Solana(transport)
 */
export default class Solana {
    constructor(private transport: Transport, scrambleKey = 'solana_default_scramble_key') {
        this.transport.decorateAppAPIMethods(
            this,
            ['getAddress', 'signTransaction', 'getAppConfiguration'],
            scrambleKey
        );
    }

    /**
     * Get address
     *
     * @param path a BIP32 path
     * @param display enable/sidable display
     * @returns string
     */
    getAddress(
        path: string,
        display?: boolean
    ): Promise<{
        publicKey: string;
        address: string;
    }> {
        return Promise.resolve({
            address: 'some solana address',
            publicKey: 'some solana pub key',
        });
    }

    signTransaction(path: string, txRaw: string): Promise<string> {
        return Promise.resolve('singed solana transaction');
    }

    getAppConfiguration() {}
}
