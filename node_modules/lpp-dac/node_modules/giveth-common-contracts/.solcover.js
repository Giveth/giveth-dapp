module.exports = {
    testCommand: 'truffle test --network coverage',
    copyNodeModules: true,
    skipFiles: [
        'SafeMath.sol',
        'ERC20.sol',
        'test/TestToken.sol',
	'test/TestPayableEscapable.sol',
	'test/TestPayableTokenEscapable.sol',
	'helpers/Migrations.sol'
    ]
}
