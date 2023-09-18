import { BrowserStorage } from "@toruslabs/openlogin-utils";
import { CustomChainConfig, IProvider, SafeEventEmitterProvider, UserAuthInfo, WalletInitializationError, WalletLoginError } from "@web3auth/base";
import { IWeb3Auth, Web3Auth as SingleFactorAuth } from "@web3auth/single-factor-auth";

import KeyStore from "./session/KeyStore";
import { EncryptedStorage } from "./types/IEncryptedStorage";
import { SecureStore } from "./types/IExpoSecureStore";
import { LoginParams, PrivateKeyProvider, SdkInitOptions } from "./types/interface";

class Web3Auth implements IWeb3Auth {
  public ready = false;

  private keyStore: KeyStore;

  private params: SdkInitOptions;

  private sfaInstance: SingleFactorAuth;

  private privKeyProvider: IProvider | null = null;

  private storage: BrowserStorage;

  constructor(storage: SecureStore | EncryptedStorage, params: SdkInitOptions) {
    if (!params.clientId) {
      throw WalletInitializationError.invalidParams("clientId is required");
    }
    if (!params.web3AuthNetwork) params.web3AuthNetwork = "mainnet";
    if (typeof params.enableLogging === "undefined") params.enableLogging = false;
    if (typeof params.usePnPKey === "undefined") params.usePnPKey = false;
    if (typeof params.sessionTime === "undefined") params.sessionTime = 86400;
    this.params = params;
    this.keyStore = new KeyStore(storage);
    this.sfaInstance = new SingleFactorAuth(this.params);
  }

  get provider(): IProvider | null {
    return this.privKeyProvider;
  }

  get connected(): boolean {
    return Boolean(this.provider);
  }

  get sessionId(): string {
    return this.sfaInstance?.sessionId || "";
  }

  authenticateUser(): Promise<UserAuthInfo> {
    if (!this.ready) throw WalletInitializationError.notReady("Web3Auth not initialized, please call init first");
    return this.sfaInstance.authenticateUser();
  }

  addChain(chainConfig: CustomChainConfig): Promise<void> {
    if (!this.ready) throw WalletInitializationError.notReady("Web3Auth not initialized, please call init first");
    return this.sfaInstance.addChain(chainConfig);
  }

  switchChain(params: { chainId: string }): Promise<void> {
    if (!this.ready) throw WalletInitializationError.notReady("Web3Auth not initialized, please call init first");
    return this.sfaInstance.switchChain(params);
  }

  async init(provider: PrivateKeyProvider): Promise<void> {
    // this will return memory store instance as local and session storage won't be available in react native.
    this.storage = BrowserStorage.getInstance("sfa_store");
    const sessionId = await this.keyStore.get("sessionId");

    // set the sessionId in memory store so that sfaInstance can use it
    // and rehydrate the session.
    if (sessionId) this.storage.set("sessionId", sessionId);
    await this.sfaInstance.init(provider);

    // this means the user is logged in.
    if (this.sfaInstance.provider) this.privKeyProvider = this.sfaInstance.provider;
    this.ready = true;
  }

  async connect(params: LoginParams): Promise<SafeEventEmitterProvider> {
    if (!this.ready) throw WalletInitializationError.notReady("Web3Auth not initialized, please call init first");
    const provider = await this.sfaInstance.connect(params);

    // if we are here, then login is successful.
    this.privKeyProvider = provider;

    // store the sessionId in the keyStore.
    await this.keyStore.set("sessionId", this.sfaInstance.sessionId);
    return this.provider;
  }

  async logout(): Promise<void> {
    if (!this.ready) throw WalletInitializationError.notReady("Web3Auth not initialized, please call init first");
    if (!this.connected) throw WalletLoginError.userNotLoggedIn("user is not logged in.");
    await this.sfaInstance.logout();
    this.keyStore.remove("sessionId");
    this.privKeyProvider = null;
    this.ready = false;
  }
}

export default Web3Auth;
