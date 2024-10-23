import {
  AuthenticationResponseJSON,
  AuthenticatorAttachment,
  AuthenticatorTransportFuture,
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/types';
import {post} from '@toruslabs/http-helpers';
import {OPENLOGIN_NETWORK_TYPE} from '@toruslabs/openlogin-utils';
import log from 'loglevel';
import {
  Passkey,
  PasskeyAuthenticationResult,
  PasskeyRegistrationResult,
} from 'react-native-passkey';
import {BUILD_ENV} from './constants';
import {BUILD_ENV_TYPE, PasskeyServiceEndpoints} from './interfaces';

export interface ILoginData {
  authenticationResponse: AuthenticationResponseJSON;
  data: {
    challenge: string;
    transports: AuthenticatorTransportFuture[];
    publicKey: string;
    idToken: string;
  };
}

export default class PasskeyService {
  trackingId: string = '';

  web3authClientId: string;

  web3authNetwork: OPENLOGIN_NETWORK_TYPE;

  buildEnv: string = BUILD_ENV.PRODUCTION;

  endpoints: PasskeyServiceEndpoints;

  rpID: string;

  rpName: string;

  constructor(params: {
    web3authClientId: string;
    web3authNetwork: OPENLOGIN_NETWORK_TYPE;
    buildEnv: BUILD_ENV_TYPE;
    passkeyEndpoints: PasskeyServiceEndpoints;
    rpID: string;
    rpName: string;
  }) {
    this.web3authClientId = params.web3authClientId;
    this.endpoints = params.passkeyEndpoints;
    this.buildEnv = params.buildEnv;
    this.web3authNetwork = params.web3authNetwork;
    this.rpID = params.rpID;
    this.rpName = params.rpName;
  }

  padString = (input: string) => {
    var segmentLength = 4;
    var stringLength = input.length;
    var diff = stringLength % segmentLength;
    if (!diff) {
      return input;
    }
    var position = stringLength;
    var padLength = segmentLength - diff;
    var paddedStringLength = stringLength + padLength;
    var buffer = Buffer.alloc(paddedStringLength);
    buffer.write(input);
    while (padLength--) {
      buffer.write('=', position++);
    }
    return buffer.toString();
  };

  toBase64 = (base64url: any) => {
    base64url = base64url.toString();
    return this.padString(base64url).replace(/\-/g, '+').replace(/_/g, '/');
  };

  fromBase64 = (base64: string) => {
    return base64.replace(/[=]/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  };

  convertToRegistrationResponse = (result: PasskeyRegistrationResult) => ({
    ...result,
    id: this.fromBase64(result.id),
    rawId: this.fromBase64(result.rawId),
    response: {
      ...result.response,
      attestationObject: this.fromBase64(result.response.attestationObject),
      clientDataJSON: this.fromBase64(result.response.clientDataJSON),
    },
    clientExtensionResults: {},
    type: 'public-key',
  });
  async registerUser(params: {
    oAuthVerifier: string;
    oAuthVerifierId: string;
    signatures: string[];
    username: string;
    passkeyToken?: string;
    authenticatorAttachment?: AuthenticatorAttachment;
  }): Promise<{id: string} | null> {
    try {
      console.log('pre registration options', params);
      const data = await this.getRegistrationOptions(params);
      console.log('post registration options', data);
      const {options, trackingId} = data;
      this.trackingId = trackingId;
      data.options.challenge = this.toBase64(data.options.challenge);
      data.options.rp.id = 'wildcat-endless-basically.ngrok-free.app';

      // to be replace with passkey.authenticate
      const verificationResponse = await Passkey.register(data.options as any);
      const formattedResponse =
        this.convertToRegistrationResponse(verificationResponse);

      const result = await this.verifyRegistration(
        formattedResponse as any,
        params.signatures,
        params.passkeyToken || '',
      );
      if (result) {
        return {id: verificationResponse.id};
      }
      return null;
    } catch (error: unknown) {
      log.error('error registering user', error);
      throw error;
    }
  }

  convertToAuthenticationResponseJSON = (
    response: PasskeyAuthenticationResult,
  ) => ({
    ...response,
    id: this.fromBase64(response.id),
    rawId: this.fromBase64(response.rawId),
    response: {
      clientDataJSON: this.fromBase64(response.response.clientDataJSON),
      authenticatorData: this.fromBase64(response.response.authenticatorData),
      signature: this.fromBase64(response.response.signature),
    },
    clientExtensionResults: {},
    type: 'public-key',
  });

  async loginUser(authenticatorId?: string): Promise<ILoginData | null> {
    try {
      console.log('pre authentication options', authenticatorId);

      const data = await this.getAuthenticationOptions(authenticatorId);
      const {trackingId} = data;
      data.options.challenge = this.toBase64(data.options.challenge);

      console.log('post authentication options', data);
      this.trackingId = trackingId;
      // here
      // const verificationResponse = await startAuthentication(options);
      const verificationResponse = await Passkey.authenticate({
        ...data.options,
      } as any);

      const formattedResponse = this.convertToAuthenticationResponseJSON(
        verificationResponse as any,
      );

      const result = await this.verifyAuthentication(formattedResponse as any);
      if (result && result.verified && result.data) {
        log.info('authentication response', verificationResponse);
        return {
          authenticationResponse: formattedResponse as any,
          data: {
            challenge: result.data.challenge_timestamp,
            transports: result.data.transports,
            publicKey: result.data.credential_public_key,
            idToken: result.data.id_token,
          },
        };
      }
      return null;
    } catch (error: unknown) {
      log.error('error registering user', error);
      throw error;
    }
  }

  async getAllPasskeys({
    passkeyToken = '',
    signatures = [],
  }: {
    passkeyToken: string;
    signatures: string[];
  }) {
    const response = await post<{
      success: boolean;
      data: {passkeys: Record<string, string>};
    }>(
      this.endpoints.crud.list,
      {
        web3auth_client_id: this.web3authClientId,
        network: this.web3authNetwork,
        signatures,
      },
      {
        headers: {
          Authorization: `Bearer ${passkeyToken}`,
        },
      },
    );
    if (response.success) {
      return response.data.passkeys;
    }
    throw new Error('Error getting passkeys');
  }

  private async getRegistrationOptions({
    authenticatorAttachment,
    oAuthVerifier,
    oAuthVerifierId,
    signatures,
    username,
    passkeyToken,
  }: {
    oAuthVerifier: string;
    oAuthVerifierId: string;
    signatures: string[];
    username: string;
    passkeyToken?: string;
    authenticatorAttachment?: AuthenticatorAttachment;
  }) {
    console.log('endpoint', this.endpoints.register.options);
    const response = await post<{
      success: boolean;
      data: {
        options: PublicKeyCredentialCreationOptionsJSON;
        trackingId: string;
      };
    }>(
      this.endpoints.register.options,
      {
        web3auth_client_id: this.web3authClientId,
        verifier_id: oAuthVerifierId,
        verifier: oAuthVerifier,
        authenticator_attachment: authenticatorAttachment,
        rp: {
          name: this.rpName,
          id: this.rpID,
        },
        username,
        network: this.web3authNetwork,
        signatures,
      },
      {
        headers: {
          Authorization: `Bearer ${passkeyToken || ''}`,
        },
      },
    );
    if (response.success) {
      return response.data;
    }
    throw new Error('Error getting registration options');
  }

  private async verifyRegistration(
    verificationResponse: RegistrationResponseJSON,
    signatures: string[],
    token: string,
  ) {
    if (!this.trackingId) {
      throw new Error(
        'trackingId is required, please restart the process again.',
      );
    }

    const response = await post<{verified: boolean; error?: string}>(
      this.endpoints.register.verify,
      {
        web3auth_client_id: this.web3authClientId,
        tracking_id: this.trackingId,
        verification_data: verificationResponse,
        network: this.web3authNetwork,
        signatures,
      },
      {
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      },
    );
    if (response.verified) {
      return true;
    }
    throw new Error(`Error verifying registration, error: ${response.error}`);
  }

  private async getAuthenticationOptions(authenticatorId?: string) {
    console.log({
      web3auth_client_id: this.web3authClientId,
      rp_id: this.rpID,
      authenticator_id: authenticatorId,
    });
    const response = await post<{
      success: boolean;
      data: {
        options: PublicKeyCredentialCreationOptionsJSON;
        trackingId: string;
      };
    }>(this.endpoints.authenticate.options, {
      web3auth_client_id: this.web3authClientId,
      rp_id: this.rpID,
      authenticator_id: authenticatorId,
    });
    if (response.success) {
      return response.data;
    }
    console.log({response: JSON.stringify(response)});
    throw new Error('Error getting authentication options');
  }

  private async verifyAuthentication(
    verificationResponse: AuthenticationResponseJSON,
  ) {
    if (!verificationResponse) {
      throw new Error('verificationResponse is required.');
    }

    const response = await post<{
      verified: boolean;
      data?: {
        challenge_timestamp: string;
        transports: AuthenticatorTransportFuture[];
        credential_public_key: string;
        rpID: string;
        id_token: string;
      };
      error?: string;
    }>(this.endpoints.authenticate.verify, {
      web3auth_client_id: this.web3authClientId,
      tracking_id: this.trackingId,
      verification_data: verificationResponse,
    });
    if (response.verified) {
      return {data: response.data, verified: response.verified};
    }
    throw new Error(`Error verifying authentication, error: ${response.error}`);
  }
}
