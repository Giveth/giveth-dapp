import feathers from 'feathers/client';
import socketio from 'feathers-socketio/client';
import hooks from 'feathers-hooks';
import io from 'socket.io-client/dist/socket.io';
import auth from 'feathers-authentication-client';
import localforage from 'localforage';
import rx from 'feathers-reactive';

import matcher from './matcher';

export const socket = io(process.env.REACT_APP_FEATHERJS_CONNECTION_URL, {
  transports: ['websocket'],
});

// socket IO error events
socket.on('connect_error', _e => console.log('Could not connect to FeatherJS'));
socket.on('connect_timeout', _e =>
  console.log('Could not connect to FeatherJS: Timeout'),
);
socket.on('reconnect_attempt', _e =>
  console.log('Trying to reconnect to FeatherJS: Timeout'),
);

export const feathersClient = feathers()
  .configure(socketio(socket, { timeout: 15000 }))
  .configure(auth({ storage: localforage }))
  .configure(hooks())
  .configure(rx({ idField: '_id', matcher }));
