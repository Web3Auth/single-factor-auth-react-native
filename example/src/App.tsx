import * as React from 'react';

import { StyleSheet, View, Text } from 'react-native';
import { multiply, add, getTorusKey} from 'react-native-web3auth-single-factor';

const jwtPrivateKey = `-----BEGIN PRIVATE KEY-----\nMEECAQAwEwYHKoZIzj0CAQYIKoZIzj0DAQcEJzAlAgEBBCCD7oLrcKae+jVZPGx52Cb/lKhdKxpXjl9eGNa1MlY57A==\n-----END PRIVATE KEY-----`;

export default function App() {
  const [result, setResult] = React.useState<number | undefined>();
  const [web3authResult, setWeb3AuthResult] = React.useState<String | undefined>();

  React.useEffect(() => {
    multiply(11, 9).then(setResult);
    add(10, 8).then(setResult);
    getTorusKey('testnet',
    'torus-test-health',
    'hello@tor.us',
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJlbWFpbHxoZWxsbyIsImF1ZCI6InRvcnVzLWtleS10ZXN0IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImlzcyI6InRvcnVzLWtleS10ZXN0Iiwibmlja25hbWUiOiJoZWxsbyIsIm5hbWUiOiJoZWxsb0B0b3IudXMiLCJleHAiOjE2NzU3NDQ1MDgsImlhdCI6MTY3NTc0MDkwOCwiZW1haWwiOiJoZWxsb0B0b3IudXMiLCJwaWN0dXJlIjoiIn0.xVfVX1hnoiv60ZckLoZPbEKzyFUyqQOpt6iBGXKC4lv4l3PoD-ddQHcEcurv8SYy93UD6M6ejXVpDtf1wXvHjA')
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
