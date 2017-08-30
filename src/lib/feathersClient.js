import feathers from 'feathers/client';
import socketio from 'feathers-socketio/client';
import hooks from 'feathers-hooks';
import auth from 'feathers-authentication-client';
import localforage from 'localforage';

// import errors from 'feathers-errors'; // An object with all of the custom error types.
import io from 'socket.io-client/dist/socket.io';

export const socket = io(process.env.REACT_APP_FEATHERJS_CONNECTION_URL, {
  transports: [ 'websocket' ],
})

// socket IO error events
socket.on('connect_error', (e) => console.log('Could not connect to FeatherJS'))
socket.on('connect_timeout', (e) => console.log('Could not connect to FeatherJS: Timeout'))
socket.on('reconnect_attempt', (e) => console.log('Trying to reconnect to FeatherJS: Timeout'))

export const feathersClient = feathers()
  .configure(socketio(socket, { timeout: 5000 }))
  .configure(auth({ storage: localforage }))
  .configure(hooks());
