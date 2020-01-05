import getNetwork from '../lib/blockchain/getNetwork';
import { feathersClient } from '../lib/feathersClient';

import ErrorPopup from '../components/ErrorPopup';
import IPFSService from './IPFSService';
import extraGas from '../lib/blockchain/extraGas';
import { ZERO_ADDRESS } from '../lib/helpers';

const users = feathersClient.service('users');

class UserService {
  /**
   * Save new user profile to the blockchain or update existing one in feathers
   *
   * @param user        User object to be saved
   * @param afterSave   Callback to be triggered after the user is saved in feathers
   * @param afterMined  Callback to be triggered after the transaction is mined
   */
  static async save(user, afterSave = () => {}, afterMined = () => {}) {
    if (user.giverId === 0) {
      throw new Error(
        'You must wait for your registration to complete before you can update your profile',
      );
    }

    let txHash;
    let etherScanUrl;
    try {
      let profileHash;
      try {
        profileHash = await IPFSService.upload(user.toIpfs());
      } catch (err) {
        ErrorPopup('Failed to upload profile to ipfs');
      }

      const network = await getNetwork();
      etherScanUrl = network.etherscan;
      const { liquidPledging } = network;
      const from = user.address;

      // nothing to update or failed ipfs upload
      if (user.giverId && (user.url === profileHash || !profileHash)) {
        // ipfs upload may have failed, but we still want to update feathers
        if (!profileHash) {
          await users.patch(user.address, user.toFeathers(txHash));
        }
        afterSave(false);
        afterMined(false);
        return;
      }

      // lp function updateGiver(uint64 idGiver,address newAddr,string newName,string newUrl,uint64 newCommitTime)
      // lp function addGiver(string name,string url,uint64 commitTime,address plugin)
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
        await users.patch(user.address, user.toFeathers(txHash));
        afterSave(!user.giverId, `${etherScanUrl}tx/${txHash}`);
      });

      afterMined(!user.giverId, `${etherScanUrl}tx/${txHash}`);
    } catch (err) {
      ErrorPopup(
        'There has been a problem creating your user profile. Please refresh the page and try again.',
        `${etherScanUrl}tx/${txHash} => ${JSON.stringify(err, null, 2)}`,
      );
    }
  }
}

export default UserService;
