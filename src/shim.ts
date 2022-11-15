import { useEffect, useState } from "react";
import type {
  InjectedAccountWithMeta,
  InjectedExtension,
} from "@polkadot/extension-inject/types";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";
import { useAccount, useAlert, useApi } from "@gear-js/react-hooks";
import { UnsubscribePromise } from "@polkadot/api/types";

function useAccounts() {
  const { isApiReady } = useApi();
  const alert = useAlert();

  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>();
  const [isExtensionReady, setIsExtensionReady] = useState(false);

  const getAccounts = (
    extensions: InjectedExtension[],
  ) => (extensions.length > 0 ? web3Accounts() : undefined);

  useEffect(() => {
    if (isApiReady) {
      web3Enable("Gear App")
        .then(getAccounts)
        .then(setAccounts)
        .catch(({ message }: Error) => alert.error(message))
        .finally(() => setIsExtensionReady(true));
    }
  }, [isApiReady, alert]);

  return { accounts, isExtensionReady };
}

function useLoggedInAccount() {
  const { switchAccount } = useAccount();
  const { accounts, isExtensionReady } = useAccounts();

  const [isLoginReady, setIsLoginReady] = useState(false);

  const isLoggedIn = ({ address }: InjectedAccountWithMeta) =>
    localStorage.account === address;
  const setLoginReady = () => setIsLoginReady(true);

  useEffect(() => {
    if (isExtensionReady) {
      const loggedInAccount = accounts?.find(isLoggedIn);

      if (loggedInAccount) {
        switchAccount(loggedInAccount).finally(setLoginReady);
      } else setLoginReady();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExtensionReady]);

  return { isLoginReady };
}

function useBalanceSubscription() {
  const { api } = useApi();
  const { account } = useAccount();

  const { address } = account || {};

  useEffect(() => {
    let unsub: UnsubscribePromise | undefined;

    return () => {
      if (unsub) unsub.then((callback) => callback());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, address]);
}

export { useAccounts, useBalanceSubscription, useLoggedInAccount };
