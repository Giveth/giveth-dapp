import React from 'react';
import Box from '3box';
import getWeb3 from './blockchain/getWeb3';
import config from '../configuration';
import DefaultAvatar from '../assets/avatar-100.svg';
import BoxIcon from '../assets/3box_logo.png';

/**
 * Attempt to get user `giveth` 3Box space from address
 *
 * @param {string} address User account address
 *
 * @returns {Object} with public `giveth` space data
 */
export const getGiveth3boxSpace = async address => await Box.getSpace(address, 'giveth');

/**
 * Request access to 3Box to finaly open up a `giveth` space
 *
 * @param {string} address  User account address
 *
 * @returns {Space} opened 3Box `giveth` space
 */
export const requestAccessTo3boxSpace = async address => {
  const isLoggedIn = await Box.isLoggedIn(address);
  const web3 = await getWeb3();
  const box = await Box.openBox(address, web3.currentProvider);
  const boxSyncPromise = new Promise((resolve, reject) => box.onSyncDone(resolve));
  let givethSpace;

  !isLoggedIn &&
    React.swal({
      title: 'Please sign a request access to 3Box...',
      text:
        "A MetaMask transaction should have popped-up. If you don't see it check the pending transaction in the MetaMask browser extension. Alternatively make sure to check that your popup blocker is disabled.",
      icon: BoxIcon,
      button: false,
    });

  await boxSyncPromise;

  !isLoggedIn && React.swal.close();
  !isLoggedIn &&
    React.swal({
      title: 'Please sign a request to open a Giveth 3Box Space...',
      text:
        "A MetaMask transaction should have popped-up. If you don't see it check the pending transaction in the MetaMask browser extension. Alternatively make sure to check that your popup blocker is disabled.",
      icon: BoxIcon,
      button: false,
    });

  givethSpace = await box.openSpace('giveth');

  !isLoggedIn && React.swal.close();
  return givethSpace;
};

/**
 * Get user 3Box profile
 *
 * @param {string} address  User account address
 *
 * @returns {Object} with User properties
 */
export const get3boxProfile = async address => {
  const ipfsGateway = 'https://ipfs.infura.io/ipfs/';
  const profile = await Box.getProfile(address);
  console.log('get3boxProfile profile', profile);
  const data = {
    address,
    name: profile.name,
    linkedin: profile.website,
    avatar: profile.image && ipfsGateway + profile.image[0].contentUrl['/'],
  };
  return data;
};

/**
 * Prompts a modal to confirm if a user wants to use an existing
 * 3Box profile on Giveth
 *
 * @param {string} address  User account address
 *
 * @returns {Object} with chosen `defaultProfile` and `userData`
 */
export const confirm3boxProfileImport = async address => {
  const data = await get3boxProfile(address);
  if (data.name) {
    const res = await React.swal({
      title: 'Would you like to use your 3box profile on Giveth?',
      text: `Name: ${data.name}\n Website: ${data.linkedin ? data.linkedin : 'None'}`,
      icon: data.avatar ? `${data.avatar}` : DefaultAvatar,
      buttons: ['No', 'Yes'],
      className: 'box-profile',
    });
    return {
      defaultProfile: res === true ? '3box' : 'giveth',
      userData: res === true ? data : undefined,
    };
  }
  return {
    defaultProfile: 'giveth',
  };
};

/**
 * Attempt to get user public profile data from a given Space
 *
 * @param {string} address  User account address
 * @param {Space} givethSpace  Opened giveth 3Box space
 *
 * @returns {Object} with user public profile data from `giveth` space
 */
export const get3boxGivethData = async (address, givethSpace) => {
  const avatar = await givethSpace.public.get('giveth.image');
  return {
    address,
    name: await givethSpace.public.get('giveth.name'),
    avatar: avatar && avatar[0].contentUrl,
    linkedin: await givethSpace.public.get('giveth.url'),
    email: await givethSpace.private.get('giveth.email'),
  };
};

/**
 * Update User profile on 3Box
 *
 * @param {Space} givethSpace  Opened giveth 3Box space
 * @param {User} user  User object
 * @param {string} defaultProfile  Default 3Box profile
 * @param beforeSave  Callback to be triggered after the user is updated on 3Box `giveth` Space
 * @param afterSaved  Callback to be triggered after the data is updated on 3Box `giveth` Space
 */
export const update3boxSpace = async (
  givethSpace,
  user,
  defaultProfile = 'giveth',
  beforeSave = () => {},
  afterSaved = () => {},
) => {
  const { ipfsGateway } = config;
  // Disabled as giverId is not being assigned through smart contract event
  // beforeSave(!user.giverId);
  beforeSave(false);
  const fields = ['defaultProfile'];
  const values = [defaultProfile];
  if (defaultProfile === 'giveth') {
    fields.push('giveth.name');
    values.push(user.name);
    if (user.linkedin) {
      fields.push('giveth.url');
      values.push(user.linkedin);
    }
    if (user.avatar && !user.avatar.match(/^http/)) {
      const imageIPFSHash = user.avatar.replace('/ipfs/', '');
      user.avatar = `${ipfsGateway}${imageIPFSHash}`;
      const imageObject = [
        {
          '@type': 'ImageObject',
          contentUrl: user.avatar,
          cid: { '/': imageIPFSHash },
        },
      ];
      fields.push('giveth.image');
      values.push(imageObject);
    }
  }
  await givethSpace.public.setMultiple(fields, values);
  if (user.email) await givethSpace.private.set('giveth.email', user.email);
  // Disabled as giverId is not being assigned through smart contract event
  // afterSaved(!user.giverId);
  afterSaved(false);
};

/**
 * Loads a user profile from 3Box based on its `defaultProfile` property
 *
 * @param {string} address  User account address
 *
 * @returns {Object} Object with user public profile
 */
export const load3BoxPublicProfile = async address => {
  const profile = await getGiveth3boxSpace(address);
  if (!profile.defaultProfile) return undefined;
  if (profile.defaultProfile === '3box') {
    return await get3boxProfile(address);
  }
  return {
    name: profile['giveth.name'],
    avatar: profile['giveth.image'] && profile['giveth.image'][0].contentUrl,
    linkedin: profile['giveth.url'],
  };
};
