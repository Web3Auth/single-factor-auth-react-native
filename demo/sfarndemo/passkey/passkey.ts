import {NodeDetailManager} from '@toruslabs/fetch-node-details';
import {
  SafeEventEmitter,
  SafeEventEmitterProvider,
} from '@toruslabs/openlogin-jrpc';
import {OpenloginUserInfo} from '@toruslabs/openlogin-utils';
import Torus, {keccak256} from '@toruslabs/torus.js';
import type {IWeb3Auth, WALLET_ADAPTER_TYPE} from '@web3auth/base';
import {
  type IPlugin,
  PLUGIN_EVENTS,
  PLUGIN_NAMESPACES,
  type PluginNamespace,
} from '@web3auth/base-plugin';
import {
  ADAPTER_EVENTS,
  type AggregateVerifierParams,
  type IWeb3Auth as ISFAWeb3auth,
} from '@web3auth/single-factor-auth';
import base64url from 'base64url';
import BN from 'bn.js';
import {ec as EC} from 'elliptic';
export const ecCurve = new EC('secp256k1');

import {BUILD_ENV, PASSKEYS_VERIFIER_MAP} from './constants';
import {
  IPasskeysPluginOptions,
  LoginParams,
  RegisterPasskeyParams,
} from './interfaces';
import PasskeyService from './passKeysSvc';
import {
  getMetadataUrl,
  getNonce,
  getPasskeyEndpoints,
  getUserInfo,
  saveUserInfo,
  setNonce,
} from './utils';

export class PasskeysPlugin extends SafeEventEmitter implements IPlugin {
  name = 'PASSKEYS_PLUGIN';

  readonly SUPPORTED_ADAPTERS: WALLET_ADAPTER_TYPE[] = [];

  readonly pluginNamespace: PluginNamespace = PLUGIN_NAMESPACES.MULTICHAIN;

  private options: IPasskeysPluginOptions;

  private web3auth: IWeb3Auth | ISFAWeb3auth | null = null;

  private initialized: boolean = false;

  private passkeysSvc: PasskeyService | null = null;

  private authInstance: Torus | null = null;

  private nodeDetailManagerInstance!: NodeDetailManager;

  private basePrivKey!: string;

  private userInfo!: OpenloginUserInfo;

  private sessionSignatures!: string[];

  private authToken!: string;

  constructor(options: IPasskeysPluginOptions) {
    super();
    if (!options.buildEnv) {
      options.buildEnv = BUILD_ENV.PRODUCTION;
    }
    if (!options.passkeyEndpoints) {
      options.passkeyEndpoints = getPasskeyEndpoints(options.buildEnv);
    }
    if (!options.serverTimeOffset) {
      options.serverTimeOffset = 0;
    }
    // if (!options.rpID) {
    //   options.rpID = window.location.hostname;
    // }
    // if (!options.rpName) {
    //   options.rpName = window.location.hostname;
    // }

    this.options = options;
  }

  async initWithWeb3Auth(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async initWithSfaWeb3auth(web3auth: ISFAWeb3auth) {
    if (this.initialized) {
      return;
    }
    if (!web3auth) {
      throw new Error('Web3Auth sfa instance is required');
    }

    this.web3auth = web3auth;
    const {clientId, web3AuthNetwork} = this.web3auth.options;
    if (!clientId || !web3AuthNetwork) {
      throw new Error('Missing Web3auth options');
    }
    console.log('pre passkeyservice');

    this.passkeysSvc = new PasskeyService({
      web3authClientId: clientId,
      web3authNetwork: web3AuthNetwork,
      buildEnv: this.options.buildEnv,
      passkeyEndpoints: this.options.passkeyEndpoints,
      rpID: this.options.rpID,
      rpName: this.options.rpName,
    });
    console.log('passkeysSvc', this.passkeysSvc);

    this.nodeDetailManagerInstance = new NodeDetailManager({
      network: web3AuthNetwork,
    });

    this.authInstance = new Torus({
      clientId,
      enableOneKey: true,
      network: web3AuthNetwork,
    });
    console.log('authInstance', this.authInstance);

    if (!this.options.verifier) {
      this.options.verifier = PASSKEYS_VERIFIER_MAP[web3AuthNetwork];
    }
    if (!this.options.metadataHost) {
      this.options.metadataHost = getMetadataUrl(web3AuthNetwork);
    }

    if (this.web3auth.connected) {
      this.basePrivKey = this.web3auth.torusPrivKey as string;
      this.userInfo = await this.web3auth.getUserInfo();
      this.sessionSignatures = this.web3auth.state
        .sessionSignatures as string[];
    }

    this.subscribeToSfaEvents(web3auth);

    this.initialized = true;
    console.log('here');
    this.emit(PLUGIN_EVENTS.READY);
    console.log('event ready passkey');
  }

  async initWithProvider() {
    throw new Error('Method not implemented.');
  }

  connect(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  disconnect(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async registerPasskey({
    authenticatorAttachment,
    username,
  }: RegisterPasskeyParams) {
    if (!this.initialized) {
      throw new Error('Sdk not initialized, please call init first.');
    }
    if (!this.passkeysSvc) {
      throw new Error('Passkey service not initialized');
    }
    if (!this.web3auth?.connected) {
      throw new Error('Web3Auth not connected');
    }

    if (!username) {
      throw new Error('Username is required for passkey registration.');
    }

    const {verifier, verifierId, aggregateVerifier} = this.userInfo;
    const result = await this.passkeysSvc.registerUser({
      oAuthVerifier: verifier,
      oAuthVerifierId: aggregateVerifier || verifierId,
      authenticatorAttachment,
      signatures: this.sessionSignatures,
      username,
      passkeyToken: this.authToken,
    });

    if (!result) {
      throw new Error('passkey registration failed.');
    }

    console.log('proceeding to login');
    // TODO: maybe we need a better ux here to explain as why we are doing double verification here.
    const loginResult = await this.passkeysSvc.loginUser(result.id);
    if (!loginResult) {
      throw new Error('passkey login failed.');
    }
    console.log('passkey steps done');

    const {
      response: {signature, clientDataJSON, authenticatorData},
      id,
    } = loginResult.authenticationResponse;
    const {publicKey, challenge} = loginResult.data;

    const verifierHash = keccak256(Buffer.from(publicKey, 'base64')).slice(2);
    const passkeyVerifierId = base64url.fromBase64(
      Buffer.from(verifierHash, 'hex').toString('base64'),
    );

    const loginParams: LoginParams = {
      verifier: this.options.verifier || '',
      verifierId: passkeyVerifierId,
      idToken: signature,
      extraVerifierParams: {
        signature,
        clientDataJSON,
        authenticatorData,
        publicKey,
        challenge,
        rpOrigin: this.options.rpOrigin || '',
        rpId: this.options.rpID || '',
        credId: id,
      },
    };
    console.log('pre getPasskeyPostboxKey', loginParams);

    // get the passkey private key.
    const passkey = await this.getPasskeyPostboxKey(loginParams);

    // get the deterministic nonce.
    // Nonce = OAuthKey - Passkey.
    const nonce = this.getNonce(this.basePrivKey, passkey);
    console.log('pre set nonce', nonce);

    // save the nonce in the metadata db.
    // this will throw an error if it fails.
    await setNonce(
      this.options.metadataHost || '',
      passkey,
      nonce,
      this.options.serverTimeOffset,
    );
    console.log('post set nonce', nonce);

    // if the nonce is set, then we are good to go.
    // We set the oAuthUserInfo in the metadata DB.
    // This will be help us to get the user info when you login with passkey.
    await saveUserInfo(
      this.options.metadataHost || '',
      this.basePrivKey,
      this.userInfo,
    );
    console.log('post user info');

    return true;
  }

  public async loginWithPasskey(): Promise<SafeEventEmitterProvider | null> {
    if (!this.initialized) {
      throw new Error('Sdk not initialized, please call init first.');
    }
    if (!this.passkeysSvc) {
      throw new Error('Passkey service not initialized');
    }

    const loginResult = await this.passkeysSvc.loginUser();
    if (!loginResult) {
      throw new Error('passkey login failed.');
    }

    const {
      response: {signature, clientDataJSON, authenticatorData},
      id,
    } = loginResult.authenticationResponse;
    const {publicKey, challenge} = loginResult.data;

    const verifierHash = keccak256(Buffer.from(publicKey, 'base64')).slice(2);
    const passkeyVerifierId = base64url.fromBase64(
      Buffer.from(verifierHash, 'hex').toString('base64'),
    );

    const loginParams: LoginParams = {
      verifier: this.options.verifier || '',
      verifierId: passkeyVerifierId,
      idToken: signature,
      extraVerifierParams: {
        signature,
        clientDataJSON,
        authenticatorData,
        publicKey,
        challenge,
        rpOrigin: this.options.rpOrigin,
        rpId: this.options.rpID,
        credId: id,
      },
    };
    console.log('pre getPasskeyPostboxKey', loginParams);

    // get the passkey private key.
    const passkey = await this.getPasskeyPostboxKey(loginParams);
    const nonce = await getNonce(
      this.options.metadataHost,
      passkey,
      this.options.serverTimeOffset,
    );
    if (!nonce) {
      throw new Error(
        'Unable to login with passkey, no passkey found or different passkey selected to login.',
      );
    }

    const privKey = this.getPrivKeyFromNonce(passkey, nonce);
    console.log('pre userInfo', privKey);
    // get the oAuthUserInfo from the metadata DB.
    const userInfo = await getUserInfo(this.options.metadataHost, privKey);
    console.log('post userInfo', userInfo);

    if (userInfo?.email) {
      await (this.web3auth as ISFAWeb3auth).finalizeLogin({
        privKey,
        userInfo,
        passkeyToken: loginResult.data.idToken,
      });
      console.log('all good web3auth', this.web3auth?.provider);
      return (this.web3auth as ISFAWeb3auth).provider;
    } else {
      return null;
    }
  }

  public async listAllPasskeys() {
    if (!this.initialized) {
      throw new Error('Sdk not initialized, please call init first.');
    }
    if (!this.passkeysSvc) {
      throw new Error('Passkey service not initialized');
    }

    return this.passkeysSvc.getAllPasskeys({
      passkeyToken: this.authToken,
      signatures: this.sessionSignatures,
    });
  }

  private async getPasskeyPostboxKey(
    loginParams: LoginParams,
  ): Promise<string> {
    if (!this.initialized) {
      throw new Error('Sdk not initialized, please call init first.');
    }

    const {verifier, verifierId, idToken, subVerifierInfoArray} = loginParams;
    const verifierDetails = {verifier, verifierId};

    const {torusNodeEndpoints, torusNodePub, torusIndexes} =
      await this.nodeDetailManagerInstance.getNodeDetails(verifierDetails);

    if (loginParams.serverTimeOffset && this.authInstance?.serverTimeOffset) {
      this.authInstance.serverTimeOffset = loginParams.serverTimeOffset;
    }

    // Does the key assign
    if (this.authInstance?.isLegacyNetwork) {
      await this.authInstance.getPublicAddress(
        torusNodeEndpoints,
        torusNodePub,
        {verifier, verifierId},
      );
    }

    let finalIdToken = idToken;
    let finalVerifierParams = {verifier_id: verifierId};
    if (subVerifierInfoArray && subVerifierInfoArray?.length > 0) {
      const aggregateVerifierParams: AggregateVerifierParams = {
        verify_params: [],
        sub_verifier_ids: [],
        verifier_id: '',
      };
      const aggregateIdTokenSeeds = [];
      for (let index = 0; index < subVerifierInfoArray.length; index += 1) {
        const userInfo = subVerifierInfoArray[index];
        aggregateVerifierParams.verify_params.push({
          verifier_id: verifierId,
          idtoken: userInfo.idToken,
        });
        aggregateVerifierParams.sub_verifier_ids.push(userInfo.verifier);
        aggregateIdTokenSeeds.push(userInfo.idToken);
      }
      aggregateIdTokenSeeds.sort();

      finalIdToken = keccak256(
        Buffer.from(
          aggregateIdTokenSeeds.join(String.fromCharCode(29)),
          'utf8',
        ),
      ).slice(2);

      aggregateVerifierParams.verifier_id = verifierId;
      finalVerifierParams = aggregateVerifierParams;
    }

    const retrieveSharesResponse = await this.authInstance?.retrieveShares(
      torusNodeEndpoints,
      torusIndexes,
      verifier,
      finalVerifierParams,
      finalIdToken,
      loginParams.extraVerifierParams || {},
    );

    const postboxKey = Torus.getPostboxKey(retrieveSharesResponse as any);
    return postboxKey.padStart(64, '0');
  }

  private getNonce(oAuthKey: string, passkey: string): string {
    return new BN(oAuthKey, 'hex')
      .sub(new BN(passkey, 'hex'))
      .umod(ecCurve.curve.n)
      .toString('hex', 64);
  }

  private getPrivKeyFromNonce(passkey: string, nonce: string): string {
    return new BN(passkey, 'hex')
      .add(new BN(nonce, 'hex'))
      .umod(ecCurve.curve.n)
      .toString('hex', 64);
  }

  private subscribeToSfaEvents(web3auth: ISFAWeb3auth) {
    web3auth.on(ADAPTER_EVENTS.CONNECTED, async () => {
      this.basePrivKey = web3auth.torusPrivKey as string;
      this.userInfo = await web3auth.getUserInfo();
      this.sessionSignatures = web3auth.state.sessionSignatures as string[];
      this.authToken = web3auth.state.passkeyToken as string;
    });
  }
}
