import localforage from 'localforage';
import rx from 'feathers-reactive';
import config from '../configuration';
import matcher from './matcher';

const feathers = require('@feathersjs/feathers');
const socketio = require('@feathersjs/socketio-client');
const io = require('socket.io-client');
const auth = require('@feathersjs/authentication-client');
const rest = require('@feathersjs/rest-client');

const restClient = rest(config.feathersConnection);
const fetch = require('node-fetch');

export const socket = io(config.feathersConnection, {
  transports: ['websocket'],
});

// socket IO error events
socket.on('connect_error', _e => console.log('Could not connect to FeatherJS'));
socket.on('connect_timeout', _e => console.log('Could not connect to FeatherJS: Timeout'));
socket.on('reconnect_attempt', _e => console.log('Trying to reconnect to FeatherJS: Timeout'));

export const feathersRest = feathers()
  .configure(restClient.fetch(fetch))
  .configure(auth({ storage: localforage }))
  .configure(
    rx({
      idField: '_id',
      matcher,
    }),
  );

export const feathersClient = feathers()
  .configure(
    socketio(socket, {
      timeout: 30000,
      pingTimeout: 30000,
      upgradeTimeout: 30000,
    }),
  )
  .configure(auth({ storage: localforage }))
  .configure(
    rx({
      idField: '_id',
      matcher,
    }),
  );
// .on('authenticated', feathersRest.passport.setJWT); // set token on feathersRest whenever it is changed

feathersClient.service('uploads').timeout = 10000;
feathersRest.service('uploads').timeout = 10000;
