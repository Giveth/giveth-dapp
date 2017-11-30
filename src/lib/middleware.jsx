import React from 'react';

/**
 * Check if currentUser is authenticated. If not, routes back. If yes, resolves returned promise
 *
 * @param currentUser {object} Current User object
 * @param history     {object} Standard browser history object
 * @param wallet      {object} Wallet object
 *
 * @return new Promise
 *
 * usage:
 *    isAuthenticated(currentUser)
 *      .then(()=> ...do something when authenticated)
 */

export const isAuthenticated = (currentUser, history, wallet) => new Promise(resolve =>
  (currentUser && currentUser.address && wallet && wallet.unlocked ? resolve() : history.goBack()));

/**
 * check if the currentUser is in a particular whitelist. If not, route back.
 * If yes, resolve promise
 *
 * @param currentUser {object} Current User object
 * @param whitelist   {array}  Array of whitelisted addresses
 * @param history     {object} Standard browser history object
 *
 * @return new Promise
 *
 * usage:
 *    isInWhitelist(currentUser, whitelist)
 *      .then(()=> ...do something when in whitelist)
 */

export const isInWhitelist = (currentUser, whitelist, history) => new Promise(resolve =>
  (whitelist.length === 0 || (currentUser && currentUser.address && whitelist.indexOf(currentUser.address.toLowerCase()) > -1)
    ? resolve() : console.log('not in whitelist') && history.goBack()));


/**
 * If the wallet is locked, asks the user to unlock his wallet before redirecting to a route
 *
 * @param wallet  {object} Wallet object
 * @param history {object} Standard history object
 * @param to      {string} Route to which the user should be redirected
 */

export const redirectAfterWalletUnlock = (to, wallet, history) => {
  if (!wallet || (wallet && !wallet.unlocked)) {
    React.unlockWallet(to);
  } else {
    history.push(to);
  }
};


/**
 * If the wallet is locked, asks the user to unlock his wallet, otherwise performs the action
 *
 * @param wallet {object}   Wallet object
 * @param action {function} Function to call when the wallet is unlocked
 *
 */

export const takeActionAfterWalletUnlock = (wallet, action) => {
  if (!wallet || (wallet && !wallet.unlocked)) {
    React.unlockWallet();
  } else {
    action.call();
  }
};


/**
 * Checks for sufficient wallet balance.
 *
 * @param wallet  {object} Wallet object
 * @param history {object} Standard history object
 *
 */
export const checkWalletBalance = (wallet, history) => new Promise((resolve, reject) => {
  if (wallet.getBalance() >= React.minimumWalletBalance) {
    resolve();
  } else {
    React.swal({
      title: 'Insufficient wallet balance',
      content: React.swal.msg(<p>
            Unfortunately you need at least Ξ{React.minimumWalletBalance} in your wallet to
            continue. Please transfer some Ξ to your Giveth wallet first.
                              </p>),
      icon: 'warning',
      buttons: ['OK', 'View wallet info'],
    }).then((isConfirmed) => {
      if (isConfirmed) history.push('/wallet');
      reject(new Error('noBalance'));
    });
  }
});
