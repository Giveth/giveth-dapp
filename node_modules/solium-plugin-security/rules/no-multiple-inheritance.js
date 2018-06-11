/**
 * @fileoverview Discourage use of multiple inheritance
 * @author Nicolas Feignon <nfeignon@gmail.com>
 */

"use strict";

module.exports = {

    meta: {

        docs: {
            recommended: false,
            type: "off",
            description: "Discourage use of multiple inheritance"
        },

        schema: [{
            type: "object",
            properties: {
                "no-interface": { type: "boolean" }
            },
            additionalProperties: false
        }]

    },

    create: function(context) {

        let interfaces = [];
        let contracts = {};

        let noInterface = context.options && context.options[0]["no-interface"];

        function inspectInterfaceStatement(emitted) {
            if (emitted.exit || noInterface) {
                return;
            }

            interfaces.push(emitted.node.name);
        }

        function inspectContractStatement(emitted) {
            if (emitted.exit) { return; }
            let node = emitted.node;

            if (noInterface && (node.is.length > 1)) {
                context.report({
                    node: node,
                    message: `Avoid using multiple inheritance for Contract ${node.name}.`
                });
                return;
            }

            contracts[node.name] = {"parents": [], "node": node};
            for (let parent of node.is) {
                contracts[node.name].parents.push(parent.name);
            }

        }

        function inspectProgram(emitted) {
            if (!emitted.exit || noInterface) { return; }

            for (let name in contracts) {
                let contract = contracts[name];

                for (let parent of contract.parents) {
                    if (!interfaces.includes(parent) && contract.parents.length > 1) {
                        context.report({
                            node: contract.node,
                            message: `Avoid using multiple inheritance for Contract ${name}.`
                        });

                        break;
                    }
                }
            }
        }

        return {
            InterfaceStatement: inspectInterfaceStatement,
            ContractStatement: inspectContractStatement,
            Program: inspectProgram
        };

    }

};
