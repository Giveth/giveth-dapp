# feathers-reactive

[![Greenkeeper badge](https://badges.greenkeeper.io/feathersjs-ecosystem/feathers-reactive.svg)](https://greenkeeper.io/)

[![Build Status](https://travis-ci.org/feathersjs-ecosystem/feathers-reactive.png?branch=master)](https://travis-ci.org/feathersjs-ecosystem/feathers-reactive)
[![Code Climate](https://codeclimate.com/github/feathersjs-ecosystem/feathers-reactive.png)](https://codeclimate.com/github/feathersjs-ecosystem/feathers-reactive)
[![Test Coverage](https://codeclimate.com/github/feathersjs-ecosystem/feathers-reactive/badges/coverage.svg)](https://codeclimate.com/github/feathersjs-ecosystem/feathers-reactive/coverage)
[![Dependency Status](https://img.shields.io/david/feathersjs-ecosystem/feathers-reactive.svg?style=flat-square)](https://david-dm.org/feathersjs-ecosystem/feathers-reactive)
[![Download Status](https://img.shields.io/npm/dm/feathers-reactive.svg?style=flat-square)](https://www.npmjs.com/package/feathers-reactive)
[![Slack Status](http://slack.feathersjs.com/badge.svg)](http://slack.feathersjs.com)

> Reactive API extensions for Feathers

## About

`feathers-reactive` adds a `watch()` method to services. The returned object implements all service methods as [RxJS](https://github.com/Reactive-Extensions/RxJS) observables that automatically update on [real-time events](https://docs.feathersjs.com/api/events.html#service-events).

## Migration from <= 0.4 to 0.5

If you're upgrading from 0.4 and below this is going to totally break your setup. Sorry for that!
Let's get you back on track:

#### configuration
0.4:
```js
const reactive = require('feathers-reactive');
const Rx = require('rxjs');
// ...
app.configure(reactive(Rx, { ...options }));
```
0.5:
```js
const reactive = require('feathers-reactive');
const Rx = require('rxjs');
// ...
app.configure(reactive({ idField: 'id' /* depends on your DB */ , ...options }));
```
No need to import the entire RxJS bundle and pass it to feathers-reactive any longer. However, `idField` has become a mandatory option. Check the __Options__ section below.

#### getting an observable result stream
This is where 0.5's `.watch()` method comes into play. Depending on your configuration, with 0.4 and lower your service calls could return either an Observable or a Promise. As of 0.5 the plain service call remains a Promise at all times:
0.4:
```js
app.service('myService').get(someId);
```
0.5:
```js
app.service('myService').get(someId);         // This always returns a Promise
app.service('myService').watch().get(someId); // This always returns an Observable
```
#### passing options per service call
You can pass service call level options into the `.watch()` function now. This isn't breaking though, as using options.rx is equivalent.
0.4:
```js
app.service('myService').get(someId, {rx: { strategy: 'always' }});
```
0.5:
```js
app.service('myService').watch({ strategy: 'always' }).get(someId);         // 0.5 syntax
app.service('myService').watch().get(someId, {rx: { strategy: 'always' }}); // still functional 0.4 syntax.
```

#### 0.5 Observables are always lazy!

Unless you configured `lazy: true` in 0.4's options, 0.4's Observables would be always hot, i.e. show Promise-like behavior. This is no longer the case! Observables returned by `.watch().<method>()` are always cold! Example:
```js
// this service call will not be executed!
app.service('myService').watch().create(someObject);

// unless you subscribe:
app.service('myService').watch().create(someObject).subscribe(result => console.log(result));
```
If you just want to fire-and-forget (i.e., you don't care about the result) use the non-observable service call.

## Options

The following options are supported:

- `idField` (mandatory): The id property field of your services. Depends on your service/database. Usually 'id' (SQL, Rethinkdb, …) or '_id' (MongoDB, NeDB, … ).
- `dataField` (default: `data`): The data property field in paginated responses
- `listStrategy` (default: `smart`): The strategy to use for streaming the data. Can be `smart`, `always` or `never`
- `sorter` (`function(query, options) {}`): A function that returns a sorting function for the given query and option including pagination and limiting. Does not need to be customized unless there is a sorting mechanism other than Feathers standard in place.
- `matcher` (`function(query)`): A function that returns a function which returns whether an item matches the original query or not.
- `let` (`function(observable) => observable`) A function that lets you modify every `Observable` created by reactive service calls. Must return an `Observable`. Example: `let: observable => observable.do(console.log)` 'injects' a `.do` into the observable chain.

#### Application level

```js
const feathers = require('feathers');
const reactive = require('feathers-reactive');

const app = feathers().configure(reactive(options));
```

#### Service level

With `feathers-reactive` configured on the application individual options can be set at the service level with `service.rx`:

```js
// Set a different id field and always re-fetch data
app.service('todos').rx({
  idField: '_id'
});
```

#### Method call level

Each method call can also pass its own options via `params.rx`:

```js
// Always fetch fresh data for this method call
app.service('todos').watch({ listStrategy: 'always' }).find();
```

### List strategies

List strategies are used to determine how a data stream behaves. Currently there are three strategies:

- `never` - Returns a stream from the service promise that only emits the method call data and never updates after that
- `smart` (default) - Returns a stream that smartly emits updated list data based on the services real-time events. It does not re-query any new data (but does not cover some cases in which the `always` strategy can be used).
- `always` - Re-runs the original query to always get fresh data from the server on any matching real-time event.

## Usage

```js
const feathers = require('feathers');
const memory = require('feathers-memory');
const rx = require('feathers-reactive');

const app = feathers()
  .configure(rx({idField: "id"}))
  .use('/messages', memory());

const messages = app.service('messages');

messages.create({
  text: 'A test message'
}).then(() => {
  // Get and watch a specific message with id 0. Emit the message data once it resolves
  // and every time it changes e.g. through an updated or patched event
  messages.watch().get(0).subscribe(message => console.log('My message', message));

  // Find and watch all messages and emit a new list every time anything changes
  messages.watch().find().subscribe(messages => console.log('Message list', messages));
  
  /* Find and watch all messages with querying functionality. 
  NOTE: make sure "value" is in the correct variable type (string, boolean, int, float) otherwise create event will not trigger the console log.
  */
  messages.watch({ listStrategy: 'always' }).find({query: {text: 'A test message'}})
  .subscribe(messages => console.log('Message list with query', messages));

    messages.create({ text: 'Another message' }).then(() =>
      setTimeout(() => messages.patch(0, { text: 'Updated message' }), 1000)
    );
  }, 1000);
});
```

Will output:

```
My message { text: 'A test message', id: 0 }
Message list [ { text: 'A test message', id: 0 } ]
Message list [ { text: 'A test message', id: 0 },
  { text: 'Another message', id: 1 } ],
Message list [ { text: 'A test message', id: 0 } ]
Message list with query { text: 'A test message', id: 0 }
Message list [ { text: 'Updated message', id: 0 },
  { text: 'Another message', id: 1 } ]
```

## Frameworks

Let's assume a simple server in `app.js` like this:

> npm install feathers feathers-socketio feathers-memory feathers-errors/handler

```js
const feathers = require('feathers');
const socketio = require('feathers-socketio');
const memory = require('feathers-memory');
const handler = require('feathers-errors/handler');

const app = feathers()
  .configure(socketio())
  .use('/todos', memory())
  .use('/', feathers.static(__dirname))
  .use(handler());

app.listen(3030);
````

### React

A real-time ReactJS Todo application (with Bootstrap styles) can look like this (see the [examples/react-todos](./examples/react-todos) folder for a working example);

> npm install react react-dom rxjs

```js
import React from 'react';
import ReactDOM from 'react-dom';
import feathers from 'feathers/client';
import socketio from 'feathers-socketio/client';
import rx from 'feathers-reactive';
import io from 'socket.io-client';

const socket = io();
const app = feathers()
  .configure(socketio(socket))
  .configure(rx());
const todos = app.service('todos');

const TodoApp = React.createClass({
  getInitialState() {
    return {
      todos: [],
      text: ''
    };
  },

  componentDidMount() {
    this.todos = todos.watch().find().subscribe(todos => this.setState({ todos }));
  },

  componentWillUnmount() {
    this.todos.unsubscribe();
  },

  updateText(ev) {
    this.setState({ text: ev.target.value });
  },

  createTodo(ev) {
    todos.create({
      text: this.state.text,
      complete: false
    });
    this.setState({ text: '' });
    ev.preventDefault();
  },

  updateTodo(todo, ev) {
    todo.complete = ev.target.checked;
    todos.patch(todo.id, todo);
  },

  deleteTodo(todo) {
    todos.remove(todo.id);
  },

  render() {
    const renderTodo = todo =>
      <li className={`page-header checkbox ${todo.complete ? 'done' : ''}`}>
        <label>
          <input type="checkbox" onChange={this.updateTodo.bind(this, todo)}
            checked={todo.complete} />
          {todo.text}
        </label>
        <a href="javascript://" className="pull-right delete"
            onClick={this.deleteTodo.bind(this, todo)}>
          <span className="glyphicon glyphicon-remove"></span>
        </a>
      </li>;

    return <div className="container" id="todos">
      <h1>Feathers real-time Todos</h1>

      <ul className="todos list-unstyled">{this.state.todos.map(renderTodo)}</ul>
      <form role="form" className="create-todo" onSubmit={this.createTodo}>
        <div className="form-group">
          <input type="text" className="form-control" name="description"
            placeholder="Add a new Todo" onChange={this.updateText}
            value={this.state.text} />
        </div>
        <button type="submit" className="btn btn-info col-md-12">
          Add Todo
        </button>
      </form>
    </div>;
  }
});

ReactDOM.render(<TodoApp />, document.getElementById('app'));
```

## License

Copyright (c) 2016

Licensed under the [MIT license](LICENSE).
