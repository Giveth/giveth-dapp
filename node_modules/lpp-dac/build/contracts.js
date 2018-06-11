const fs = require("fs");
const generateClass = require('eth-contract-class').default;

const contracts = {};
fs.readdirSync(__dirname).forEach(file => {
    if ( /^.*\.sol\.js$/.test(file)) {
        const f = require("./" + file);
        Object.keys(f).forEach((k) => {
            const res = /^(.*)Abi$/.exec(k);
            if (res) {
                const contractName = res[1];
                if (f[contractName+"ByteCode"].length > 2) {
                    contracts[contractName] = generateClass(f[contractName+"Abi"], f[contractName+"ByteCode"]);
                }
            }
        });
    }
});

module.exports = contracts;
