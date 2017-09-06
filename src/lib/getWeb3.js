import Web3 from 'web3';

let givethWeb3 = undefined;

export default () => {
  return new Promise((resolve) => {

    if (!givethWeb3) {
      givethWeb3 = new Web3(new Web3.providers.HttpProvider(process.env.ETH_NODE_CONNECTION_URL));
      givethWeb3.eth.defaultGasPrice = defaultGasPrice;
    }

    resolve(givethWeb3);
  })
}

/* ///////////// custom Web3 Functions ///////////// */

const defaultGasPrice = Web3.utils.toWei(4, 'gwei');