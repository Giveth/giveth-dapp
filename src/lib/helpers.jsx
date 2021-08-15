import React, { Fragment } from 'react';
import { Modal, Button } from 'antd';
import { createBrowserHistory } from 'history';
import moment from 'moment';
import BigNumber from 'bignumber.js';
import Resizer from 'react-image-file-resizer';

import DefaultAvatar from '../assets/avatar-100.svg';
import config from '../configuration';
import { sendAnalyticsPage } from './SegmentAnalytics';

export const shortenDescription = (description, showAll = false, onClick, charsLength = 110) => {
  if (!description) {
    return '';
  }
  if (description.length < charsLength || showAll) {
    return description;
  }

  return (
    <Fragment>
      {`${description.slice(0, charsLength)} ...`}
      <Button onClick={onClick} type="link" className="px-2 py-0">
        See more
      </Button>
    </Fragment>
  );
};

export const shortenAddress = (address, charsLength = 4) => {
  const prefixLength = 2; // "0x"
  if (!address) {
    return '';
  }
  if (address.length < charsLength * 2 + prefixLength) {
    return address;
  }
  return `${address.slice(0, charsLength + prefixLength)}…${address.slice(-charsLength)}`;
};

export const isOwner = (address, currentUser) =>
  address !== undefined && currentUser.address === address;

export const getHtmlText = text => {
  return text
    .replace(/<\/(?:.|\n)*?>/gm, ' ') // replace closing tags w/ a space
    .replace(/<(?:.|\n)*?>/gm, '') // strip opening tags
    .trim();
};

export const getTruncatedText = (text = '', maxLength = 45) => {
  const txt = getHtmlText(text);
  if (txt.length > maxLength) {
    return `${txt.substr(0, maxLength).trim()}...`;
  }
  return txt;
};

// displays alert with an error when the transaction goes wrong
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
    msg = <p>Something went wrong with the transaction ...</p>;
  }

  Modal.error({
    title: 'Oh no!',
    content: msg,
    centered: true,
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

export const getReadableStatus = status => {
  switch (status) {
    case 'InProgress':
      return 'In Progress';
    case 'NeedsReview':
      return 'Needs Review';
    default:
      return status;
  }
};

export const history = createBrowserHistory();
let prevPath;
// listen and notify Segment of client-side page updates
history.listen(location => {
  if (location.pathname !== prevPath) {
    prevPath = location.pathname;
    sendAnalyticsPage(location.pathname);
  }
});

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

export const scrollToById = id => {
  if (id) {
    const element = document.getElementById(id);
    if (!element) {
      console.error(`No element found with id ${id}`);
      return;
    }
    const [navbar] = document.getElementsByClassName('navbar');
    const top =
      element.getBoundingClientRect().top - (navbar ? navbar.getBoundingClientRect().height : 0);
    window.scrollTo({ top, behavior: 'smooth' });
  }
};

export const resizeFile = (file, maxWidth = 600, maxHeight = 600) =>
  new Promise(resolve => {
    Resizer.imageFileResizer(
      file,
      maxWidth,
      maxHeight,
      'JPEG',
      90,
      0,
      uri => {
        resolve(uri);
      },
      'blob',
    );
  });
