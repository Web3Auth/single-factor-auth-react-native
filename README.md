# Web3Auth Single Factor Auth React Native SDK

Web3Auth is where passwordless auth meets non-custodial key infrastructure for Web3 apps and wallets. By aggregating OAuth (Google, Twitter, Discord) logins, different wallets and innovative Multi Party Computation (MPC) - Web3Auth provides a seamless login experience to every user on your application.

Web3Auth Single Factor Auth is the SDK that gives you the ability to start with just one key (aka, Single Factor) with Web3Auth, giving you the flexibility of implementing your own UI and UX.

## 📖 Documentation

Checkout the official [Web3Auth Documentation](https://web3auth.io/docs) and [SDK Reference](https://web3auth.io/docs/sdk/core-kit/sfa-react-native/) to get started!

## 💡 Features

- JWT based Web3 Authentication Service
- Fully decentralized, non-custodial key infrastructure
- End to end Whitelabelable solution
- Threshold Cryptography based Key Reconstruction
- Multi Factor Authentication Setup & Recovery (Includes password, backup phrase, device factor editing/deletion etc)
- Support for WebAuthn & Passwordless Login
- Support for connecting to multiple wallets
- DApp Active Session Management
- Support for Expo and Bare React Native Workflows

...and a lot more

## ⏪ Requirements

- For iOS, only iOS 12+ supported since we requires ASWebAuthenticationSession.

- For Android, Custom Tab support is required.

## ⚡ Installation

```sh
npm install @web3auth/single-factor-auth-react-native
```

## 🌟 Configuration

### Configure your Web3Auth project

Hop on to the [Web3Auth Dashboard](https://dashboard.web3auth.io/) and create a new project. Use the Client ID of the project to start your integration.

![Web3Auth Dashboard](https://web3auth.io/docs/assets/images/project_plug_n_play-89c39ec42ad993107bb2485b1ce64b89.png)

- Add `{YOUR_APP_PACKAGE_NAME}://auth` to **Whitelist URLs**.

- Copy the Project ID for usage later.

## 💥 Initialization & Usage

In your sign-in activity', create an `Web3Auth` instance with your Web3Auth project's configurations and
configure it like this:

```js
import EncryptedStorage from 'react-native-encrypted-storage';
import Web3Auth from '@web3auth/single-factor-auth-react-native';
import {EthereumPrivateKeyProvider} from '@web3auth/ethereum-provider';

export default function App() {
  const [web3auth, setWeb3Auth] = useState<Web3Auth | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>();

  useEffect(() => {
    async function init() {
        const authProvider = new Web3Auth(EncryptedStorage, {
          clientId: 'YOUR_WEB3AUTH_CLIENT_ID', // Get your Client ID from Web3Auth Dashboard
          web3AuthNetwork: 'cyan',
          usePnPKey: false, // By default, this sdk returns CoreKitKey
        });

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
        setWeb3Auth(authProvider);
        await authProvider.init(privateKeyProvider);

        if (authProvider.connected) {
          const finalPrivateKey = await authProvider.provider!.request({
            method: 'eth_private_key',
          });

          setPrivateKey(finalPrivateKey as string);
          console.log('Private Key: ' + finalPrivateKey);
        }
    }
    init();
  }, []);

  const login = async () => {
    const loginRes = await signIn();
    const idToken = await loginRes!.user.getIdToken(true);
    const parsedToken = parseToken(idToken);

    const verifier = 'YOUR_WEB3AUTH_VERIFIER';
    const verifierId = parsedToken.sub;
    const provider = await web3auth!.connect({
      verifier, // e.g. `web3auth-sfa-verifier` replace with your verifier name, and it has to be on the same network passed in init().
      verifierId, // e.g. `Yux1873xnibdui` or `name@email.com` replace with your verifier id(sub or email)'s value.
      idToken,
    });
    const finalPrivateKey = await provider!.request({
      method: 'eth_private_key',
    });

    setPrivateKey(finalPrivateKey as string);
    console.log('Private Key: ' + finalPrivateKey);
  };
}
```

## 🩹 Examples

Checkout the examples for your preferred blockchain and platform in our [examples](https://web3auth.io/docs/examples)

## 🌐 Demo

Checkout the [Web3Auth Demo](https://demo-app.web3auth.io/) to see how Web3Auth can be used in an application.

Further checkout the [example folder](https://github.com/Web3Auth/single-factor-auth-react-native/tree/main/demo/sfarndemo) within this repository, which contains a sample app.

## 💬 Troubleshooting and Support

- Have a look at our [Community Portal](https://community.web3auth.io/) to see if anyone has any questions or issues you might be having. Feel free to reate new topics and we'll help you out as soon as possible.
- Checkout our [Troubleshooting Documentation Page](https://web3auth.io/docs/troubleshooting) to know the common issues and solutions.
- For Priority Support, please have a look at our [Pricing Page](https://web3auth.io/pricing.html) for the plan that suits your needs.
