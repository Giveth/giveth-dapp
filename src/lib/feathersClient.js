import feathers from 'feathers/client';
import socketio from 'feathers-socketio/client';
import hooks from 'feathers-hooks';
// import errors from 'feathers-errors'; // An object with all of the custom error types.
import auth from 'feathers-authentication-client';
import io from 'socket.io-client/dist/socket.io';

const socket = io(process.env.REACT_APP_FEATHERJS_CONNECTION_URL, {
  transports: ['websocket']
});

const feathersClient = feathers()
  .configure(socketio(socket))
  .configure(hooks())
  .configure(auth())

export default feathersClient;