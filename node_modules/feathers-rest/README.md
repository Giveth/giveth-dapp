# feathers-rest

> _Important:_ For Feathers v3.0.0 and later, `feathers-rest` is has been replaced by framework specific adapters. Use `@feathersjs/express` and `@feathersjs/express/rest` provided in that module instead.

[![Greenkeeper badge](https://badges.greenkeeper.io/feathersjs-ecosystem/feathers-rest.svg)](https://greenkeeper.io/)

[![Build Status](https://travis-ci.org/feathersjs-ecosystem/feathers-rest.png?branch=master)](https://travis-ci.org/feathersjs-ecosystem/feathers-rest)
[![Code Climate](https://codeclimate.com/github/feathersjs-ecosystem/feathers-rest/badges/gpa.svg)](https://codeclimate.com/github/feathersjs-ecosystem/feathers-rest)
[![Test Coverage](https://codeclimate.com/github/feathersjs-ecosystem/feathers-rest/badges/coverage.svg)](https://codeclimate.com/github/feathersjs-ecosystem/feathers-rest/coverage)
[![Dependency Status](https://img.shields.io/david/feathersjs-ecosystem/feathers-rest.svg?style=flat-square)](https://david-dm.org/feathersjs-ecosystem/feathers-rest)
[![Download Status](https://img.shields.io/npm/dm/feathers-rest.svg?style=flat-square)](https://www.npmjs.com/package/feathers-rest)
[![Slack Status](http://slack.feathersjs.com/badge.svg)](http://slack.feathersjs.com)

> The Feathers REST API provider

## About

This provider exposes [Feathers](http://feathersjs.com) services through a RESTful API using [Express](http://expressjs.com) that can be used with Feathers 1.x and 2.x as well as client support for Fetch, jQuery, Request, Superagent, axios and angular2+'s HTTP Service.

__Note:__ For the full API documentation go to [https://docs.feathersjs.com/api/rest.html](https://docs.feathersjs.com/api/rest.html).

## Quick example

```js
import feathers from 'feathers';
import bodyParser from 'body-parser';
import rest from 'feathers-rest';

const app = feathers()
  .configure(rest())
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .use(function(req, res, next) {
    req.feathers.data = 'Hello world';
    next();
  });

app.use('/:app/todos', {
  get: function(id, params) {
    console.log(params.data); // -> 'Hello world'
    console.log(params.app); // will be `my` for GET /my/todos/dishes

    return Promise.resolve({
      id,
      params,
      description: `You have to do ${name}!`
    });
  }
});
```

## Client use

```js
import feathers from 'feathers/client';
import rest from 'feathers-rest/client';

import jQuery from 'jquery';
import request from 'request';
import superagent from 'superagent';
import axios from 'axios';
import {Http, Headers} from '@angular/http';


const app = feathers()
  .configure(rest('http://baseUrl').jquery(jQuery))
  // or
  .configure(rest('http://baseUrl').fetch(window.fetch.bind(window)))
  // or
  .configure(rest('http://baseUrl').request(request))
  // or
  .configure(rest('http://baseUrl').superagent(superagent))
  // or
    .configure(rest('http://baseUrl').axios(axios))
  // or (using injected Http instance)
    .configure(rest('http://baseUrl').angular(http, { Headers }))
```

## License

Copyright (c) 2015

Licensed under the [MIT license](LICENSE).
