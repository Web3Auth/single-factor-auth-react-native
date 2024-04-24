import type {
  Auth0UserInfo,
  TorusSubVerifierInfo,
} from '@web3auth/single-factor-auth';

import {BUILD_ENV} from './constants';

export type BUILD_ENV_TYPE = (typeof BUILD_ENV)[keyof typeof BUILD_ENV];

export interface PasskeyServiceEndpoints {
  register: {
    options: string;
    verify: string;
  };
  authenticate: {
    options: string;
    verify: string;
  };
  crud: {
    list: string;
  };
}

export interface PasskeyExtraVerifierParams extends Record<string, string> {
  signature: string; // LOGIN
  clientDataJSON: string; // LOGIN
  authenticatorData: string; // LOGIN
  publicKey: string; // REGISTER
  challenge: string; // LOGIN
  rpId: string; // LOGIN/REGISTER
  credId: string; // LOGIN/REGISTER
}

export interface LoginParams {
  verifier: string;
  verifierId: string;
  idToken: string;
  subVerifierInfoArray?: TorusSubVerifierInfo[];
  // offset in seconds
  serverTimeOffset?: number;
  fallbackUserInfo?: Partial<Auth0UserInfo>;
  extraVerifierParams: PasskeyExtraVerifierParams;
}
type AuthenticatorAttachment = 'cross-platform' | 'platform';

export interface RegisterPasskeyParams {
  /**
   * The passkey in the user device will be saved with this name.
   */
  username: string;
  /**
   * Defaults to undefined.
   */
  authenticatorAttachment?: AuthenticatorAttachment;
}

export interface IPasskeysPluginOptions {
  buildEnv: BUILD_ENV_TYPE;

  passkeyEndpoints: PasskeyServiceEndpoints;

  verifier: string;

  metadataHost: string;

  serverTimeOffset: number;

  /**
   * Defaults to window.location.hostname
   */
  rpID: string;
  /**
   * Defaults to window.location.hostname
   */
  rpName: string;

  /**
   * Defaults to window.location.hostname
   */
  rpOrigin: string;
}
