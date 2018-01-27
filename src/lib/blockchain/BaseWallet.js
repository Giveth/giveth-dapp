import { utils } from 'web3';

class BaseWallet {
  /**
   * @param provider      optional. This is necessary when signing a transaction to
   *                      retrieve chainId, gasPrice, and nonce automatically
   */
  constructor(provider, web3 = () => {}) {
    // metamask account address is only made available within call back
    // https://ethereum.stackexchange.com/questions/16962/metamask-web3-geth-account0-is-undefined
    web3.eth.getAccounts((error, accounts) => {
      // TODO: handle error
      if (error) alert('error getting eth accounts');
      // TODO: error if zero length accounts returned
      if (accounts.length === 0)
        alert(
          '0 accounts found in provided web3 object. Perhaps you need to log into you web3 browser or extension.'
        );
      // define from address property
      this.fromAddress = accounts[0];
    });
    // add this here for convenience but perhaps should just be relied upon from browser
    this.web3 = web3;
    // hardcoded wallet fields depended upon somewhere
    // faking these until I learn more and come up with idea to handle
    this.unlocked = true;
    this.keystores = [''];
  }

  /**
   * return the balance of the wallet
   *
   * @param unit (optional) ether, finney, wei, etc
   * @return {String}
   */
  getBalance(unit) {
    // return (this.balance) ? utils.fromWei(this.balance, unit || 'ether') : undefined;
    // no idea of this works but figured it should look something like this maybe
    // TODO: test this at least once
    return this.web3.eth.getBalance(this.fromAddress, (error, result) => {
      if (!error) {
        console.log(result.toNumber());
        return utils.fromWei(result, unit || 'ether');
      }
      console.error(error);
      return undefined;
    });
  }

  // fake function to satisfy dapp expectations on internal wallet
  // TODO: think about this more and figure out solution
  lock() {
    this.unlocked = true;
  }


  // fake function to satisfy dapp expectations on internal wallet
  // TODO: think about this more and figure out solution
  unlock(password) {
    return new Promise((resolve, reject) => {
      if (this.unlocked || !this.unlocked) {
        return resolve(true);
      }
    });
  }

  /**
   * @return {Array} of addresses in this wallet
   */
  getAddresses() {
    // might make sense to add a check for valid address and error if not
    return [this.fromAddress];
  }

  /**
   * sign a transaction with the first account.
   *
   * @param     txData the txData to sign. chainId, gasPrice, and nonce are required
   * @returns   signature object. https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#signtransaction
   */
  signTransaction(txData) {
    if (!txData.gasPrice || !txData.nonce || !txData.chainId)
      throw new Error('gasPrice, nonce, and chainId are required');
    return this.web3.eth.signTransaction(txData);
  }

  /**
   * sign a message with the first account
   *
   * @param msg   the message to sign
   * @returns     object containing signature data. https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#sign
   */
  signMessage(msg) {
    // msg and from are in different order in web3-1.x from previous versions
    return this.web3.eth.sign(msg, this.fromAddress);
  }
}

export default BaseWallet;
