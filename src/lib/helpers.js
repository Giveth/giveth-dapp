import { feathersClient } from './feathersClient';
import React from 'react'
import DefaultAvatar from './../assets/avatar-100.svg'

export const isOwner = (address, currentUser) => {
  // console.log('a/c', address, currentUser)
  // console.log(address !== undefined)
  // console.log(currentUser !== undefined)

  return address !== undefined && currentUser !== undefined && currentUser.address !== undefined
}


export const authenticate = wallet => {
  const authData = {
    strategy: 'web3',
    address: wallet.getAddresses()[ 0 ],
  };

  return new Promise((resolve, reject) => {
    feathersClient.authenticate(authData)
      .catch(response => {
        // normal flow will issue a 401 with a challenge message we need to sign and send to verify our identity
        if (response.code === 401 && response.data.startsWith('Challenge =')) {
          const msg = response.data.replace('Challenge =', '').trim();

          return resolve(wallet.signMessage(msg).signature);
        }
        return reject(response);
      })
  }).then(signature => {
    authData.signature = signature;
    return feathersClient.authenticate(authData)
  }).then(response => {
    console.log('Authenticated!');
    return response.accessToken;
  });
};


export const getTruncatedText = (text, maxLength) => {
  if(text.length > maxLength) {
    text = text.substr(0, maxLength)
    const lastWhitespace = text.lastIndexOf(' ')
    return text.substr(0, lastWhitespace) + "..."
  }
  return text
}

// displays a sweet alert with an error when the transaction goes wrong

export const displayTransactionError = (txHash, etherScanUrl) => {
  let msg;
  if (txHash) {
    msg = React.swal.msg(<p>Something went wrong with the transaction. <a href={`{etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">View transaction</a></p>);
    //TODO update or remove from feathers? maybe don't remove, so we can inform the user that the tx failed and retry
  } else {
    msg = React.swal.msg(<p>Something went wrong with the transaction. Is your wallet unlocked?</p>);
  }

  React.swal({
    title: "Oh no!", 
    content: msg,
    icon: 'error',
  });
}


// returns the user name, or if no user name, returns default name
export const getUserName = (owner) => {
  if(owner && owner.name) {
    return owner.name
  } else {
    return "Anonymous user"
  } 
}


// returns the user avatar, or if no user avatar, returns default avatar
export const getUserAvatar = (owner) => {
  if(owner && owner.avatar) {
    return owner.avatar
  } else {
    return DefaultAvatar
  } 
}