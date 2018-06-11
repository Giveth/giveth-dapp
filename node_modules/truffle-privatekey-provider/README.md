# truffle-privatekey-provider
Private Key provider for Web3. Used to sign transactions by provider private key

## Install

```
$ npm install truffle-privatekey-provider
```

# Usage
Provider can be used either with Web3 only or in Truffle infrastructure


## Web3 Usage


```javascript
var PrivateKeyProvider = require("truffle-privatekey-provider");
var privateKey = "62537136911bca3a7e2b....";
var provider = new PrivateKeyProvider(privateKey, "http://localhost:8545");

```

Parameters:

- `privateKey`: `string`. private key for account that would be used to sign transactions.
- `providerUri`: `string`. URI of Ethereum client to send Web3 requests.

## Truffle Usage


truffle.js
```javascript
var PrivateKeyProvider = require("truffle-privatekey-provider");

var privateKey = "62537136911bca3a7e2b....";

module.exports = {
  networks: {
    rinkeby: {
      provider: new PrivateKeyProvider(privateKey, "https://rinkeby.infura.io/"),
      network_id: 4
    },
    ....
  }
};
```
