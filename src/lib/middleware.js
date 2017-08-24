/* check if currentUser is authenticated. If not, routes back. If yes, resolves returned promise
 *
 * @params:
 *    currentUser (string): currentUser
 *    history (history object): route history object
 *
 * returns:
 *   new Promise
 *    
 * usage:
 *    isAuthenticated(currentUser)
 *      .then(()=> ...do something when authenticated)
 */

export const isAuthenticated = (currentUser, history) => {
  return new Promise((resolve, reject) => {
    if(!currentUser) {
      history.goBack()
    } else {
      resolve()
    }
  })
}