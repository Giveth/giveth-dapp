import localforage from 'localforage';
import rx from 'feathers-reactive';
import socketio from '@feathersjs/socketio-client';
import * as Sentry from '@sentry/react';
import config from '../configuration';

const feathers = require('@feathersjs/feathers');

const io = require('socket.io-client');
const auth = require('@feathersjs/authentication-client');
const rest = require('@feathersjs/rest-client');

const restClient = rest(config.feathersConnection);
const fetch = require('node-fetch');

let connectErrorSentToSentry = false;
export const socket = io(config.feathersConnection, {
  transports: ['websocket'],
});

// socket IO error events
socket.on('connect_error', e => {
  console.log('Could not connect to FeatherJS');
  if (!connectErrorSentToSentry) {
    // Check to not send error to sentry multiple times
    Sentry.captureException(e);
    connectErrorSentToSentry = true;
    console.log('send Feathers connection error to sentry');
  }
});
socket.on('disconnect', _e => {
  console.log('Could not connect to FeatherJS: Disconnect');
});
socket.on('connect_timeout', _e => {
  console.log('Could not connect to FeatherJS: Timeout');
});
socket.on('reconnect_attempt', _e => console.log('Trying to reconnect to FeatherJS: Timeout'));

export const feathersRest = feathers()
  .configure(restClient.fetch(fetch))
  .configure(auth({ storage: localforage }))
  .configure(
    rx({
      idField: '_id',
    }),
  );

export const feathersClient = feathers()
  .configure(
    socketio(socket, {
      timeout: 90000,
      pingTimeout: 90000,
      upgradeTimeout: 90000,
    }),
  )
  .configure(auth({ storage: localforage }))
  .configure(
    rx({
      idField: '_id',
    }),
  );
// .on('authenticated', feathersRest.passport.setJWT); // set token on feathersRest whenever it is changed
feathersClient.service('uploads').timeout = 10000;
feathersRest.service('uploads').timeout = 10000;
