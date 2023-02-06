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

export function multiply(a: number, b: number): Promise<number> {
  return Web3authSingleFactor.multiply(a, b);
}

export function add(a: number, b: number): Promise<number> {
  return Web3authSingleFactor.add(a, b);
}

export function getTorusKey(network: String, verifier: String, email: String, idToken: String): Promise<String> {
  return Web3authSingleFactor.getTorusKey(network, verifier, email, idToken);
}


