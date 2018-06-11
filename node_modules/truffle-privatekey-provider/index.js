const ProviderEngine = require("web3-provider-engine");
const FiltersSubprovider = require('web3-provider-engine/subproviders/filters.js');
const WalletSubprovider = require('web3-provider-engine/subproviders/wallet.js');
const Web3Subprovider = require("web3-provider-engine/subproviders/web3.js");
const EthereumjsWallet = require('ethereumjs-wallet');
const Web3 = require("web3");


function PrivateKeyProvider(privateKey, providerUrl) {
  this.wallet = EthereumjsWallet.fromPrivateKey(new Buffer(privateKey, "hex"));
  this.address = "0x" + this.wallet.getAddress().toString("hex");

  this.engine = new ProviderEngine();

  this.engine.addProvider(new FiltersSubprovider());
  this.engine.addProvider(new WalletSubprovider(this.wallet, {}));
  this.engine.addProvider(new Web3Subprovider(new Web3.providers.HttpProvider(providerUrl)));
  this.engine.start();
}

PrivateKeyProvider.prototype.sendAsync = function() {
  this.engine.sendAsync.apply(this.engine, arguments);
};

PrivateKeyProvider.prototype.send = function() {
  return this.engine.send.apply(this.engine, arguments);
};


module.exports = PrivateKeyProvider;

