import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-web3auth-single-factor' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const Web3authSingleFactor = NativeModules.Web3authSingleFactor
  ? NativeModules.Web3authSingleFactor
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export function init(network: String): Promise<void> {
  return Web3authSingleFactor.init(network);
}   

export function getTorusKey(verifier: String, verifierId: String, idToken: String): Promise<String> {
  return Web3authSingleFactor.getTorusKey(verifier, verifierId, idToken);
}    

export function getAggregateTorusKey(verifier: String, verifierId: String, idToken: String,
   aggregateVerifier: string): Promise<string> {
  return Web3authSingleFactor.getAggregateTorusKey(verifier, verifierId, idToken, aggregateVerifier);
}

export function initialize(): Promise<String> {
  return Web3authSingleFactor.initialize();
}

export function testTorusKey(verifier: String, verifierId: String, idToken: String): Promise<string> {
  return Web3authSingleFactor.testTorusKey(verifier, verifierId, idToken);
}




