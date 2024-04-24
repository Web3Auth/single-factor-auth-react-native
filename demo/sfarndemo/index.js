import {AppRegistry} from 'react-native';
import 'react-native-get-random-values';
import './global';
import {name as appName} from './app.json';
import App from './App';

AppRegistry.registerComponent(appName, () => App);
