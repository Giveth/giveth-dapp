# Giveth Bridge

Giveth specific bridge between 2 ethereum based blockchains

## General idea

home chain -> foreign chain:

`GivethBridge` contract will be deployed on the home chain. When one `donate` functions are called, the sent value is locked in the bridge and an event is emitted. A node app will be watching for events and relay to the foreignChain, calling the `deposit` function. This will mint tokens and forward the donation to the liquidPledging contract.

foreign chain -> home chain:

`ForeignGivethBridge` contract will be deployed on the foreign chain. When a user wants to move tokens to the home chain they will call the `withdraw` function. The tokens will then be burnt and an event is emitted. A node app will be watching for events and relay to the homeChain, calling the `authorizePayment` function.
Once the payment is approved, the sender will be able to collect their funds from the `GivethBridge` contract.

The `GivethBridge` contract is an extension of the vault, which provides a safe and secure way to store funds. Vist [the vault repo](https://github.com/giveth/vaultcontract#readme) to lean more about the vault.

Currently these contracts are a temporary solution until, a more robust bridging system is ready. Both contracts are pausable which will allow use to migrate to a new bridge at a future date.

# Config

See `config/default.json` for example. This will be loaded and extended by additional configuration if found. You can specify the `ENVIRONMENT` env variable to load the file `config/${ENVIRONMENT}.json` if found. `ENVIRONMENT` defaults to `local`.

`homeNodeUrl`: ethereum node connection url for homeBridge
`homeBridge`: address of the home bridge
`homeConfirmations`: # of confirmations required before relaying tx to foreignBridge
`foreignNodeUrl`: ethereum node connection url for foreignBridge
`foreignBridge`: address of the foreign bridge
`foreignConfirmations`: # of confirmations required before relaying tx to homeBridge
`pollTime`: how often in seconds to check for txs to relay
`liquidPledging`: address of liquidPledging contract on foreign network
`pk`: pk of the account to send txs from

If you would like to receive an email on any errors, the following are required:

    `mailApiKey`: mailgun api key
    `mailDomain`: mailgun domain
    `mailFrom`: address to send mail from
    `mailTo`: address sto send mail to

## Help
Reach out to us on [join](http://join.giveth.io) for any help or to share ideas.
