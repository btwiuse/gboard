import { useAccount, useApi } from "@gear-js/react-hooks";
import { useEffect, useState } from "react";
import deploy from "gboard/dist/deploy.json";
import { metaWasm } from "gboard/dist/index";
import "./Home.css";

import {
  decodeAddress,
  GearApi,
  GearKeyring,
  getWasmMetadata,
} from "@gear-js/api";

function stateString(state: boolean): string {
  return state ? "on" : "off";
}

function Home() {
  let { api, isApiReady } = useApi();
  let [state, setState] = useState("unknown");
  let [disabled, setDisabled] = useState(true);

  useEffect(() => {
    if (!isApiReady) return;
    async function init() {
      let query = { "Status": null };
      console.log({ programId: deploy.programId, metaWasm, query });
      const result = await api.programState.read(
        deploy.programId as `0x${string}`,
        Buffer.from(metaWasm),
        query,
      );
      console.log("init:", result.toHuman());
      let initState = stateString((result.toHuman() as any).StatusOf);
      console.log("setting state to:", initState);
      setState(initState);
    }
    async function sub() {
      let unsub = api.gearEvents.subscribeToGearEvent(
        "MessagesDispatched",
        async ({ index, data }) => {
          console.log(
            new Date(),
            "MessagesDispatched",
          );

          if ((data?.stateChanges.toJSON() as any).includes(deploy.programId)) {
            let query = { "Status": null };

            const result = await api.programState.read(
              deploy.programId as `0x${string}`,
              Buffer.from(metaWasm),
              query,
            );

            console.log("program state changed:", result.toHuman());
            let currentState = stateString((result.toHuman() as any).StatusOf);
            console.log("setting state to:", currentState);
            setState(currentState);
            setDisabled(false);
          }
        },
      );
    }
    init().then(sub).then(() => setDisabled(false));
  }, [isApiReady]);

  let toggle = async () => {
    const meta = await getWasmMetadata(Buffer.from(metaWasm));
    const payload = { Toggle: null };
    const alice = await GearKeyring.fromSuri("//Alice");
    const aliceHex = decodeAddress(alice.address);

    const gas = await api.program.calculateGas.handle(
      aliceHex,
      deploy.programId as `0x${string}`,
      payload,
      0,
      true,
      meta,
    );
    console.log(`GasLimit: ${gas}\n`);

    const msg = {
      destination: deploy.programId as `0x${string}`,
      payload,
      gasLimit: gas.min_limit,
      value: 0,
    };

    console.log(msg);

    const tx = api.message.send(msg, meta);

    setDisabled(true);
    await new Promise((resolve, reject) => {
      tx.signAndSend(alice, ({ events, status }) => {
        console.log(`STATUS: ${status.toString()}`);
        if (status.isFinalized) {
          resolve(status.asFinalized);
        }
        events.forEach(({ event }) => {
          if (event.method === "ExtrinsicFailed") {
            reject(api.getExtrinsicFailedError(event).docs.join("\n"));
          }
        });
      });
    });
  };

  return (
    <div className="home">
      <button onClick={toggle} disabled={disabled}>
        Current State: {state}
      </button>
    </div>
  );
}

export { Home };
