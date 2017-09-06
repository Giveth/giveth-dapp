import liquidpledging from "liquidpledging";
import getWeb3 from "./getWeb3";

const LiquidPledging = liquidpledging.LiquidPledging(false);

const networks = {
  1: {
    title: "Main",
    liquidPledgingAddress: "0x0",
    etherscan: "https://etherscan.io/",
  },
  2: {
    title: "Morden",
    liquidPledgingAddress: "0x0",
    etherscan: "",
  },
  3: {
    title: "Ropsten",
    liquidPledgingAddress: "0x0",
    etherscan: "https://ropsten.etherscan.io/",
  },
  4: {
    title: "Testrpc",
    liquidPledgingAddress: "0x5b1869D9A4C187F2EAa108f3062412ecf0526b24",
    etherscan: "",
  },
};

let network = undefined;

export default () => {
  return new Promise((resolve) => {
    if (network) return resolve(network);

    return getWeb3().then(web3 => {
      web3.eth.net.getId().then(id => {
        Object.assign(network, id < 4 ? networks[id] : networks[4]);

        network.liquidPledging = new LiquidPledging(web3, network.liquidPledgingAddress);

        return network;
      })

    })
  })
}