import React from 'react'

/* check if currentUser is authenticated. If not, routes back. If yes, resolves returned promise
 *
 * @params:
 *    currentUser (string): currentUser
 *    history (history object): route history object
 *    wallet (object): wallet object
 *
 * returns:
 *   new Promise
 *    
 * usage:
 *    isAuthenticated(currentUser)
 *      .then(()=> ...do something when authenticated)
 */

export const isAuthenticated = (currentUser, history, wallet) => {
  return new Promise((resolve, reject) =>
    (!(currentUser && currentUser.address) || (wallet && !wallet.unlocked)) ? history.goBack() : resolve()
  )
}


/* if the wallet is locked, asks the user to unlock his wallet before redirecting to a route
 *
 * @params:
 *    to (string): route
 *    wallet (object): wallet object
 *    history (history object): route history object
 *
 */

export const redirectAfterWalletUnlock = (to, wallet, history) => {
  if (!wallet || (wallet && !wallet.unlocked)) {
    React.unlockWallet(to)
  } else {
    history.push(to)
  }
}



/* if the wallet is locked, asks the user to unlock his wallet, otherwise performs the action
 *
 * @params:
 *    wallet (object): wallet object
 *    action (function): function to call when the wallet is unlocked
 *
 */

export const takeActionAfterWalletUnlock = (wallet, action) => {
  if (!wallet || (wallet && !wallet.unlocked)) {
    React.unlockWallet()
  } else {
    action.call()
  }
}


/* Checks for sufficient wallet balance. 
 *
 * @params:
 *    wallet (object): wallet object
 *
 */
export const checkWalletBalance = (wallet, history) => {
  return new Promise((resolve, reject) => {
    if(wallet.getBalance() >= React.minimumWalletBalance) {
      resolve()
    } else {
      React.swal({
        title: "Insufficient wallet balance", 
        content: React.swal.msg(
          <p>
            Unfortunately you need at least Ξ{React.minimumWalletBalance} in your wallet to continue. Please transfer some Ξ to your Giveth wallet first.
          </p>
        ),
        icon: 'warning',
        buttons: ["OK", "View wallet info"]
      }).then((isConfirmed) => {
        if(isConfirmed) history.push('/wallet')
        reject('noBalance')
      });
    }
  })     
}