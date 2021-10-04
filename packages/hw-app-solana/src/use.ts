import SpeculosTransport from '@ledgerhq/hw-transport-node-speculos';
import Solana from './Solana';

const SPECULOS_APDU_PORT = 9999;

(async () => {
    const speculosTransport = await SpeculosTransport.open({ apduPort: SPECULOS_APDU_PORT });
    try {
        const solana = new Solana(speculosTransport);

        const appConfig = await solana.getAppConfiguration();
        console.log(appConfig);
    } finally {
        speculosTransport.close();
    }
})();
