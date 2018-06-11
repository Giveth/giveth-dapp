#!/usr/bin/env node

"use strict";

/* eslint no-console: 0 */

let argv = require("yargs").argv;
let SolidityParser = require("./index.js");


let result;

try {

    if (argv.e) {
        result = SolidityParser.parse(argv.e || argv.expression);
    } else {
        result = SolidityParser.parseFile(argv.f || argv.file || argv._[0]);
    }
    console.log(JSON.stringify(result, null, 2));

} catch (e) {
    console.error(e.message);
    process.exit(1);
}
