const Web3 = require('web3');
const { LiquidPledging, LPVault } = require('./index');

const web3 = new Web3('http://localhost:8545');

async function deploy() {
  const accounts = await web3.eth.getAccounts();
  const escapeHatch = accounts[0];
  const vault = await LPVault.new(web3, escapeHatch, escapeHatch);
  const liquidPledging = await LiquidPledging.new(web3, vault.$address, escapeHatch, escapeHatch);//, {gas: 58000000});
  await vault.setLiquidPledging(liquidPledging.$address);

  console.log('vault Address: ', vault.$address);
  console.log('liquidPledging Address: ', liquidPledging.$address);
  process.exit(); // some reason, this script won't exit. I think it has to do with web3 subscribing to tx confirmations?
}

deploy();
