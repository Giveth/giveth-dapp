import getNetwork from '../lib/blockchain/getNetwork';
import { getGasPrice } from '../lib/helpers';
import { feathersClient } from '../lib/feathersClient';

import ErrorPopup from '../components/ErrorPopup';

class DonationService {
  /**
   * Refund a donation
   *
   * @param {Donation} donation  Donation to be refunded
   * @param {string}   address   Address of the user who calls refund
   * @param {function} onCreated Callback function after the transaction has been broadcasted to chain and stored in feathers
   * @param {function} onSuccess Callback function after the transaction has been mined
   * @param {function} onError   Callback function after error happened
   */
  static refund(donation, address, onCreated = () => {}, onSuccess = () => {}, onError = () => {}) {
    let txHash;
    let etherScanUrl;

    Promise.all([getNetwork(), getGasPrice()])
      .then(([network, gasPrice]) => {
        const { liquidPledging } = network;
        etherScanUrl = network.etherscan;

        return liquidPledging
          .withdraw(donation.pledgeId, donation.amount, {
            $extraGas: 50000,
            from: address,
            gasPrice,
          })
          .once('transactionHash', hash => {
            txHash = hash;
            feathersClient
              .service('/donations')
              .patch(donation.id, {
                status: 'pending',
                $unset: {
                  delegate: true,
                  delegateId: true,
                  delegateType: true,
                  pendingProject: true,
                  pendingProjectId: true,
                  pendingProjectType: true,
                },
                paymentStatus: 'Paying',
                txHash,
              })
              .then(() => onCreated(`${etherScanUrl}tx/${txHash}`))
              .catch(err => {
                ErrorPopup('Something went wrong while revoking your donation.', err);
                this.setState({ isRefunding: false });
              });
          });
      })
      .then(() => onSuccess(`${etherScanUrl}tx/${txHash}`))
      .catch(err => {
        ErrorPopup(
          'Something went wrong with the transaction. Is your wallet unlocked?',
          `${etherScanUrl}tx/${txHash}`,
        );
        onError(err);
      });
  }
}

export default DonationService;
