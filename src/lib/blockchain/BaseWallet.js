import { utils } from 'web3';
import localforage from 'localforage';

class BaseWallet {
  /**
   * @param provider      optional. This is necessary when signing a transaction to
   *                      retrieve chainId, gasPrice, and nonce automatically
   * @param web3          optional. Using dependency injection for testability
   */
  constructor(provider, web3 = {}) {
    debugger;
    if (web3.eth) {
      // metamask account address is only made available within call back
      // https://ethereum.stackexchange.com/questions/16962/metamask-web3-geth-account0-is-undefined
      web3.eth.getAccounts((error, accounts) => {
        // TODO: handle error
        if (error) alert('error getting eth accounts');
        // TODO: error if zero length accounts returned
        if (accounts.length === 0)
          alert(
            'Zero accounts found in provided web3 object. You may need to log into a web3 browser or extension.',
          );
        // TODO: this isn't working fromAddress is undefined sometimes
        // need to bind fromAddress to wallet correctly
        // define from address property
        this.fromAddress = accounts[0];
        debugger;
      });
    } else {
      alert('web3.eth is not defined');
    }
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
    debugger;
    return this.web3.eth.getBalance(this.fromAddress, (error, result) => {
      if (!error) {
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

  /**
   * generate a dapp wallet representation of web injected wallet
   * @param provider - optional
   * @param password - password to encrypt the wallet with
   */
  static createWallet(provider, password) {
    // declare web3 from window
    const { web3 } = window;
    const wallet = new BaseWallet(provider, web3);
    return new Promise(resolve => {
      resolve(Promise.resolve(wallet));
    });
  }

  /**
   * some type checking thing broke
   * so I put this here to copy GivethWallet
   * locally caches the keystores in storage
   */
  cacheKeystore() {
    localforage.setItem('keystore', this.keystores);
  }
}

export default BaseWallet;
