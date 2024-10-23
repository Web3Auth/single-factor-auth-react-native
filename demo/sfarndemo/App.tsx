import React, {useEffect, useState} from 'react';
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import RPC from './ethersRPC'; // for using ethers.js
import auth from '@react-native-firebase/auth';
import EncryptedStorage from 'react-native-encrypted-storage';
import {decode} from 'base-64';
import {Auth0Provider, useAuth0} from 'react-native-auth0';

import Web3Auth from '@web3auth/single-factor-auth-react-native';
import {EthereumPrivateKeyProvider} from '@web3auth/ethereum-provider';
import {IProvider} from '@web3auth/base';
import {PasskeysPlugin} from './passkey/passkey';
import {ADAPTER_EVENTS} from '@web3auth/single-factor-auth';

function AppScreen() {
  const [privateKey, setPrivateKey] = useState<string | null>();
  const [loading, setLoading] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<string>('');
  const [consoleUI, setConsoleUI] = useState<string>('');
  const [web3auth, setWeb3Auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IProvider>();
  const {authorize, getCredentials} = useAuth0();
  const [passkeyPlugin, setPasskeyPlugin] = useState<PasskeysPlugin | null>(
    null,
  );
  const clientId =
    'BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ'; // get from https://dashboard.web3auth.io

  useEffect(() => {
    async function init() {
      try {
        const authProvider = new Web3Auth(EncryptedStorage, {
          clientId,
          web3AuthNetwork: 'sapphire_devnet', // ["cyan", "testnet"]
          usePnPKey: false, // By default, this sdk returns CoreKitKey
          metadataHost: 'https://metadata-testing.tor.us',
        });

        const plugin = new PasskeysPlugin({
          buildEnv: 'local',
          metadataHost: 'https://metadata-testing.tor.us',
          passkeyEndpoints: {
            // replace this authentication server
            register: {
              options:
                'https://wildcat-endless-basically.ngrok-free.app/api/v1/passkey/generate-registration-options',
              verify:
                'https://wildcat-endless-basically.ngrok-free.app/api/v1/passkey/verify-registration',
            },
            authenticate: {
              options:
                'https://wildcat-endless-basically.ngrok-free.app/api/v1/passkey/generate-authentication-options',
              verify:
                'https://wildcat-endless-basically.ngrok-free.app/api/v1/passkey/verify-authentication',
            },
            crud: {
              list: 'https://wildcat-endless-basically.ngrok-free.app/api/v1/passkey/list',
            },
          },
          // should this be app url or backend url
          rpID: 'wildcat-endless-basically.ngrok-free.app',
          rpName: 'SFARNDemo',
          rpOrigin: 'https://wildcat-endless-basically.ngrok-free.app',
          verifier: '',
          serverTimeOffset: 60,
        });
        authProvider.addPlugin(plugin);
        setPasskeyPlugin(plugin);
        const privateKeyProvider = new EthereumPrivateKeyProvider({
          config: {
            /*
              pass the chain config that you want to connect with
              all chainConfig fields are required.
              */
            chainConfig: {
              chainId: '0x1',
              rpcTarget: 'https://rpc.ankr.com/eth',
              displayName: 'mainnet',
              blockExplorer: 'https://etherscan.io/',
              ticker: 'ETH',
              tickerName: 'Ethereum',
            },
          },
        });
        await authProvider.init(privateKeyProvider as any);

        // if (authProvider.connected) {
        const finalPrivateKey = await authProvider.provider!.request({
          method: 'eth_private_key',
        });

        setPrivateKey(finalPrivateKey as string);
        uiConsole('Private Key: ' + finalPrivateKey);
        setWeb3Auth(authProvider);
        setProvider(authProvider.provider!);
      } catch (error) {
        uiConsole(error, 'mounted caught');
      }
    }
    init();
  }, []);

  const parseToken = (token: any) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace('-', '+').replace('_', '/');
      return JSON.parse(decode(base64 || ''));
    } catch (err) {
      uiConsole(err);
      return null;
    }
  };

  const signInWithAuth0 = async (method: string) => {
    try {
      //@ts-ignore
      const credentials = await authorize({
        scope: 'openid profile email',
        // connection: method,
      });
      // const credentials = await getCredentials();
      console.log({credentials});
      return credentials?.idToken;
    } catch (error) {
      console.error({'error while sign with auth0': error});
    }
  };

  const login = async () => {
    try {
      setConsoleUI('Logging in');
      setLoading(true);
      const idToken = await signInWithAuth0('google');
      console.log({idToken});
      const parsedToken = parseToken(idToken);
      setUserInfo(parsedToken);

      const verifier = 'w3a-auth0-demo';
      // const currentVerifierId = parsedToken.sub;
      const currentVerifierId = parsedToken.sub;
      const currentProvider = await web3auth!.connect({
        verifier, // e.g. `web3auth-sfa-verifier` replace with your verifier name, and it has to be on the same network passed in init().
        verifierId: currentVerifierId, // e.g. `Yux1873xnibdui` or `name@email.com` replace with your verifier id(sub or email)'s value.
        idToken: idToken || '',
      });
      console.log({currentVerifierId});
      // setVerifierId(currentVerifierId);
      setProvider(currentProvider);

      setLoading(false);
      const finalPrivateKey = await currentProvider!.request({
        method: 'eth_private_key',
      });

      setPrivateKey(finalPrivateKey as string);
      uiConsole('Logged In');
    } catch (e) {
      uiConsole(e);
      setLoading(false);
    }
  };

  const getChainId = async () => {
    setConsoleUI('Getting chain id');
    const networkDetails = await RPC.getChainId();
    uiConsole(networkDetails);
  };

  const getAccounts = async () => {
    setConsoleUI('Getting account');
    const address = await RPC.getAccounts(privateKey as string);
    uiConsole(address);
  };

  const registerPasskeyV2 = async () => {
    setConsoleUI('registerPasskey account');
    try {
      console.log({passkeyPlugin});
      if (!passkeyPlugin) {
        throw new Error('Passkey plugin not initialized');
      }

      await passkeyPlugin.registerPasskey({
        username: `Passkey - ${new Date(Date.now()).toUTCString()}`,
      });
      setConsoleUI('Passkey registered successfully');
    } catch (error: unknown) {
      setConsoleUI(`error registering user ${error}`);
      throw error;
    }
  };

  const loginPasskeyV2 = async () => {
    if (!passkeyPlugin) {
      throw new Error('Passkey plugin not initialized');
    }
    await passkeyPlugin.loginWithPasskey();
    console.log('Passkey loginWithPasskey successfully', web3auth?.provider);
    // const sfaProvider = new ethers.providers.Web3Provider(web3auth?.provider as any);
    // const sfaAddress = await sfaProvider.getSigner().getAddress();
    // console.log('sfaAddress', sfaAddress);
    // setWalletAddress(sfaAddress);
    const finalPrivateKey = await web3auth?.provider!.request({
      method: 'eth_private_key',
    });

    setPrivateKey(finalPrivateKey as string);
    setProvider(web3auth?.provider as any);
    uiConsole('Passkey logged in successfully');
  };

  const getBalance = async () => {
    setConsoleUI('Fetching balance');
    const balance = await RPC.getBalance(privateKey as string);
    uiConsole(balance);
  };
  const sendTransaction = async () => {
    setConsoleUI('Sending transaction');
    const tx = await RPC.sendTransaction(privateKey as string);
    uiConsole(tx);
  };
  const signMessage = async () => {
    setConsoleUI('Signing message');
    const message = await RPC.signMessage(privateKey as string);
    uiConsole(message);
  };
  const authenticateUser = async () => {
    setConsoleUI('Authenticating user');
    const data = await web3auth!
      .authenticateUser()
      .catch(error => console.log('error', error));
    uiConsole(data);
  };
  const logout = async () => {
    setPrivateKey(null);
    setUserInfo('');
    await web3auth!.logout();
  };

  const uiConsole = (...args: any) => {
    setConsoleUI(JSON.stringify(args || {}, null, 2) + '\n\n\n\n' + consoleUI);
    console.log(...args);
  };

  const loggedInView = (
    <View style={{}}>
      <Button title="Get User Info" onPress={() => uiConsole(userInfo)} />
      <Button title="Get Chain ID" onPress={() => getChainId()} />
      <Button title="Get Accounts" onPress={() => getAccounts()} />
      <Button title="Get Accounts" onPress={() => getAccounts()} />
      <Button title="Get Balance" onPress={() => getBalance()} />
      <Button title="Send Transaction" onPress={() => sendTransaction()} />
      <Button title="Sign Message" onPress={() => signMessage()} />
      <Button title="Get Private Key" onPress={() => uiConsole(privateKey)} />
      <Button title="Authenticate user" onPress={authenticateUser} />
      <Button title="Register Passkey" onPress={() => registerPasskeyV2()} />
      <Button title="Log Out" onPress={logout} />
    </View>
  );

  const unloggedInView = (
    <View style={styles.buttonArea}>
      <Button title="Login with Web3Auth" onPress={login} />
      <Button title="Login with Passkey" onPress={() => loginPasskeyV2()} />
      {loading && <ActivityIndicator />}
    </View>
  );

  return (
    <View style={styles.container}>
      {privateKey ? loggedInView : unloggedInView}
      <View style={styles.consoleArea}>
        <Text style={styles.consoleText}>Console:</Text>
        <ScrollView style={styles.consoleUI}>
          <Text>{consoleUI}</Text>
        </ScrollView>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <Auth0Provider
      domain={'https://web3auth.au.auth0.com'}
      clientId={'hUVVf4SEsZT7syOiL0gLU9hFEtm2gQ6O'}>
      <AppScreen />
    </Auth0Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
    paddingBottom: 30,
  },
  consoleArea: {
    margin: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  consoleUI: {
    flex: 1,
    backgroundColor: '#CCCCCC',
    color: '#ffffff',
    padding: 10,
    width: Dimensions.get('window').width - 60,
  },
  consoleText: {
    padding: 10,
  },
  buttonArea: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 30,
  },
});
