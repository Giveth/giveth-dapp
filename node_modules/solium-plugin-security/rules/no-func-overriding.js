/**
 * @fileoverview Discourage function overriding
 * @author Nicolas Feignon <nfeignon@gmail.com>
 */

"use strict";

module.exports = {

    meta: {

        docs: {
            recommended: false,
            type: "off",
            description: "Discourage function overriding"
        },

        schema: []

    },

    // This rule can currently only catch overriding if both child & parent contract are in the same file.
    // If parent contract is in some other file, rule simply ignores the child contract.
    create: function(context) {

        let contracts = {};

        function inspectContractStatement(emitted) {
            if (emitted.exit) { return; }
            const node = emitted.node;

            contracts[node.name] = {"functions": {}, "parents": [], "node": node};
            for (let expr of node.body) {
                if (expr.type !== "FunctionDeclaration" || !expr.name) { continue; }

                let signature = [];
                if (expr.params) {
                    for (let param of expr.params) {
                        signature.push(param.literal.literal);
                    }
                }

                contracts[node.name].functions[expr.name] = signature;
            }

            for (let parent of node.is) {
                contracts[node.name].parents.push(parent.name);
            }
        }

        function inspectProgram(emitted) {
            if (!emitted.exit) { return; }

            for (let name in contracts) {
                let contract = contracts[name];
                if (contract.parents.length === 0) { continue; }    // top-level contract, ignore

                for (let func_name in contract.functions) {
                    inspectHigherLevelContracts(name, func_name, name);
                }
            }
        }

        function inspectHigherLevelContracts(contract_name, func_name, origin) {
            let contract = contracts[contract_name];
            for (let parent of contract.parents) {
                if (!Object.keys(contracts).includes(parent)) { continue; }

                let sameName = Object.keys(contracts[parent].functions).includes(func_name);
                let sameSignature = true;

                if (sameName) {     // do we have functions with the same name
                    let func_args = contracts[origin].functions[func_name];
                    let parent_func_args = contracts[parent].functions[func_name];

                    // Compare signatures of both functions
                    if (func_args.length === parent_func_args.length) {
                        for (let i = 0; i < func_args.length; i++) {
                            if (func_args[i] !== parent_func_args[i]) {
                                sameSignature = false;
                                break;
                            }
                        }
                    } else {
                        sameSignature = false;
                    }
                }

                if (sameName && sameSignature) {
                    context.report({
                        node: contracts[origin].node,
                        message: `${func_name} redefined in contract ${origin}. Avoid function overriding.`
                    });
                }

                inspectHigherLevelContracts(parent, func_name, origin);     // inspect parent to go up in the inheritance chain
            }
        }

        return {
            ContractStatement: inspectContractStatement,
            Program: inspectProgram
        };

    }

};
