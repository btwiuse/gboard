import deploy from "gboard/dist/deploy.json";

const ADDRESS = {
  NODE: deploy.RPC_NODE ?? process.env.REACT_APP_NODE_ADDRESS as string,
};

const LOCAL_STORAGE = {
  ACCOUNT: "account",
};

export { ADDRESS, LOCAL_STORAGE };
