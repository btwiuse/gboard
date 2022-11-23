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
  return state ? "set (black)" : "clear (white)";
}

function Home() {
  let { api, isApiReady } = useApi();
  let [initialized, setInitialized] = useState(false);
  let [state, setState] = useState(Array(401).fill(false));
  let [disabled, setDisabled] = useState(Array(401).fill(true));

  useEffect(() => {
    if (!isApiReady) return;
    async function init() {
      let query = { "DumpAll": null };
      console.log({ programId: deploy.programId, metaWasm, query });
      const result = await api.programState.read(
        deploy.programId as `0x${string}`,
        Buffer.from(metaWasm),
        query,
      );
      console.log("init:", result.toHuman());
      let initState = (result.toHuman() as any).All;
      console.log("setting state to:", initState);
      setState((old) => {
        for (let i = 1; i <= 400; i++) {
          let td = document.getElementById(`td${i}`)!;
          td.className = initState[i] ? "cell-set" : "cell-clear";
        }
        return initState;
      });
      setInitialized(true);
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
            let query = { "DumpAll": null };

            const result = await api.programState.read(
              deploy.programId as `0x${string}`,
              Buffer.from(metaWasm),
              query,
            );

            console.log("program state changed:", result.toHuman());
            let currentState = (result.toHuman() as any).All;
            console.log("setting state to:", currentState);
            setState((old) => {
              for (let i = 1; i <= 400; i++) {
                let td = document.getElementById(`td${i}`)!;
                // if (td.className != "cell-unknown") {
                td.className = currentState[i] ? "cell-set" : "cell-clear";
                // }
              }
              return currentState;
            });
            setDisabled((old) => {
              // old[0] = false;
              return old.map(() => false);
            });
          }
        },
      );
    }
    init().then(sub).then(() =>
      setDisabled((old) => {
        // old[0] = false;
        return old.map(() => false);
      })
    );
  }, [isApiReady]);

  let toggle = async (n: number, td?: HTMLElement) => {
    setDisabled((old) => {
      console.log("disabling", n);
      old[n] = true;
      return old;
    });

    const originalClassName = td?.className;
    const meta = await getWasmMetadata(Buffer.from(metaWasm));
    const payload = { TogglePixel: n };
    const alice = await GearKeyring.fromSuri("//Alice");
    const aliceHex = decodeAddress(alice.address);

    if (td) {
      td.className = "cell-unknown";
    }

    let gasLimit;

    const gas = await api.program.calculateGas.handle(
      aliceHex,
      deploy.programId as `0x${string}`,
      payload,
      0,
      true,
      meta,
    );
    gasLimit = gas.min_limit;
    console.log(`GasLimit: ${gas}\n`);

    const msg = {
      destination: deploy.programId as `0x${string}`,
      payload,
      gasLimit,
      value: 0,
    };

    console.log(msg);

    let tx = api.message.send(msg, meta);

    await (new Promise((resolve, reject) => {
      tx.signAndSend(alice, ({ events, status }) => {
        console.log(`STATUS: ${status.toString()}`);
        if (status.isInBlock) {
          resolve(status.asInBlock);
        }
        if (status.isFinalized) {
          resolve(status.asFinalized);
        }
        events.forEach(({ event }) => {
          if (event.method === "ExtrinsicFailed") {
            if (td) {
              td.className = originalClassName!;
            }
            reject(api.getExtrinsicFailedError(event).docs.join("\n"));
          }
        });
      });
    }));
    /*
    try {
    } catch (e) {
      if (td) {
        td.className = originalClassName!;
      }
    } finally {
      let query = { "Pixel": n };
      console.log({ programId: deploy.programId, metaWasm, query });
      const result = await api.programState.read(
        deploy.programId as `0x${string}`,
        Buffer.from(metaWasm),
        query,
      );
      console.log(`Pixel(${n}):`, result.toHuman());
      let pxState = (result.toHuman() as any).StatusOf;
      console.log("setting state to:", pxState);
      // setState((old) => { old[n] = pxState; return old; });
      let td = document.getElementById(`td${n}`)!;
      td.className = pxState ? "cell-set" : "cell-clear";
    }
    */
  };

  let colorNegate = async (n: number, td: HTMLElement) => {
    // td.className = "cell-unknown";
    await toggle(n, td);
  };

  let fill = (rows: number, cols: number) => {
    let onClick = (n: number) => (e: any) => {
      console.log(n);
      colorNegate(n, e.target);
    };
    return (
      <tbody>
        {Array(rows).fill(0).map((r, i) => (
          <tr key={`tr${i}`}>
            {Array(cols).fill(0).map((c, j) => (
              <td
                className={"cell-unknown"}
                id={`td${i * cols + j + 1}`}
                key={`td${i * cols + j + 1}`}
                onClick={onClick(i * cols + j + 1)}
              >
                {i * cols + j + 1}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  };

  return (
    <div className="home">
      Pixel 0:{" "}
      <button
        onClick={() => toggle(0)}
        disabled={disabled[0]}
        className={initialized
          ? disabled[0]
            ? "button-disabled"
            : (state[0] ? "button-set" : "button-clear")
          : ""}
      >
        {state[0] ? "(set)" : "(clear)"}
      </button>
      <table id="grid">
        {fill(16, 25)}
      </table>
    </div>
  );
}

export { Home };
