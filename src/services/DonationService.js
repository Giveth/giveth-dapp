import { LPPCampaign } from 'lpp-campaign';

import getNetwork from '../lib/blockchain/getNetwork';
import { feathersClient } from '../lib/feathersClient';
import { getWeb3 } from '../lib/blockchain/getWeb3';

import ErrorPopup from '../components/ErrorPopup';

// TODO: Remove in future
/* eslint no-underscore-dangle: 0 */
class DonationService {
  /**
   * Delegate the donation to some entity (either Campaign or Milestone)
   *
   * @param {Donation} donation    Donation to be delegated
   * @param {string}   amount      Ammount of the donation that is to be delegated - needs to be between 0 and donation amount
   * @param {object}   delegateTo  Entity to which the donation should be delegated
   * @param {function} onCreated   Callback function after the transaction has been broadcasted to chain and stored in feathers
   * @param {function} onSuccess   Callback function after the transaction has been mined
   * @param {function} onError     Callback function after error happened
   */
  static delegate(
    donation,
    amount,
    delegateTo,
    onCreated = () => {},
    onSuccess = () => {},
    onError = () => {},
  ) {
    let txHash;
    let etherScanUrl;
    Promise.all([getNetwork(), getWeb3()])
      .then(([network, web3]) => {
        etherScanUrl = network.etherscan;

        const from =
          donation.delegateId > 0
            ? donation.delegateEntity.ownerAddress
            : donation.ownerEntity.ownerAddress;
        const senderId = donation.delegateId > 0 ? donation.delegateId : donation.ownerId;
        const receiverId = delegateTo.type === 'dac' ? delegateTo.delegateId : delegateTo.projectId;

        const executeTransfer = () => {
          if (donation.ownerType === 'campaign') {
            const contract = new LPPCampaign(web3, donation.ownerEntity.pluginAddress);

            return contract.transfer(donation.pledgeId, amount, receiverId, {
              from,
              $extraGas: 100000,
            });
          }

          return network.liquidPledging.transfer(senderId, donation.pledgeId, amount, receiverId, {
            from,
            $extraGas: 100000,
          }); // need to supply extraGas b/c https://github.com/trufflesuite/ganache-core/issues/26
        };

        return executeTransfer()
          .once('transactionHash', hash => {
            txHash = hash;
            const mutation = {
              txHash,
              status: 'pending',
            };

            if (amount === donation.amount) {
              if (donation.ownerType.toLowerCase() === 'campaign') {
                // campaign is the ownerId, so they transfer the donation, not propose
                Object.assign(mutation, {
                  ownerId: delegateTo.projectId,
                  ownerTypeId: delegateTo._id,
                  ownerType: delegateTo.type,
                });
              } else {
                // dac proposes a delegation
                Object.assign(mutation, {
                  intendedProjectId: delegateTo.projectId,
                  intendedProjectTypeId: delegateTo._id,
                  intendedProjectType: delegateTo.type,
                });
              }
            }

            feathersClient
              .service('/donations')
              .patch(donation.id, mutation)
              .then(() => onCreated(`${etherScanUrl}tx/${txHash}`))
              .catch(err => {
                ErrorPopup('Unable to update the donation in feathers', err);
                onError(err);
              });
          })
          .catch(err => {
            if (txHash && err.message && err.message.includes('unknown transaction')) return; // bug in web3 seems to constantly fail due to this error, but the tx is correct
            ErrorPopup(
              'Thare was a problem with the delegation transaction.',
              `${etherScanUrl}tx/${txHash}`,
            );
            onError(err);
          });
      })
      .then(() => onSuccess(`${etherScanUrl}tx/${txHash}`))
      .catch(err => {
        ErrorPopup('Unable to initiate the delegation transaction.', err);
        onError(err);
      });
  }

  /**
   * Reject the delegation of the donation
   *
   * @param {Donation} donation  Donation which delegation should be rejected
   * @param {string}   address   Address of the user who calls reject
   * @param {function} onCreated Callback function after the transaction has been broadcasted to chain and stored in feathers
   * @param {function} onSuccess Callback function after the transaction has been mined
   * @param {function} onError   Callback function after error happened
   */
  static reject(donation, address, onCreated = () => {}, onSuccess = () => {}, onError = () => {}) {
    let txHash;
    let etherScanUrl;
    getNetwork()
      .then(network => {
        etherScanUrl = network.etherscan;

        return network.liquidPledging
          .transfer(donation.ownerId, donation.pledgeId, donation.amount, donation.delegateId, {
            $extraGas: 50000,
            from: address,
          })
          .once('transactionHash', hash => {
            txHash = hash;

            feathersClient
              .service('/donations')
              .patch(donation.id, {
                status: 'pending',
                $unset: {
                  intendedProjectId: true,
                  intendedProjectTypeId: true,
                  intendedProjectType: true,
                },
                txHash,
              })
              .then(() => {
                onCreated(`${etherScanUrl}tx/${txHash}`);
              })
              .catch(err => {
                ErrorPopup('Something went wrong while comitting your donation.', err);
                onError(err);
              });
          });
      })
      .then(() => {
        onSuccess(`${etherScanUrl}tx/${txHash}`);
      })
      .catch(err => {
        if (txHash && err.message && err.message.includes('unknown transaction')) return; // bug in web3 seems to constantly fail due to this error, but the tx is correct
        ErrorPopup(
          'Something went wrong with the transaction. Is your wallet unlocked?',
          `${etherScanUrl}tx/${txHash}`,
        );
        onError(err);
      });
  }

  /**
   * Commit donation that has been delegated
   *
   * @param {Donation} donation  Donation to be committed
   * @param {string}   address   Address of the user who calls commit
   * @param {function} onCreated Callback function after the transaction has been broadcasted to chain and stored in feathers
   * @param {function} onSuccess Callback function after the transaction has been mined
   * @param {function} onError   Callback function after error happened
   */
  static commit(donation, address, onCreated = () => {}, onSuccess = () => {}, onError = () => {}) {
    let txHash;
    let etherScanUrl;
    getNetwork()
      .then(network => {
        etherScanUrl = network.etherscan;

        return network.liquidPledging
          .transfer(
            donation.ownerId,
            donation.pledgeId,
            donation.amount,
            donation.intendedProjectId,
            {
              $extraGas: 50000,
              from: address,
            },
          )
          .once('transactionHash', hash => {
            txHash = hash;

            feathersClient
              .service('/donations')
              .patch(donation.id, {
                status: 'pending',
                $unset: {
                  intendedProjectId: true,
                  intendedProjectTypeId: true,
                  intendedProjectType: true,
                  delegateId: true,
                  delegateType: true,
                  delegateTypeId: true,
                },
                txHash,
                ownerId: donation.intendedProjectId,
                ownerTypeId: donation.intendedProjectTypeId,
                ownerType: donation.intendedProjectType,
              })
              .then(() => {
                onCreated(`${etherScanUrl}tx/${txHash}`);
              })
              .catch(err => {
                ErrorPopup('Something went wrong while comitting your donation.', err);
                onError(err);
              });
          });
      })
      .then(() => {
        onSuccess(`${etherScanUrl}tx/${txHash}`);
      })
      .catch(err => {
        if (txHash && err.message && err.message.includes('unknown transaction')) return; // bug in web3 seems to constantly fail due to this error, but the tx is correct
        ErrorPopup(
          'Something went wrong with the transaction. Is your wallet unlocked?',
          `${etherScanUrl}tx/${txHash}`,
        );
        onError(err);
      });
  }

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

    getNetwork()
      .then(network => {
        etherScanUrl = network.etherscan;

        return network.liquidPledging
          .withdraw(donation.pledgeId, donation.amount, {
            $extraGas: 50000,
            from: address,
          })
          .once('transactionHash', hash => {
            txHash = hash;
            feathersClient
              .service('/donations')
              .patch(donation.id, {
                status: 'pending',
                $unset: {
                  delegateId: true,
                  delegateTypeId: true,
                  delegateType: true,
                  intendedProjectId: true,
                  intendedProjectTypeId: true,
                  intendedProjectType: true,
                },
                txHash,
              })
              .then(() => onCreated(`${etherScanUrl}tx/${txHash}`))
              .catch(err => {
                ErrorPopup('Something went wrong while revoking your donation.', err);
                onError(err);
              });
          });
      })
      .then(() => onSuccess(`${etherScanUrl}tx/${txHash}`))
      .catch(err => {
        if (txHash && err.message && err.message.includes('unknown transaction')) return; // bug in web3 seems to constantly fail due to this error, but the tx is correct
        ErrorPopup(
          'Something went wrong with the transaction. Is your wallet unlocked?',
          `${etherScanUrl}tx/${txHash}`,
        );
        onError(err);
      });
  }
}

export default DonationService;
