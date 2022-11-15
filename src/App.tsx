import { useApi } from "@gear-js/react-hooks";
import { useBalanceSubscription, useLoggedInAccount } from "shim";
import { Routing } from "pages";
import { ApiLoader, Footer, Header } from "components";
import { withProviders } from "hocs";
import "App.scss";

function Component() {
  const { isApiReady } = useApi();
  const { isLoginReady } = useLoggedInAccount();

  useBalanceSubscription();

  return (
    <>
      <Header isAccountVisible={isLoginReady} />
      <main>{isApiReady && isLoginReady ? <Routing /> : <ApiLoader />}</main>
      <Footer />
    </>
  );
}

export const App = withProviders(Component);
