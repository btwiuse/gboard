import { useAccount, useApi } from "@gear-js/react-hooks";
import { Routing } from "pages";
import { ApiLoader, Footer, Header } from "components";
import { withProviders } from "hocs";
import "App.scss";

function Component() {
  const { isApiReady } = useApi();
  const { isAccountReady } = useAccount();

  const isAppReady = isApiReady && isAccountReady;

  return (
    <>
      <Header isAccountVisible={isAccountReady} />
      <main>{true || isAppReady ? <Routing /> : <ApiLoader />}</main>
      <Footer />
    </>
  );
}

export const App = withProviders(Component);
