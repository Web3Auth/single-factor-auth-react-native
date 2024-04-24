import type {TORUS_LEGACY_NETWORK_TYPE} from '@toruslabs/constants';
import {fetchLocalConfig} from '@toruslabs/fnd-base';
import MetadataStorageLayer, {
  encryptAndSetData,
  getAndDecryptData,
} from '@toruslabs/metadata-helpers';
import {
  OPENLOGIN_NETWORK_TYPE,
  OpenloginUserInfo,
  TORUS_LEGACY_NETWORK,
} from '@toruslabs/openlogin-utils';

import {OAUTH_USERINFO, PASSKEY_NONCE, PASSKEY_SVC_URL} from './constants';
import {BUILD_ENV_TYPE} from './interfaces';

export const getMetadataUrl = (network: OPENLOGIN_NETWORK_TYPE): string => {
  if (
    Object.values(TORUS_LEGACY_NETWORK).includes(
      network as TORUS_LEGACY_NETWORK_TYPE,
    )
  ) {
    return 'https://metadata.tor.us';
  }
  const nodeDetails = fetchLocalConfig(network);
  return (
    nodeDetails?.torusNodeEndpoints[0].replace('/sss/jrpc', '/metadata') || ''
  );
};

export const getPasskeyEndpoints = (buildEnv: BUILD_ENV_TYPE) => {
  const baseUrl = PASSKEY_SVC_URL[buildEnv];
  return {
    register: {
      options: `${baseUrl}/api/v3/auth/passkey/fast/register/options`,
      verify: `${baseUrl}/api/v3/auth/passkey/fast/register/verify`,
    },
    authenticate: {
      options: `${baseUrl}/api/v3/auth/passkey/fast/authenticate/options`,
      verify: `${baseUrl}/api/v3/auth/passkey/fast/authenticate/verify`,
    },
    crud: {
      list: `${baseUrl}/api/v3/passkey/fast/list`,
    },
  };
};

export const setNonce = async (
  metadataHost: string,
  privKey: string,
  nonce: string,
  serverTimeOffset?: number,
) => {
  const metadataStorage = new MetadataStorageLayer(
    metadataHost,
    serverTimeOffset,
  );
  return encryptAndSetData(metadataStorage, privKey, {nonce}, PASSKEY_NONCE);
};

export const getNonce = async (
  metadataHost: string,
  privKey: string,
  serverTimeOffset?: number,
): Promise<string | null> => {
  const metadataStorage = new MetadataStorageLayer(
    metadataHost,
    serverTimeOffset,
  );
  const data = await getAndDecryptData<string & {error?: string}>(
    metadataStorage,
    privKey,
    PASSKEY_NONCE,
  );
  if (data?.error) {
    return null;
  }
  return (data || {}).nonce;
};

export const saveUserInfo = async (
  metadataHost: string,
  privKey: string,
  userInfo: OpenloginUserInfo,
  serverTimeOffset?: number,
) => {
  const metadataStorage = new MetadataStorageLayer(
    metadataHost,
    serverTimeOffset,
  );
  return encryptAndSetData(metadataStorage, privKey, userInfo, OAUTH_USERINFO);
};

export const getUserInfo = async (
  metadataHost: string,
  privKey: string,
  serverTimeOffset?: number,
): Promise<OpenloginUserInfo | null> => {
  const metadataStorage = new MetadataStorageLayer(
    metadataHost,
    serverTimeOffset,
  );
  const result = await getAndDecryptData(
    metadataStorage,
    privKey,
    OAUTH_USERINFO,
  );
  if (!result || result.error) {
    return null;
  }
  return result as OpenloginUserInfo;
};
