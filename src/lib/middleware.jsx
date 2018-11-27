// TO DO: move all this to UserProvider
import React from 'react';
import { history } from './helpers';
import { feathersClient } from './feathersClient';
import getWeb3 from './blockchain/getWeb3';
import config from '../configuration';

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
    if (currentUser && currentUser.address && currentUser.authenticated) resolve();
    else {
      // this refers to UserProvider
      React.signIn();
      reject();
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

      const res = await React.swal({
        title: 'You need to sign in!',
        text:
          // 'By signing in we are able to provide instant updates to the app after you take an action. The signin process simply requires you to verify that you own this address by signing a randomly generated message. If you choose to skip this step, the app will not reflect any actions you make until the transactions have been mined.',
          'In order to provide the best experience possible, we are going to ask you to sign a randomly generated message proving that you own the current account. This will enable us to provide instant updates to the app after any action.',
        icon: 'info',
        buttons: [false, 'OK'],
      });

      if (!res) {
        history.goBack();
        return false;
      }

      React.swal({
        title: 'Please sign the MetaMask transaction...',
        text:
          "A MetaMask transaction should have popped-up. If you don't see it check the pending transaction in the MetaMask browser extension. Alternatively make sure to check that your popup blocker is disabled.",
        icon: 'success',
        button: false,
      });

      // we have to wrap in a timeout b/c if you close the chrome window MetaMask opens, the promise never resolves
      const signOrTimeout = () =>
        new Promise(async resolve => {
          const timeOut = setTimeout(() => {
            resolve(false);
            history.goBack();
            React.swal.close();
          }, 10000);

          try {
            const signature = await web3.eth.personal.sign(msg, address);
            authData.signature = signature;
            await feathersClient.authenticate(authData);
            React.swal.close();
            clearTimeout(timeOut);
            resolve(true);
          } catch (e) {
            clearTimeout(timeOut);
            history.goBack();
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

  return currentUser.authenticated;
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
 * Check if the user is connected to the foreign network
 */
export const checkForeignNetwork = async isForeignNetwork => {
  // already on correct network
  if (isForeignNetwork) return;

  // we block the user b/c MetaMask will reload the page on a network change
  await React.swal({
    title: 'Network Change Required!',
    text: `Please connect to the ${
      config.foreignNetworkName
    } network before proceeding. Depending on your provider, the page will be reloaded upon changing the network which may result in loosing data`,
    icon: 'warning',
  });
};

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
    (Array.isArray(whitelist) && whitelist.length === 0) ||
    (Array.isArray(whitelist) &&
      currentUser &&
      currentUser.address &&
      whitelist.find(u => u.address.toLowerCase() === currentUser.address.toLowerCase()))
  ) {
    return true;
  }
  return false;
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
    if (balance && balance.gte(React.minimumWalletBalanceInWei)) {
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
      });
    }
  });
