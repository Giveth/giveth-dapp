import feathers from 'feathers/client';
import socketio from 'feathers-socketio/client';
import hooks from 'feathers-hooks';
import io from 'socket.io-client/dist/socket.io';
import auth from 'feathers-authentication-client';
import localforage from 'localforage';
import rx from 'feathers-reactive';
import config from '../configuration';
import matcher from './matcher';
import ErrorPopup from '../components/ErrorPopup';

const rest = require('feathers-rest/client');

const restClient = rest(config.feathersConnection);
const fetch = require('node-fetch');

export const socket = io(config.feathersConnection, {
  transports: ['websocket'],
});

// socket IO error events
socket.on('connect_error', () => ErrorPopup('Could not connect to FeatherJS'));
socket.on('connect_timeout', () =>
  ErrorPopup('Could not connect to FeatherJS: Timeout. Please try and refresh the page.'),
);
socket.on('reconnect_attempt', () =>
  ErrorPopup('Trying to reconnect to FeatherJS: Timeout. Please try and refresh the page.'),
);
socket.on('error', () =>
  ErrorPopup('Trying to reconnect to FeatherJS: Timeout. Please try and refresh the page.'),
);

export const feathersRest = feathers()
  .configure(restClient.fetch(fetch))
  .configure(auth({ storage: localforage }))
  .configure(hooks())
  .configure(
    rx({
      idField: '_id',
      matcher,
    }),
  );

export const feathersClient = feathers()
  .configure(socketio(socket, { timeout: 5000 }))
  .configure(auth({ storage: localforage }))
  .configure(hooks())
  .configure(
    rx({
      idField: '_id',
      matcher,
    }),
  )
  .on('authenticated', feathersRest.passport.setJWT); // set token on feathersRest whenever it is changed

feathersClient.service('uploads').timeout = 10000;
feathersRest.service('uploads').timeout = 10000;
