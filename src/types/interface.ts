import type { LoginParams, Web3AuthOptions, SessionData, PrivateKeyProvider } from "@web3auth/single-factor-auth";


export type State = SessionData;

export { LoginParams, SessionData, PrivateKeyProvider };
  
export type SdkInitOptions = Omit<Web3AuthOptions, "storageKey" | "storageServerUrl">;