"use strict";

const PEG = require("pegjs");
const fs = require("fs");
const path = require("path");

const builtParsers = {
    "solidity": require("./build/parser"),
    "imports": require("./build/imports_parser")
};


function parseComments(sourceCode) {
    // for Line comment regexp, the "." doesn't cover line termination chars so we're good :)
    const comments = [], commentParser = /(\/\*(\*(?!\/)|[^*])*\*\/)|(\/\/.*)/g;
    let nextComment;

    // eslint-disable-next-line no-cond-assign
    while (nextComment = commentParser.exec(sourceCode)) {
        const text = nextComment[0], types = { "//": "Line", "/*": "Block" };

        comments.push({
            text,
            type: types[text.slice(0, 2)],
            start: nextComment.index,
            end: nextComment.index + text.length
        });
    }

    return comments;
}


// TODO: Make all this async.
module.exports = {
    getParser: function(parser_name, rebuild) {
        if (rebuild == true) {
            let parserfile = fs.readFileSync(path.resolve("./" + parser_name + ".pegjs"), {encoding: "utf8"});
            return PEG.generate(parserfile);
        } else {
            return builtParsers[parser_name];
        }
    },
    parse: function(source, options, parser_name, rebuild) {
        if (typeof parser_name == "boolean") {
            rebuild = parser_name;
            parser_name = null;
        }

        if (parser_name == null) {
            parser_name = "solidity";
        }

        let parser = this.getParser(parser_name, rebuild);
        let result;

        try {
            result = parser.parse(source);
        } catch (e) {
            if (e instanceof parser.SyntaxError) {
                e.message += " Line: " + e.location.start.line + ", Column: " + e.location.start.column;
            }
            throw e;
        }

        if (typeof options === "object" && options.comment === true) {
            result.comments = parseComments(source);
        }

        return result;
    },
    parseFile: function(file, parser_name, rebuild) {
        return this.parse(fs.readFileSync(path.resolve(file), {encoding: "utf8"}), parser_name, rebuild);
    },
    parseComments
};
