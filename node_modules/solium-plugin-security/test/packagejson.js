/**
 * @fileoverview Tests for package.json
 * @author Raghav Dua <duaraghav8@gmail.com>
 */

"use strict";

const packageJSON = require("../package.json");


describe("Checking package.json", () => {

    it("should enforce fixed versions on certain dependencies", done => {
        const fixedDeps = [];
        const fixedDevDeps = ["solium"];
        const deps = packageJSON.dependencies, devDeps = packageJSON.devDependencies;


        fixedDeps.forEach(fd => {
            /^[0-9]$/.test(deps[fd][0]).should.be.true();
        });

        fixedDevDeps.forEach(fdd => {
            /^[0-9]$/.test(devDeps[fdd][0]).should.be.true();
        });

        done();
    });

});
