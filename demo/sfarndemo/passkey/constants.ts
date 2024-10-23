import {
  OPENLOGIN_NETWORK,
  type OPENLOGIN_NETWORK_TYPE,
} from '@toruslabs/openlogin-utils';

import {BUILD_ENV_TYPE} from './interfaces';

export const BUILD_ENV = {
  LOCAL: 'local',
  PRODUCTION: 'production',
  DEVELOPMENT: 'development',
} as const;

export const PASSKEY_SVC_URL: Record<BUILD_ENV_TYPE, string> = {
  [BUILD_ENV.LOCAL]: 'http://localhost:3041',
  [BUILD_ENV.DEVELOPMENT]: 'https://api-develop-passwordless.web3auth.io',
  [BUILD_ENV.PRODUCTION]: 'https://api-passwordless.web3auth.io',
};

export const PASSKEYS_VERIFIER_MAP: Record<OPENLOGIN_NETWORK_TYPE, string> = {
  [OPENLOGIN_NETWORK.MAINNET]: 'passkeys-legacy-mainnet',
  [OPENLOGIN_NETWORK.TESTNET]: 'passkeys-legacy-testnet',
  [OPENLOGIN_NETWORK.AQUA]: 'passkeys-aqua',
  [OPENLOGIN_NETWORK.CYAN]: 'passkeys-cyan',
  [OPENLOGIN_NETWORK.SAPPHIRE_DEVNET]: 'w3a-passkey-devnet',
  [OPENLOGIN_NETWORK.SAPPHIRE_MAINNET]: 'passkeys-sapphire-mainnet',
  [OPENLOGIN_NETWORK.CELESTE]: '',
};

export const PASSKEY_NONCE = 'passkey_nonce';
export const OAUTH_USERINFO = 'oauth_userinfo';
