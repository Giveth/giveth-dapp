import React from 'react';
import { history } from './helpers';
import { feathersClient } from './feathersClient';
import getWeb3 from './blockchain/getWeb3';

/**
 * Check if there is a currentUser. If not, routes back. If yes, resolves returned promise
 *
 * @param currentUser {object} Current User object
 * @param history     {object} Standard browser history object
 *
 * @return new Promise
 *
 * usage:
 *    isLoggedIn(currentUser)
 *      .then(()=> ...do something when logged in)
 *      .catch((err) ...do something when not logged in
 *      returns new Error 'notLoggedIn' if not logged in
 */
export const isLoggedIn = currentUser =>
  new Promise((resolve, reject) => {
    if (currentUser && currentUser.address) resolve();
    else {
      React.swal({
        title: 'Oops! You need to unlock you wallet!',
        content: React.swal.msg(<p>Oops! You need to unlock your wallet to view this page.</p>),
        icon: 'warning',
        buttons: ['Ok'],
      }).then(() => {
        history.push('/');
        reject(new Error('notLoggedIn'));
      });
    }
  });

const authenticate = async address => {
  const web3 = await getWeb3();

  const authData = {
    strategy: 'web3',
    address,
  };

  const accessToken = await feathersClient.passport.getJWT();
  if (accessToken) {
    const payload = await feathersClient.passport.verifyJWT(accessToken);
    if (address === payload.userId) {
      await feathersClient.authenticate(); // authenticate the socket connection
      return true;
    }
    await feathersClient.logout();
  }

  try {
    await feathersClient.authenticate(authData);
    return true;
  } catch (response) {
    // normal flow will issue a 401 with a challenge message we need to sign and send to
    // verify our identity
    if (response.code === 401 && response.data.startsWith('Challenge =')) {
      const msg = response.data.replace('Challenge =', '').trim();

      await React.swal({
        title: 'Sign In!',
        text:
          // 'By signing in we are able to provide instant updates to the app after you take an action. The signin process simply requires you to verify that you own this address by signing a randomly generated message. If you choose to skip this step, the app will not reflect any actions you make until the transactions have been mined.',
          'In order to provide the best experience possible, we are going to ask you to sign a randomly generated message proving that you own the current account. This will enable us to provide instant updates to the app after any action.',
        icon: 'info',
      });

      // we have to wrap in a timeout b/c if you close the chrome window MetaMask opens, the promise never resolves
      const signOrTimeout = () =>
        new Promise(async resolve => {
          setTimeout(() => resolve(false), 7000);

          try {
            const signature = await web3.eth.personal.sign(msg, address);
            authData.signature = signature;
            await feathersClient.authenticate(authData);
            resolve(true);
          } catch (e) {
            resolve(false);
          }
        });

      return signOrTimeout();
    }
  }
  return false;
};

let authPromise;
/**
 * Attempt to authenticate the feathers connection for the currentUser
 * if not already authenticated
 *
 * @param {User} currentUser Current User object
 *
 * @returns {boolean} true if authenticate, otherwise false
 */
export const authenticateIfPossible = async currentUser => {
  if (authPromise) return !!(await authPromise);
  if (!currentUser || !currentUser.address) return false;

  if (currentUser.authenticated) return true;

  // prevent asking user to sign multiple msgs if currently authenticating
  authPromise = authenticate(currentUser.address);
  currentUser.authenticated = await authPromise;
  authPromise = undefined;

  return false;
};

/**
 * Check if the user has registered a profile. If not, ask the user to register one.
 */
export const checkProfile = async currentUser => {
  // already created a profile
  if (!currentUser || currentUser.name) return;

  const redirect = await React.swal({
    title: 'Please Register!',
    text:
      'It appears that you have not yet created your profile. In order to gain the trust of givers, we strongly recommend creating your profile!',
    icon: 'info',
    buttons: ['Skip', 'Create My Profile!'],
  });
  if (redirect) history.push('/profile');
};

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
 *      .catch((err) ...do something when not authenticated
 *      returns new Error 'notAuthenticated' if not authenticated
 */
export const isAuthenticated = (currentUser, wallet) =>
  new Promise((resolve, reject) => {
    if (currentUser && currentUser.address && wallet && wallet.unlocked) resolve();
    else {
      history.push('/');
      reject(new Error('notAuthenticated'));
    }
  });

/**
 * check if the currentUser is in a particular whitelist.
 *
 * @param currentUser {object} Current User object
 * @param whitelist   {array}  Array of whitelisted addresses
 *
 * @return boolean
 *
 */
export const isInWhitelist = (currentUser, whitelist) => {
  if (
    (whitelist && whitelist.length === 0) ||
    (currentUser &&
      currentUser.address &&
      whitelist.find(u => u.address.toLowerCase() === currentUser.address.toLowerCase()))
  ) {
    return true;
  }
  return false;
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
    React.unlockWallet(action);
  } else {
    action();
  }
};

/**
 * If the wallet is locked, asks the user to unlock his wallet before redirecting to a route
 *
 * @param wallet  {object} Wallet object
 * @param history {object} Standard history object
 * @param to      {string} Route to which the user should be redirected
 */
export const redirectAfterWalletUnlock = (to, wallet) => {
  takeActionAfterWalletUnlock(wallet, () => history.push(to));
};

/**
 * Checks for sufficient wallet balance.
 *
 * @param balance {BN} balance object
 * @param history {object} Standard history object
 *
 */
export const checkBalance = balance =>
  new Promise(resolve => {
    if (balance.gte(React.minimumWalletBalanceInWei)) {
      resolve();
    } else {
      React.swal({
        title: 'Insufficient wallet balance',
        content: React.swal.msg(
          <p>
            Unfortunately you need at least {React.minimumWalletBalance} ETH in your wallet to
            continue. Please transfer some ETH to your wallet first.
          </p>,
        ),
        icon: 'warning',
        // buttons: ['OK', 'View wallet info'],
        // }).then(isConfirmed => {
        // if (isConfirmed) history.push('/wallet');
        // reject(new Error('noBalance'));
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
