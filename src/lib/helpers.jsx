import React from 'react';
import 'whatwg-fetch';
import { utils } from 'web3';
import { createBrowserHistory } from 'history';
import moment from 'moment';
import BigNumber from 'bignumber.js';

import { feathersClient } from './feathersClient';
import DefaultAvatar from '../assets/avatar-100.svg';
import config from '../configuration';

export const isOwner = (address, currentUser) =>
  address !== undefined && currentUser !== undefined && currentUser.address === address;

export const getTruncatedText = (text = '', maxLength = 45) => {
  const txt = text
    .replace(/<\/(?:.|\n)*?>/gm, ' ') // replace closing tags w/ a space
    .replace(/<(?:.|\n)*?>/gm, '') // strip opening tags
    .trim();
  if (txt.length > maxLength) {
    return `${txt.substr(0, maxLength).trim()}...`;
  }
  return txt;
};

// displays a sweet alert with an error when the transaction goes wrong
export const displayTransactionError = txHash => {
  let msg;
  const { etherScanUrl } = config;
  if (txHash) {
    msg = (
      <p>
        Something went wrong with the transaction.
        <a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">
          View transaction
        </a>
      </p>
    );
    // TODO: update or remove from feathers? maybe don't remove, so we can inform the user that the
    // tx failed and retry
  } else {
    msg = <p>Something went wrong with the transaction. Is your wallet unlocked?</p>;
  }

  React.swal({
    title: 'Oh no!',
    content: React.swal.msg(msg),
    icon: 'error',
  });
};

// returns the user name, or if no user name, returns default name
export const getUserName = owner => {
  if (owner && owner.name) {
    return owner.name;
  }
  return 'Anonymous user';
};

// returns the user avatar, or if no user avatar, returns default avatar
export const getUserAvatar = owner => {
  if (owner && owner.avatar) {
    return owner.avatar;
  }
  return DefaultAvatar;
};

export const getRandomWhitelistAddress = wl => wl[Math.floor(Math.random() * wl.length)].address;

export const getGasPrice = () =>
  feathersClient
    .service('/gasprice')
    .find()
    .then(resp => {
      // let gasPrice = resp.safeLow * 1.1;
      // hack: temp while network gas is so erratic
      let gasPrice = resp.average;
      gasPrice = gasPrice > resp.average ? resp.average : gasPrice;
      // div by 10 b/c https://ethgasstation.info/json/ethgasAPI.json returns price in gwei * 10
      // we're only interested in gwei.
      // we round to prevent errors relating to too many decimals
      gasPrice = Math.round(gasPrice) / 10;

      // sometimes the API is down, we need to return a gasprice or the dapp breaks
      if (!gasPrice) gasPrice = config.defaultGasPrice;

      return utils.toWei(`${gasPrice}`, 'gwei');
    });

export const getReadableStatus = status => {
  switch (status) {
    case 'InProgress':
      return 'In progress';
    case 'NeedsReview':
      return 'Needs review';
    default:
      return status;
  }
};

export const history = createBrowserHistory();

// Get start of the day in UTC for a given date or start of current day in UTC
export const getStartOfDayUTC = date => moment.utc(date || moment()).startOf('day');

/** *
 * @param amount    BigNumber
 * @param decimals  Number
 * */
export const convertEthHelper = (amount, decimals) => {
  if (!amount) return '0';
  let amt = amount;
  if (!(amount instanceof BigNumber)) {
    amt = new BigNumber(amount);
  }
  if (amt.eq(0)) return '0';
  return amt.decimalPlaces(Number(decimals) || config.decimals, BigNumber.ROUND_DOWN).toFixed();
};

// the back button will go one lower nested route inside of the DApp
// removes the last pathname from the url and pushes that location

export const goBackOnePath = () => {
  let url = history.location.pathname.split('/');
  url.pop();
  url = url.join('/');
  history.push(url);
};

/**
 * If path is an ipfsUrl, return just the ipfs path, otherwise returns the path param
 *
 * @param {string} path the path to clean
 */
export const cleanIpfsPath = path => {
  const re = new RegExp(/\/ipfs\/\w+$/);

  const match = re.exec(path);
  if (match) {
    return match[0];
  }
  return path;
};

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const ZERO_SMALL_ADDRESS = '0x0';
export const ANY_TOKEN = {
  name: 'ANY_TOKEN',
  address: '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF',
  foreignAddress: '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF',
  symbol: 'ANY_TOKEN',
  decimals: 18,
};

export const signUpSwal = () => {
  React.swal({
    title: 'Sign Up!',
    content: React.swal.msg(
      <p>
        In order to use the Dapp, you need to use a Web3 wallet.
        <br />
        It is recommended that you install <a href="https://metamask.io/">MetaMask</a>.
      </p>,
    ),
    icon: 'info',
    buttons: ['Ok'],
  });
};

/** *
 * @param amount    BigNumber|Number|String
 * @param decimals  Number
 *
 * @return {BigNumber} amount equivalent rounded down to decimal places
 * */
export const roundBigNumber = (amount, decimals) => {
  if (!amount) return new BigNumber(0);
  const result = !(amount instanceof BigNumber) ? new BigNumber(amount) : amount;

  return result.decimalPlaces(Number(decimals || config.decimals), BigNumber.ROUND_DOWN);
};
