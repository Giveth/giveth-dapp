import { utils } from 'web3';

class BaseWallet {
  /**
   * @param provider      optional. This is necessary when signing a transaction to
   *                      retrieve chainId, gasPrice, and nonce automatically
   */
  constructor() {
    this.unlocked = true;
    this.balance = '10000000000000000000';
    this.address = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0';
    this.keystores = [''];
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
    if (!this.unlocked) throw new Error('Locked Wallet');

    // TODO: web3 version of this wallet code

    // if (!txData.gasPrice || !txData.nonce || !txData.chainId) throw new Error('gasPrice, nonce, and chainId are required');

    // const accounts = mapGet.call(mapAccounts, this);

    // return accounts.wallet[0].signTransaction(txData);
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
