#!/usr/bin/env node

var Paginator = require("./index"),
    paginator = new Paginator(30, 7);

var info = paginator.build(10000, 50);

console.log(info);
