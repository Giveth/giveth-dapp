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
    (!currentUser || (wallet && !wallet.unlocked)) ? history.goBack() : resolve()
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