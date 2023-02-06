import * as React from 'react';

import { StyleSheet, View, Text } from 'react-native';
import { multiply, add, getTorusKey} from 'react-native-web3auth-single-factor';

export default function App() {
  const [result, setResult] = React.useState<number | undefined>();
  const [web3authResult, setWeb3AuthResult] = React.useState<String | undefined>();

  React.useEffect(() => {
    multiply(11, 9).then(setResult);
    add(10, 8).then(setResult);
    getTorusKey('testnet',
    'torus-test-health',
    'hello@tor.us',
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJlbWFpbHxoZWxsbyIsImF1ZCI6InRvcnVzLWtleS10ZXN0IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImlzcyI6InRvcnVzLWtleS10ZXN0Iiwibmlja25hbWUiOiJoZWxsbyIsIm5hbWUiOiJoZWxsb0B0b3IudXMiLCJleHAiOjE2NzUyMjAyNjUsImlhdCI6MTY3NTIxNjY2NSwiZW1haWwiOiJoZWxsb0B0b3IudXMiLCJwaWN0dXJlIjoiIn0.yCC-Amj4mg8BfhCQD-1cIdDtx7ItUlE3un95Wh6azDiYtETK-ohX8bOsiwol2ILTCDh3rX69X_0lV1rhcXN5ow')
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
