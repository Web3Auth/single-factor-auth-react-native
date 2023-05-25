import * as React from 'react';

import {Button, StyleSheet, View, Text} from 'react-native';
import {testTorusKey, getTorusKey, getAggregateTorusKey, init, initialize} from 'react-native-web3auth-single-factor';

export default function App() {
  const [sfaResult, setSFAResult] = React.useState<String | undefined>();
  var token = ""
  const verifierId = "hello@tor.us" 
  const verifier = "torus-test-health"
  const aggregateVerifier = "torus-test-health-aggregate"
  const TorusNetwork = {
    Testnet: "testnet",
	  Aqua: "aqua",
	  Cyan: "cyan",
    Mainnet: "mainnet",
  }

  React.useEffect(() => {
    // Used testTorusKey() function only for testing
    // testTorusKey(TorusNetwork.Testnet,
    //  verifier,
    //  verifierId,
    //  token)
    
    
    // Used getTorusKey() for getting private Key in production.
    // getTorusKey(TorusNetwork.Testnet,
    //  verifier,
    //  verifierId,
    //  token)
    // .then(setSFAResult);

      init(TorusNetwork.Testnet)

      initialize().then(function(state) {
        setSFAResult(state || "no key")  
       });

    }, []);

  return (
    <View style={styles.container}>
      <Text style= {{fontSize:36, color: '#0364FF'}}>Web3Auth</Text>
      <View style={styles.margin} />
      <Text style= {{fontSize:17, color: '#0364FF'}}>Welcome to SingleFactAuthReactNative Demo</Text>
      <View style={styles.headermargin} />
      <View style={styles.margin}>
      <Button
        title = "Get TorusKey" 
        onPress={() => testTorusKey(verifier, verifierId, token).then(setSFAResult)}             
        />
      <View style={styles.space} />  
      </View>
      <Text>Private Key: {sfaResult}</Text>
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
  margin: {
    marginBottom: 20,
  },
  headermargin: {
    marginBottom: 60,
  },
  space: {
    width: 20, 
    height: 20,
  }
});
