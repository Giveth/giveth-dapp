import { utils } from 'web3';
import Accounts from 'web3-eth-accounts';

class BaseWallet {
  /**
   * @param provider      optional. This is necessary when signing a transaction to
   *                      retrieve chainId, gasPrice, and nonce automatically
   */
  constructor(provider) {
    // these are harcoded defaults
    this.unlocked = true;
    this.balance = '10000000000000000000';
    this.address = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0';
    this.keystores = [''];
    // this sets up the web3 account (not super sure we need this for metamask)
    this.accounts = new Accounts(provider);
    // this the private key provided by "testrpc -d"
    // meta mask and status will keep key, not us
    // so probably need to stop depending on this next line
    // to add accout to wallet
    // need to prepend the "0x" for it to work
    const testprcAddress1 = this.accounts.wallet.add('0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1');
  }

  /**
   * return the balance of the wallet
   *
   * @param unit (optional) ether, finney, wei, etc
   * @return {String}
   */
  getBalance(unit) {
    return (this.balance) ? utils.fromWei(this.balance, unit || 'ether') : undefined;
  }

  lock() {
    this.unlocked = true;
  }

  unlock(paassword) {
    if (paassword || !paassword) {
      this.unlocked = true;
    }
  }

  /**
   * @return {Array} of addresses in this wallet
   */
  getAddresses() {
    return [this.address];
  }

  /**
   * sign a transaction with the first account.
   *
   * @param     txData the txData to sign. chainId, gasPrice, and nonce are required
   * @returns   signature object. https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#signtransaction
   */
  signTransaction(txData) {
    if (!txData.gasPrice || !txData.nonce || !txData.chainId) throw new Error('gasPrice, nonce, and chainId are required');
    // here is another place where we want meta mask to take over
    return this.accounts.wallet[0].signTransaction(txData);
  }

  /**
   * sign a message with the first account
   *
   * @param msg   the message to sign
   * @returns     object containing signature data. https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#sign
   */
  signMessage(msg) {
    if (!this.unlocked) throw new Error('Locked Wallet');

    // TODO: web3 version of this wallet code

    // const accounts = mapGet.call(mapAccounts, this);

    // return accounts.wallet[0].sign(msg || '');
  }
}

export default BaseWallet;
