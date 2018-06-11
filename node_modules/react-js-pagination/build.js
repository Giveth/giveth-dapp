var UglifyJS = require("uglify-js");
var fs = require("fs");
var babel = require("babel-core");
var mkdirp = require("mkdirp");

mkdirp("dist", function(err) {
  fs.writeFileSync(
    "./dist/Pagination.js",
    UglifyJS.minify(babel.transformFileSync("src/components/Pagination.js", {}).code).code
  );

  fs.writeFileSync(
    "./dist/Page.js",
    UglifyJS.minify(babel.transformFileSync("src/components/Page.js", {}).code).code
  );
});
