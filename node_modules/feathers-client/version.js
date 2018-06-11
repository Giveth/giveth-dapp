const fs = require('fs');
const pkg = require('./package.json');
const bower = require('./bower.json');

bower.version = pkg.version;

fs.writeFileSync('./bower.json', JSON.stringify(bower, null, '  '));
