/**
 * @fileoverview Discourage use of inheritance
 * @author Nicolas Feignon <nfeignon@gmail.com>
 */

"use strict";

module.exports = {

    meta: {

        docs: {
            recommended: false,
            type: "off",
            description: "Discourage use of inheritance"
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

        let interfaces = [], contracts = {};
        const noInterface = context.options && context.options[0]["no-interface"];

        function inspectInterfaceStatement(emitted) {
            if (emitted.exit || noInterface) {
                return;
            }

            interfaces.push(emitted.node.name);
        }

        function inspectContractStatement(emitted) {
            if (emitted.exit) { return; }
            let node = emitted.node;

            if (noInterface && (node.is.length > 0)) {
                context.report({
                    node: node,
                    message: `Avoid using inheritance for contract '${node.name}'.`
                });

                return;
            }

            contracts[node.name] = {parents: [], node: node};

            for (let parent of node.is) {
                contracts[node.name].parents.push(parent.name);
            }

        }

        function inspectProgram(emitted) {
            if (!emitted.exit || noInterface) {
                return;
            }

            for (let name in contracts) {
                let contract = contracts[name];

                for (let parent of contract.parents) {
                    if (!interfaces.includes(parent)) {
                        context.report({
                            node: contract.node,
                            message: `Avoid using inheritance for contract '${name}'.`
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
