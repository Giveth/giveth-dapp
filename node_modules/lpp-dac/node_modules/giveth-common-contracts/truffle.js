module.exports = {
    networks: {
        development: {
            network_id: 15,
            host: "localhost",
            port: 8545,
            gas: 4000000,
            gasPrice: 4e9,
        },
        coverage: {
            host: "localhost",
            network_id: "*",
            port: 8555,
            gas: 0xfffffffffff,
            gasPrice: 0x01
        }
    },
    mocha: {
        enableTimeouts: false
    }
};