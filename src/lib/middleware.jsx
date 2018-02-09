import React from 'react';
import { history } from '../lib/helpers';

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
 *    isAuthenticated(currentUser, wallet)
 *      .then(()=> ...do something when authenticated)
 */
export const isAuthenticated = (currentUser, wallet) =>
  new Promise(resolve => {
    if (currentUser && currentUser.address && wallet && wallet.unlocked) resolve();
    else history.goBack();
  });

/**
 * check if the currentUser is in a particular whitelist. If not, route back.
 * If yes, resolve promise
 *
 * @param currentUser {object} Current User object
 * @param whitelist   {array}  Array of whitelisted addresses
 *
 * @return new Promise
 *
 * usage:
 *    isInWhitelist(currentUser, whitelist)
 *      .then(()=> ...do something when in whitelist)
 */
export const isInWhitelist = (currentUser, whitelist) =>
  new Promise((resolve, reject) => {
    if (
      whitelist.length === 0 ||
      (currentUser && currentUser.address
        whitelist.find((u) => u.address.toLowerCase() === currentUser.address.toLowerCase()))
    ) {
      resolve();
    } else {
      reject('not in whitelist');
    }
  });

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
    action();
  }
};

/**
 * Checks for sufficient wallet balance.
 *
 * @param wallet  {object} Wallet object
 * @param history {object} Standard history object
 *
 */
export const checkWalletBalance = (wallet, history) =>
  new Promise((resolve, reject) => {
    if (wallet.getBalance() >= React.minimumWalletBalance) {
      resolve();
    } else {
      React.swal({
        title: 'Insufficient wallet balance',
        content: React.swal.msg(
          <p>
            Unfortunately you need at least Ξ{React.minimumWalletBalance} in your wallet to
            continue. Please transfer some Ξ to your Giveth wallet first.
          </p>,
        ),
        icon: 'warning',
        buttons: ['OK', 'View wallet info'],
      }).then(isConfirmed => {
        if (isConfirmed) history.push('/wallet');
        reject(new Error('noBalance'));
      });
    }
  });

/**
 * Confirms blockchain tx with user before making the tx
 *
 * @param wallet  {object} Wallet object
 * @param history {object} Standard history object
 *
 */
export const confirmBlockchainTransaction = (onConfirm, onCancel) =>
  React.swal({
    title: 'Send transaction?',
    text:
      'The action you are trying to perform will create a blockchain transaction. Please confirm to make the transaction.',
    icon: 'warning',
    dangerMode: true,
    buttons: ['Cancel', 'Yes, execute transaction'],
  }).then(isConfirmed => {
    if (isConfirmed) onConfirm();
    else onCancel();
  });
