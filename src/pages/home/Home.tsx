import { useAccount, useApi } from "@gear-js/react-hooks";
import { useEffect, useState } from "react";
import deploy from "gboard/dist/deploy.json";
import { metaWasm } from "gboard/dist/index";

function Home() {
  let { api, isApiReady } = useApi();
  let [state, setState] = useState(false);

  useEffect(() => {
    async function sub() {
      await api.isReady;
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
            let currentState = (result.toHuman() as any).StatusOf;
            console.log("setting state to:", currentState);
            setState(currentState);
          }
        },
      );
    }
    sub();
  }, []);

  return <div>Current State: {state ? "on" : "off"}</div>;
}

export { Home };
