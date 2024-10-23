/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrowserStorage, OpenloginUserInfo } from "@toruslabs/openlogin-utils";
import { CustomChainConfig, IProvider, UserAuthInfo, WalletInitializationError, WalletLoginError } from "@web3auth/base";
import { type IPlugin } from "@web3auth/base-plugin";
import {
  ADAPTER_STATUS,
  ADAPTER_STATUS_TYPE,
  IFinalizeLoginParams,
  IWeb3Auth,
  SessionData,
  Web3Auth as SingleFactorAuth,
  Web3AuthOptions,
} from "@web3auth/single-factor-auth";

import KeyStore from "./session/KeyStore";
import { EncryptedStorage } from "./types/IEncryptedStorage";
import { SecureStore } from "./types/IExpoSecureStore";
import { LoginParams, PrivateKeyProvider, SdkInitOptions } from "./types/interface";

class Web3Auth implements IWeb3Auth {
  options: Web3AuthOptions;

  torusPrivKey: string;

  public ready = false;

  private keyStore: KeyStore;

  private params: SdkInitOptions;

  private sfaInstance: SingleFactorAuth;

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
    return this.sfaInstance?.provider;
  }

  get connected(): boolean {
    return Boolean(this.sessionId);
  }

  get sessionId(): string {
    return this.sfaInstance?.sessionId || "";
  }

  get status(): ADAPTER_STATUS_TYPE {
    if (this.ready && !this.connected) return ADAPTER_STATUS.READY;
    if (this.connected) return ADAPTER_STATUS.CONNECTED;
    return ADAPTER_STATUS.NOT_READY;
  }

  get state(): SessionData {
    return this.sfaInstance.state;
  }

  finalizeLogin(_params: IFinalizeLoginParams): Promise<void> {
    throw new Error("Method not implemented.");
  }

  emit(_type: string, ..._args: any[]): boolean {
    throw new Error("Method not implemented.");
  }

  addListener(_eventName: string | symbol, _listener: (...args: any[]) => void): this {
    throw new Error("Method not implemented.");
  }

  on(_eventName: string | symbol, _listener: (...args: any[]) => void): this {
    throw new Error("Method not implemented.");
  }

  once(_eventName: string | symbol, _listener: (...args: any[]) => void): this {
    throw new Error("Method not implemented.");
  }

  removeListener(_eventName: string | symbol, _listener: (...args: any[]) => void): this {
    throw new Error("Method not implemented.");
  }

  off(_eventName: string | symbol, _listener: (...args: any[]) => void): this {
    throw new Error("Method not implemented.");
  }

  removeAllListeners(_event?: string | symbol): this {
    throw new Error("Method not implemented.");
  }

  setMaxListeners(_n: number): this {
    throw new Error("Method not implemented.");
  }

  getMaxListeners(): number {
    throw new Error("Method not implemented.");
  }

  listeners(_eventName: string | symbol): Function[] {
    throw new Error("Method not implemented.");
  }

  rawListeners(_eventName: string | symbol): Function[] {
    throw new Error("Method not implemented.");
  }

  listenerCount(_eventName: string | symbol, _listener?: Function): number {
    throw new Error("Method not implemented.");
  }

  prependListener(_eventName: string | symbol, _listener: (...args: any[]) => void): this {
    throw new Error("Method not implemented.");
  }

  prependOnceListener(_eventName: string | symbol, _listener: (...args: any[]) => void): this {
    throw new Error("Method not implemented.");
  }

  eventNames(): (string | symbol)[] {
    throw new Error("Method not implemented.");
  }

  authenticateUser(): Promise<UserAuthInfo> {
    if (!this.ready) throw WalletInitializationError.notReady("Web3Auth not initialized, please call init first");
    return this.sfaInstance.authenticateUser();
  }

  addChain(chainConfig: CustomChainConfig): Promise<void> {
    if (!this.ready) throw WalletInitializationError.notReady("Web3Auth not initialized, please call init first");
    return this.sfaInstance.addChain(chainConfig);
  }

  addPlugin(plugin: IPlugin): IWeb3Auth {
    return this.sfaInstance.addPlugin(plugin);
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

    this.ready = true;
  }

  async connect(params: LoginParams): Promise<IProvider> {
    if (!this.ready) throw WalletInitializationError.notReady("Web3Auth not initialized, please call init first");
    const provider = await this.sfaInstance.connect(params);

    // store the sessionId in the keyStore.
    await this.keyStore.set("sessionId", this.sfaInstance.sessionId);
    return provider;
  }

  async logout(): Promise<void> {
    if (!this.ready) throw WalletInitializationError.notReady("Web3Auth not initialized, please call init first");
    if (!this.connected) throw WalletLoginError.userNotLoggedIn("user is not logged in.");
    await this.sfaInstance.logout();
    this.keyStore.remove("sessionId");
    this.ready = false;
  }

  getUserInfo(): Promise<OpenloginUserInfo> {
    return this.sfaInstance.getUserInfo();
  }
}

export default Web3Auth;
