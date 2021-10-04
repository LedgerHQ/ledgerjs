import { openTransportReplayer, RecordStore } from '@ledgerhq/hw-transport-mocker';

import Solana from '../src/Solana';

test('getAppConfiguration', async () => {
    const transport = await openTransportReplayer(
        RecordStore.fromString(`
            => e006000000
            <= 010101069000
        `)
    );

    const solana = new Solana(transport);
    const result = await solana.getAppConfiguration();

    expect(result).toEqual({
        version: '1.0.7',
    });
});
