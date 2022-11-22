import { useAccount, useApi } from "@gear-js/react-hooks";
import { useEffect, useState } from "react";
import deploy from "gboard/dist/deploy.json";
import { metaWasm } from "gboard/dist/index";

function stateString(state: boolean): string {
  return state ? "on" : "off";
}

function Home() {
  let { api, isApiReady } = useApi();
  let [state, setState] = useState("unknown");

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
          }
        },
      );
    }
    init().then(sub);
  }, [isApiReady]);

  return <div>Current State: {state}</div>;
}

export { Home };
