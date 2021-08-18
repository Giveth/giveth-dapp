import { LiquidPledging } from '@giveth/liquidpledging-contract';

import { feathersClient } from '../lib/feathersClient';
import ErrorPopup from '../components/ErrorPopup';
import ErrorHandler from '../lib/ErrorHandler';
import IPFSService from './IPFSService';
import extraGas from '../lib/blockchain/extraGas';
import { ZERO_ADDRESS } from '../lib/helpers';
import config from '../configuration';

const etherScanUrl = config.etherscan;
const users = feathersClient.service('users');

class UserService {
  /**
   * Save new user profile to the blockchain or update existing one in feathers
   *
   * @param user        User object to be saved
   * @param afterSave   Callback to be triggered after the user is saved in feathers
   * @param afterMined  Callback to be triggered after the transaction is mined
   * @param reset
   * @param pushToNetwork
   * @param web3
   */
  static async save(
    user,
    afterSave = () => {},
    afterMined = () => {},
    reset = () => {},
    pushToNetwork = true,
    web3,
  ) {
    if (user.giverId === 0) {
      throw new Error(
        'You must wait for your registration to complete before you can update your profile',
      );
    }

    let txHash;

    const { currency } = user;
    delete user._currency;

    try {
      let profileHash;
      try {
        profileHash = await IPFSService.upload(user.toIpfs());
      } catch (err) {
        ErrorPopup('Failed to upload profile to ipfs');
      }

      const from = user.address;

      // nothing to update or failed ipfs upload
      if (user.giverId && !profileHash) {
        // ipfs upload may have failed, but we still want to update feathers
        if (!profileHash) {
          await users.patch(user.address, user.toFeathers(txHash));
        }
        afterMined(false);
        return;
      }
      if (pushToNetwork) {
        // lp function updateGiver(uint64 idGiver,address newAddr,string newName,string newUrl,uint64 newCommitTime)
        // lp function addGiver(string name,string url,uint64 commitTime,address plugin)
        const liquidPledging = new LiquidPledging(web3, config.liquidPledgingAddress);
        const promise = user.giverId
          ? liquidPledging.updateGiver(
              user.giverId,
              user.address,
              user.name,
              profileHash || '',
              user.commitTime,
              { from, $extraGas: extraGas() },
            )
          : liquidPledging.addGiver(user.name || '', profileHash || '', 259200, ZERO_ADDRESS, {
              from: user.address,
              $extraGas: extraGas(),
            }); // 3 days commitTime. TODO allow user to set commitTime
        await promise.once('transactionHash', async hash => {
          txHash = hash;
          user._currency = currency;
          await users.patch(user.address, user.toFeathers(txHash));
          afterSave(!user.giverId, `${etherScanUrl}tx/${txHash}`);
        });
        afterMined(!user.giverId, `${etherScanUrl}tx/${txHash}`);
      } else {
        user._currency = currency;
        await users.patch(user.address, user.toFeathers(''));
        afterMined(!user.giverId);
      }
    } catch (err) {
      user._currency = currency;
      const message =
        'There has been a problem creating your user profile. Please refresh the page and try again.' +
        `${etherScanUrl}tx/${txHash} => ${JSON.stringify(err, null, 2)}`;
      ErrorHandler(err, message);
      reset();
    }
  }

  static async getReviewers() {
    let reviewers = [];
    while (true) {
      // eslint-disable-next-line no-await-in-loop
      const result = await users.find({
        query: {
          isReviewer: true,
          $select: ['address', 'name'],
          $skip: reviewers.length,
          $sort: { address: 1 },
        },
      });

      const { data = [], total = 0 } = result || {};
      reviewers = reviewers.concat(data);
      if (reviewers.length >= total) break;
    }
    return reviewers;
  }
}

export default UserService;
