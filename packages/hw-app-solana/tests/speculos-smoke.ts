import SpeculosTransport from "@ledgerhq/hw-transport-node-speculos";
import Solana from "../src/Solana";

import { Observable } from "rxjs";
import { share, filter, take, timeout } from "rxjs/operators";

import http from "http";

const SPECULOS_APDU_PORT = 9999;
const SPECULOS_REST_API_ENDPOINT = "http://0.0.0.0:5000";

(async () => {
    const speculosTransport = await SpeculosTransport.open({
        apduPort: SPECULOS_APDU_PORT,
    });

    const displayStates = speculosDisplayStates().pipe(share());
    const keepAliveDisplayStates = displayStates.subscribe(() => {});
    const waitDisplayText = speculosDisplayTextWaiter(displayStates);

    try {
        const solana = new Solana(speculosTransport);

        // app config
        const appConfig = await solana.getAppConfiguration();
        console.log("app config", appConfig);

        // address
        const addressResult = await solana.getAddress("44'/501'/0'/0'/0'");
        console.log("address", {
            address: addressResult.address.toString("hex"),
        });

        // sign trancastion
        const txBuffer = Buffer.from(
            "010001035eb9862fe23e544a2a0969cc157cb31fd72901cc2824d536a67fb8ee911e02363b9ba3a2ebaf40c1cd672a80a8e1932b982cca8264be33c39359701e113c3da20000000000000000000000000000000000000000000000000000000000000000030303030303030303030303030303030303030303030303030303030303030301020200010c020000002a00000000000000",
            "hex"
        );
        const signaturePromise = solana.signTransaction("44'/501'", txBuffer);

        await waitDisplayText("Transfer");

        await pressSpeculosButtons(["right", 4], "both");

        const signatureResult = await signaturePromise;

        console.log("sign transaction", {
            signature: signatureResult.signature.toString("hex"),
        });
    } catch (e) {
        console.error(e);
    } finally {
        speculosTransport.close();
        keepAliveDisplayStates.unsubscribe();
    }
})();

function speculosDisplayTextWaiter(
    speculosStates: Observable<SpeculosDisplayState>
) {
    return (text: string) => {
        console.log(`Waiting for display text: ${text}...`);
        return speculosStates
            .pipe(
                filter((state) => state.text === text),
                take(1),
                timeout(10 * 1000)
            )
            .toPromise();
    };
}

type Button = "left" | "right" | "both";

function pressSpeculosButton(button: Button) {
    const payload = {
        action: "press-and-release",
    };

    const data = new TextEncoder().encode(JSON.stringify(payload));

    return new Promise<void>((resolve, reject) => {
        const req = http.request(
            `${SPECULOS_REST_API_ENDPOINT}/button/${button}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": data.length,
                },
            },
            (res) => {
                return res.statusCode === 200 ? resolve() : reject(res);
            }
        );

        req.write(data);
        req.end();
    });
}

async function pressSpeculosButtons(...buttons: ([Button, number] | Button)[]) {
    for (const buttonSpec of buttons) {
        const [button, times] =
            typeof buttonSpec === "string" ? [buttonSpec, 1] : buttonSpec;
        for (const _ of Array(times).keys()) {
            await pressSpeculosButton(button);
        }
    }
}

function speculosDisplayStates(): Observable<SpeculosDisplayState> {
    return new Observable((subsriber) => {
        const req = http.request(
            `${SPECULOS_REST_API_ENDPOINT}/events?stream=true`,
            (res) => {
                res.setEncoding("utf8");
                res.on("data", (eventData: string) => {
                    for (const line of eventData
                        .split("\n")
                        .filter((line) => line.length > 0)) {
                        // prefix is: "data: "
                        const event = JSON.parse(
                            line.substring(6)
                        ) as SpeculosDisplayState;
                        subsriber.next(event);
                    }
                });
            }
        );

        req.end();

        return () => {
            req.destroy();
        };
    });
}

type SpeculosDisplayState = {
    text: string;
    x: number;
    y: number;
};
