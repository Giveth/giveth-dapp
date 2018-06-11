const feathers = require('feathers');
const rest = require('feathers-rest');
const socketio = require('feathers-socketio');
const memory = require('feathers-memory');
const bodyParser = require('body-parser');
const handler = require('feathers-errors/handler');

const app = feathers()
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .configure(rest())
  .configure(socketio())
  .use('/todos', memory())
  .use('/', feathers.static(__dirname))
  .use(handler());

app.listen(3030);
