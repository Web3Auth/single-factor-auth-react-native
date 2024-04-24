import {decode, encode} from 'base-64';
global.Buffer = require('buffer').Buffer;
global.process.browser = true;

if (!global.btoa) {
  global.btoa = encode;
}

if (!global.atob) {
  global.atob = decode;
}
