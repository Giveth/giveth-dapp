/* global window */
import { utils } from 'web3';

/**
 * Wallet to handle ethereum accounts. While this wallet can store multiple accounts,
 * we currently sign using only the first account.
 *
 * TODO: Remove this after migrating to injected providers
 */
class Web3Wallet {
  constructor(web3) {
    this.web3 = web3;
    // this.unlocked = false;
    this.balance = undefined;
    this.homeBalance = undefined;
    this.tokenBalances = {};
  }

  /**
   * return the balance of the wallet on the foreign network
   *
   * @param unit (optional) ether, finney, wei, etc
   * @return {String}
   */
  getBalance(unit) {
    return this.balance ? utils.fromWei(this.balance, unit || 'ether') : undefined;
  }

  /**
   * return the balance of the wallet on the home network
   *
   * @param unit (optional) ether, finney, wei, etc
   * @return {String}
   */
  getHomeBalance(unit) {
    return this.homeBalance ? utils.fromWei(this.homeBalance, unit || 'ether') : undefined;
  }

  getTokenBalance(address, unit) {
    return this.tokenBalances[address]
      ? utils.fromWei(this.tokenBalances[address], unit || 'ether')
      : undefined;
  }

  /**
   * sign a transaction with the first account.
   *
   * @param     txData the txData to sign. chainId, gasPrice, and nonce are required
   * @returns   signature object. https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#signtransaction
   */
  // signTransaction(txData) {
  //   if (!this.unlocked) return Promise.reject(new Error('Locked Wallet'));

  //   if (!txData.gasPrice || (!txData.nonce && txData.nonce < 0) || !txData.chainId)
  //     return Promise.reject(new Error('gasPrice, nonce, and chainId are required'));

  //   const accounts = mapGet.call(mapAccounts, this);

  //   // signTransaction returns a promise sometimes, but not always
  //   return Promise.resolve(accounts.wallet[0].signTransaction(txData));
  // }

  /**
   * sign a message with the first account
   *
   * @param msg   the message to sign
   * @returns     object containing signature data. https://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#sign
   */
  async signMessage(msg) {
    if (!this.web3.defaultNode)
      throw new Error('Wallet using default node, not user provided wallet');

    try {
      await this.web3.enable();
    } catch (e) {
      return;
    }

    return this.web3.eth.sign(msg || '');
  }

  /**
   * @return {Array} of addresses in this wallet
   */
  async getAddresses() {
    try {
      return (await this.web3.eth.enable()).map(addr => Web3Wallet.fixAddress(addr));
    } catch (e) {
      return [];
    }
  }

  /**
   * normalize an address to the 0x form
   */
  static fixAddress(addr) {
    return addr.toLowerCase().startsWith('0x') ? addr : `0x${addr}`;
  }
}

export default Web3Wallet;
