/**
 * @fileoverview Tests for plugin entry point
 * @author Raghav Dua <duaraghav8@gmail.com>
 */

"use strict";

const SoliumSecurityPlugin = require("../index");

describe("Check Plugin's exported object", () => {
    it("should export an object containing plugin metadata & rule info", done => {
        SoliumSecurityPlugin.should.be.type("object");
        SoliumSecurityPlugin.should.have.size(2);

        SoliumSecurityPlugin.should.have.ownProperty("meta");
        SoliumSecurityPlugin.should.have.ownProperty("rules");

        const { meta, rules } = SoliumSecurityPlugin;

        meta.should.type("object");
        meta.should.have.size(1);
        meta.should.have.ownProperty("description");
        meta.description.should.be.type("string");

        rules.should.be.type("object");
        rules.should.have.size(32); // This number changes every time we add/remove a rule in index.js.

        for (let ruleName in rules) {
            rules[ruleName].should.be.type("object");
        }

        done();
    });
});
