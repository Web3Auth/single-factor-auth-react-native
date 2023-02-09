import * as React from 'react';

import { StyleSheet, View, Text } from 'react-native';
import { multiply, add, getTorusKey} from 'react-native-web3auth-single-factor';
//import jwt, { Algorithm } from "jsonwebtoken";
import { sign } from "react-native-pure-jwt";

const jwtPrivateKey = `-----BEGIN PRIVATE KEY-----\nMEECAQAwEwYHKoZIzj0CAQYIKoZIzj0DAQcEJzAlAgEBBCCD7oLrcKae+jVZPGx52Cb/lKhdKxpXjl9eGNa1MlY57A==\n-----END PRIVATE KEY-----`;
// export const generateIdToken = (email: string, alg: Algorithm) => {
//   const iat = Math.floor(Date.now() / 1000);
//   const payload = {
//     iss: "torus-key-test",
//     aud: "torus-key-test",
//     name: email,
//     email,
//     scope: "email",
//     iat,
//     eat: iat + 120,
//   };

//   const algo = {
//     expiresIn: 120,
//     algorithm: alg,
//   };

//   return jwt.sign(payload, jwtPrivateKey, algo);
// };

const idToken = sign(
  {
    sub: "email|hello",
    aud : "torus-key-test",
    iss: "hello@tor.us",
    exp: new Date().getTime() + 3600 * 1000, // expiration date, required, in ms, absolute to 1/1/1970
    additional: "payload"
  }, // body
  jwtPrivateKey, // secret
  {
    alg: "HS256"
  }
)
  .then(console.log) // token as the only argument
  .catch(console.error); 

export default function App() {
  const [result, setResult] = React.useState<number | undefined>();
  const [web3authResult, setWeb3AuthResult] = React.useState<String | undefined>();

  React.useEffect(() => {
    multiply(11, 9).then(setResult);
    add(10, 8).then(setResult);
    getTorusKey('testnet',
    'torus-test-health',
    'hello@tor.us',
    idToken)
    .then(setWeb3AuthResult);
  }, []);

  return (
    <View style={styles.container}>
      <Text>Result: {web3authResult}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
