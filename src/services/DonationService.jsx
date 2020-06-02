import React from 'react';
import { LPPCampaign } from 'lpp-campaign';
import { utils } from 'web3';
import BigNumber from 'bignumber.js';
import { paramsForServer } from 'feathers-hooks-common';

import Donation from '../models/Donation';
import DAC from '../models/DAC';
import Milestone from '../models/Milestone';
import Campaign from '../models/Campaign';
import getNetwork from '../lib/blockchain/getNetwork';
import extraGas from '../lib/blockchain/extraGas';
import { feathersClient } from '../lib/feathersClient';
import getWeb3 from '../lib/blockchain/getWeb3';
import config from '../configuration';

import ErrorPopup from '../components/ErrorPopup';

function updateExistingDonation(donation, amount, status) {
  const mutation = {
    pendingAmountRemaining: utils.toWei(
      new BigNumber(donation.amountRemaining).minus(new BigNumber(utils.fromWei(amount))).toFixed(),
    ),
  };
  if (status) {
    mutation.status = status;
  }

  return feathersClient
    .service('donations')
    .patch(donation.id, mutation)
    .catch(err => {
      ErrorPopup('Unable to update the donation in feathers', err);
    });
}

/**
 * Create an allowance for the givethBridge contract to transfer the provided token address
 * on behalf of the provided user
 *
 * @param {string} tokenContractAddress Address of the token to create an allowance on
 * @param {string} tokenHolderAddress  Address of the holder to create allowance for
 * @param {string|number} amount Amount to create an allowance for
 */
const createAllowance = async (tokenContractAddress, tokenHolderAddress, amount) => {
  const network = await getNetwork();
  const ERC20 = network.tokens[tokenContractAddress];

  let txHash;
  return ERC20.methods
    .approve(config.givethBridgeAddress, amount)
    .send({ from: tokenHolderAddress })
    .on('transactionHash', transactionHash => {
      txHash = transactionHash;

      if (amount === 0) {
        React.toast.info(
          <p>
            Please wait until your transaction is mined...
            <br />
            <strong>
              You will be asked to make another transaction to set the correct allowance!
            </strong>
            <br />
            <a
              href={`${config.homeEtherscan}tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View transaction
            </a>
          </p>,
        );
      } else {
        React.toast.info(
          <p>
            Please wait until your transaction is mined...
            <br />
            <strong>You will be asked to make another transaction for your donation!</strong>
            <br />
            <a
              href={`${config.homeEtherscan}tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View transaction
            </a>
          </p>,
        );
      }
    });
};

class DonationService {
  /**
   * Delegate multiple donations to some entity (either Campaign or Milestone)
   *
   * @param {Array}    donations   Array of donations that can be delegated
   * @param {string}   amount      Total amount in wei to be delegated - needs to be between 0 and total donation amount
   * @param {Object}   delegateTo  Entity to which the donation should be delegated
   * @param {function} onCreated   Callback function after the transaction has been broadcasted to chain and stored in feathers
   * @param {function} onSuccess   Callback function after the transaction has been mined
   * @param {function} onError     Callback function after error happened
   * @param {function} onCancel    Callback function after user cancelled the TX
   */
  static delegateMultiple(
    donations,
    amount,
    delegateTo,
    onCreated = () => {},
    onSuccess = () => {},
    onError = () => {},
    onCancel = () => {},
  ) {
    const { ownerType, ownerEntity, delegateEntity, delegateId } = donations[0];
    let txHash;
    let etherScanUrl;
    const pledgedDonations = []; // Donations that have been pledged and should be updated in feathers
    const pledges = [];

    /**
     * Decide which pledges should be used and encodes them for the contracts
     *
     * @return {Array} Array of strings with encoded pledges to delegate
     */
    const getPledges = () => {
      const maxAmount = new BigNumber(utils.fromWei(amount));
      let currentAmount = new BigNumber('0');
      let fullyDonated = true;

      donations.every(donation => {
        const pledge = pledges.find(n => n.id === donation.pledgeId);

        let delegatedAmount = donation.amountRemaining; // 0.1

        // The next donation is too big, we have to split it
        if (currentAmount.plus(delegatedAmount).isGreaterThan(maxAmount)) {
          delegatedAmount = maxAmount.minus(currentAmount);
          fullyDonated = false;

          // This donation would have value of 0, stop the iteration before it is added
          if (delegatedAmount.isEqualTo(new BigNumber('0'))) return fullyDonated;
        }
        pledgedDonations.push({
          donation,
          delegatedAmount: utils.toWei(delegatedAmount.toFixed()),
        });

        currentAmount = currentAmount.plus(delegatedAmount);

        if (pledge) {
          pledge.parents.push(donation.id);
          pledge.amount = pledge.amount.plus(delegatedAmount);
        } else {
          pledges.push({
            id: donation.pledgeId,
            parents: [donation.id],
            amount: delegatedAmount,
            giverAddress: donation.giverAddress,
            delegateEntity: donation.delegateEntity,
            ownerId: donation.ownerId,
            ownerTypeId: donation.ownerTypeId,
            ownerType: donation.ownerType,
            delegateId: donation.delegateId,
            delegateTypeId: donation.delegateTypeId,
            delegateType: donation.delegateType,
            token: donation.token,
          });
        }
        return fullyDonated;
      });

      return pledges.map(
        note =>
          // due to some issue in web3, utils.toHex(note.amount) breaks during minification.
          // BN.toString(16) will return a hex string as well
          `0x${utils.padLeft(
            new BigNumber(utils.toWei(note.amount.toFixed())).toString(16),
            48,
          )}${utils.padLeft(utils.toHex(note.id).substring(2), 16)}`,
      );
    };

    Promise.all([getNetwork(), getWeb3(), getPledges()])
      .then(([network, web3, encodedPledges]) => {
        etherScanUrl = network.etherscan;

        const receiverId = delegateTo.projectId;

        const executeTransfer = () => {
          let contract;

          if (ownerType.toLowerCase() === 'campaign') {
            contract = new LPPCampaign(web3, ownerEntity.pluginAddress);

            return contract.mTransfer(encodedPledges, receiverId, {
              from: ownerEntity.ownerAddress,
              $extraGas: extraGas(),
            });
          }
          return network.liquidPledging.mTransfer(delegateId, encodedPledges, receiverId, {
            from: delegateEntity.ownerAddress,
            $extraGas: extraGas(),
          });
        };

        return executeTransfer()
          .once('transactionHash', hash => {
            txHash = hash;

            // Update the delegated donations in feathers
            pledgedDonations.forEach(({ donation, delegatedAmount }) => {
              updateExistingDonation(donation, delegatedAmount);
            });

            // Create new donation objects for all the new pledges
            pledges.forEach(donation => {
              const _donationAmountInWei = utils.toWei(donation.amount.toFixed());

              const newDonation = {
                txHash,
                amount: _donationAmountInWei,
                amountRemaining: _donationAmountInWei,
                giverAddress: donation.giverAddress,
                pledgeId: 0,
                parentDonations: donation.parents,
                token: donation.token,
                mined: false,
              };
              // delegate is making the transfer
              if (donation.delegateEntity) {
                Object.assign(newDonation, {
                  status: Donation.TO_APPROVE,
                  ownerId: donation.ownerId,
                  ownerTypeId: donation.ownerTypeId,
                  ownerType: donation.ownerType,
                  delegateId: donation.delegateId,
                  delegateTypeId: donation.delegateTypeId,
                  delegateType: donation.delegateType,
                  intendedProjectId: delegateTo.projectId, // only support delegating to campaigns/milestones right now
                  intendedProjectType: delegateTo.type,
                  intendedProjectTypeId: delegateTo.id,
                });
              } else {
                // owner of the donation is making the transfer
                // only support delegating to campaigns/milestones right now
                Object.assign(newDonation, {
                  status: Donation.COMMITTED,
                  ownerId: delegateTo.projectId,
                  ownerTypeId: delegateTo.id,
                  ownerType: delegateTo.type,
                });
              }

              feathersClient
                .service('/donations')
                .create(newDonation)
                .then(() => onCreated(`${etherScanUrl}tx/${txHash}`))
                .catch(err => {
                  ErrorPopup('Unable to update the donation in feathers', err);
                  onError(err);
                });
            });
          })
          .then(() => onSuccess(`${etherScanUrl}tx/${txHash}`))
          .catch(err => {
            // bug in web3 seems to constantly fail due to this error, but the tx is correct
            if (txHash && err.message && err.message.includes('unknown transaction')) return;

            if (err.message.includes('User denied transaction signature')) {
              ErrorPopup('User denied transaction signature.', err);
              onCancel(err);
            } else {
              ErrorPopup(
                'There was a problem with catching the transaction hash, but your transaction probably went through.',
                `${etherScanUrl}tx/${txHash}`,
              );
              onError(err);
            }
          });
      })
      .catch(err => {
        ErrorPopup('Unable to initiate the delegation transaction.', err);
        onError(err);
      });
  }

  /**
   * Delegate the donation to some entity (either Campaign or Milestone)
   *
   * @param {Donation} donation    Donation to be delegated
   * @param {string}   amount      Amount of the donation that is to be delegated - needs to be between 0 and donation amount
   * @param {object}   delegateTo  Entity to which the donation should be delegated
   * @param {function} onCreated   Callback function after the transaction has been broadcasted to chain and stored in feathers
   * @param {function} onSuccess   Callback function after the transaction has been mined
   * @param {function} onError     Callback function after error happened
   * @param {function} onCancel    Callback function after user cancelled the TX
   */
  static delegate(
    donation,
    amount,
    delegateTo,
    onCreated = () => {},
    onSuccess = () => {},
    onError = () => {},
    onCancel = () => {},
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

            return contract.transfer(
              donation.canceledPledgeId || donation.pledgeId,
              amount,
              receiverId,
              {
                from,
                $extraGas: extraGas(),
              },
            );
          }

          return network.liquidPledging.transfer(senderId, donation.pledgeId, amount, receiverId, {
            from,
            $extraGas: extraGas(),
          });
        };

        return executeTransfer()
          .once('transactionHash', hash => {
            txHash = hash;
            updateExistingDonation(donation, amount);

            const newDonation = {
              txHash,
              amount,
              amountRemaining: amount,
              giverAddress: donation.giverAddress,
              pledgeId: 0,
              parentDonations: [donation.id],
              mined: false,
              token: donation.token,
            };
            // delegate is making the transfer
            if (donation.delegateEntity) {
              Object.assign(newDonation, {
                status: Donation.TO_APPROVE,
                ownerId: donation.ownerId,
                ownerTypeId: donation.ownerTypeId,
                ownerType: donation.ownerType,
                delegateId: donation.delegateId,
                delegateTypeId: donation.delegateTypeId,
                delegateType: donation.delegateType,
                intendedProjectId: delegateTo.projectId, // only support delegating to campaigns/milestones right now
                intendedProjectType: delegateTo.type,
                intendedProjectTypeId: delegateTo.id,
              });
            } else {
              // owner of the donation is making the transfer
              // only support delegating to campaigns/milestones right now
              Object.assign(newDonation, {
                status: Donation.COMMITTED,
                ownerId: delegateTo.projectId,
                ownerTypeId: delegateTo.id,
                ownerType: delegateTo.type,
              });
            }

            feathersClient
              .service('/donations')
              .create(newDonation)
              .then(() => onCreated(`${etherScanUrl}tx/${txHash}`))
              .catch(err => {
                ErrorPopup('Unable to update the donation in feathers', err);
                onError(err);
              });
          })
          .then(() => onSuccess(`${etherScanUrl}tx/${txHash}`))
          .catch(err => {
            if (txHash && err.message && err.message.includes('unknown transaction')) return; // bug in web3 seems to constantly fail due to this error, but the tx is correct

            if (err.message.includes('User denied transaction signature')) {
              ErrorPopup('User denied transaction signature.', err);
              onCancel(err);
            } else {
              ErrorPopup(
                'There was a problem with the delegation transaction.',
                `${etherScanUrl}tx/${txHash}`,
              );
              onError(err);
            }
          });
      })
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
        const _amountRemainingInWei = utils.toWei(donation.amountRemaining.toFixed());

        return network.liquidPledging
          .transfer(
            donation.ownerId,
            donation.pledgeId,
            _amountRemainingInWei,
            donation.delegateId,
            {
              from: address,
              $extraGas: extraGas(),
            },
          )
          .once('transactionHash', hash => {
            txHash = hash;
            updateExistingDonation(donation, _amountRemainingInWei, Donation.REJECTED);

            const newDonation = {
              txHash,
              amount: _amountRemainingInWei,
              amountRemaining: _amountRemainingInWei,
              status: Donation.TO_APPROVE,
              ownerId: donation.ownerId,
              ownerTypeId: donation.ownerTypeId,
              ownerType: donation.ownerType,
              delegateId: donation.delegateId,
              delegateTypeId: donation.delegateTypeId,
              delegateType: donation.delegateType,
              giverAddress: donation.giverAddress,
              pledgeId: 0,
              parentDonations: [donation.id],
              mined: false,
              isReturn: true,
              token: donation.token,
            };

            feathersClient
              .service('/donations')
              .create(newDonation)
              .then(() => {
                onCreated(`${etherScanUrl}tx/${txHash}`);
              })
              .catch(err => {
                ErrorPopup('Something went wrong while committing your donation.', err);
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
          txHash ? `${etherScanUrl}tx/${txHash}` : err,
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

        const _amountRemainingInWei = utils.toWei(donation.amountRemaining.toFixed());

        return network.liquidPledging
          .transfer(
            donation.ownerId,
            donation.pledgeId,
            _amountRemainingInWei,
            donation.intendedProjectId,
            {
              from: address,
              $extraGas: extraGas(),
            },
          )
          .once('transactionHash', hash => {
            txHash = hash;
            updateExistingDonation(donation, _amountRemainingInWei, Donation.COMMITTED);

            const newDonation = {
              txHash,
              amount: _amountRemainingInWei,
              amountRemaining: _amountRemainingInWei,
              ownerId: donation.intendedProjectId,
              ownerTypeId: donation.intendedProjectTypeId,
              ownerType: donation.intendedProjectType,
              giverAddress: donation.giverAddress,
              pledgeId: 0,
              parentDonations: [donation.id],
              status: Donation.COMMITTED,
              mined: false,
              token: donation.token,
            };
            feathersClient
              .service('/donations')
              .create(newDonation)
              .then(() => {
                onCreated(`${etherScanUrl}tx/${txHash}`);
              })
              .catch(err => {
                ErrorPopup('Something went wrong while committing your donation.', err);
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
        const _amountRemainingInWei = utils.toWei(donation.amountRemaining.toFixed());

        // this isn't the most gas efficient, but should always work. If the canceledPledge
        // has been partially transferred already, then it will have been normalized and the entire
        // value will exist in pledgeId. It would avoid an on-chain loop to find the normalized pledge
        // if we pass pledgeId when the canceledPledge has already been normalized
        return network.liquidPledging
          .withdraw(donation.canceledPledgeId || donation.pledgeId, _amountRemainingInWei, {
            from: address,
            $extraGas: extraGas(),
          })
          .once('transactionHash', hash => {
            txHash = hash;
            updateExistingDonation(donation, _amountRemainingInWei);

            const newDonation = {
              txHash,
              amount: _amountRemainingInWei,
              amountRemaining: _amountRemainingInWei,
              ownerId: donation.ownerId,
              ownerTypeId: donation.ownerTypeId,
              ownerType: donation.ownerType,
              giverAddress: donation.giverAddress,
              pledgeId: 0,
              parentDonations: [donation.id],
              status: Donation.PAYING,
              mined: false,
              token: donation.token,
            };

            feathersClient
              .service('/donations')
              .create(newDonation)
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

  /**
   * get token allowance
   *
   * @param {string} tokenContractAddress Address of the ERC20 token
   * @param {string} tokenHolderAddress Address of the token holder, by default the current logged in user
   */
  static async getERC20tokenAllowance(tokenContractAddress, tokenHolderAddress) {
    const network = await getNetwork();
    const ERC20 = network.tokens[tokenContractAddress];

    // if web3 is not loaded correctly ERC20 will be undefined
    if (ERC20)
      return ERC20.methods.allowance(tokenHolderAddress, config.givethBridgeAddress).call();

    return '0';
  }

  /**
   * Clear an allowance approval for an ERC20 token
   *
   * @param {string} tokenContractAddress Address of the ERC20 token
   * @param {string} tokenHolderAddress Address of the token holder, by default the current logged in user
   */
  static async clearERC20TokenApproval(tokenContractAddress, tokenHolderAddress) {
    const network = await getNetwork();
    const ERC20 = network.tokens[tokenContractAddress];

    // read existing allowance for the givethBridge
    const allowance = await ERC20.methods
      .allowance(tokenHolderAddress, config.givethBridgeAddress)
      .call();
    const allowanceNumber = new BigNumber(allowance);

    if (!allowanceNumber.isZero()) {
      let txHash;
      await ERC20.methods
        .approve(config.givethBridgeAddress, '0')
        .send({ from: tokenHolderAddress })
        .on('transactionHash', transactionHash => {
          txHash = transactionHash;
          React.toast.info(
            <p>
              Please wait until your transaction is mined...
              <br />
              <a
                href={`${config.homeEtherscan}tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View transaction
              </a>
            </p>,
          );
        });
    }
  }

  /**
   * Creates an allowance approval for an ERC20 token
   *
   * @param {string} tokenContractAddress Address of the ERC20 token
   * @param {string} tokenHolderAddress Address of the token holder, by default the current logged in user
   * @param {string|number} amount Amount in wei for the allowance. If none given defaults to unlimited (-1)
   */
  static async approveERC20tokenTransfer(tokenContractAddress, tokenHolderAddress, amount = -1) {
    const network = await getNetwork();
    const ERC20 = network.tokens[tokenContractAddress];

    const getAllowance = () =>
      ERC20.methods.allowance(tokenHolderAddress, config.givethBridgeAddress).call();

    // read existing allowance for the givethBridge
    const allowance = await getAllowance();

    const amountNumber = new BigNumber(amount);
    const allowanceNumber = new BigNumber(allowance);

    // if no allowance, we set the allowance
    // if there's an existing allowance, but it's lower than the amount, we reset it and create a new allowance
    // in any other case, just continue

    let result = true;
    // TODO: find a better way to know that transaction is successful than the status field on response
    /* eslint-disable eqeqeq */
    if (allowanceNumber.isZero()) {
      result = (await createAllowance(tokenContractAddress, tokenHolderAddress, amount)).status;
    } else if (amountNumber.gt(allowanceNumber)) {
      // return _createAllowance(web3, etherScanUrl, ERC20, tokenHolderAddress, 0);
      result = (await createAllowance(tokenContractAddress, tokenHolderAddress, 0)).status;
      if (result) {
        result = (await createAllowance(tokenContractAddress, tokenHolderAddress, amount)).status;
      }
    }
    return result;
  }

  /**
   * create a new donation instance in feathers
   *
   * @param {User} giver the giver of this donation
   * @param {object} toAdmin entity receiving the donation
   * @param {string} amount donation amount in wei
   * @param {object} token donation token
   * @param {string} txHash transactionHash of the donation tx
   * @param {Number} txNonce nonce of the donation tx
   */
  static newFeathersDonation(giver, toAdmin, amount, token, txHash, txNonce) {
    const newDonation = {
      giverAddress: giver.address,
      amount,
      amountRemaining: amount,
      pledgeId: 0,
      status: Donation.PENDING,
      homeTxHash: txHash,
      txNonce,
      mined: false,
      token,
    };

    // donation to a delegate
    if (toAdmin.type === DAC.type) {
      Object.assign(newDonation, {
        ownerType: 'giver',
        ownerTypeId: giver.address,
        ownerId: giver.giverId || 0,
        delegateId: toAdmin.adminId,
        delegateType: toAdmin.type,
        delegateTypeId: toAdmin.id,
      });
    } else if (toAdmin.type === Campaign.type) {
      Object.assign(newDonation, {
        ownerType: toAdmin.type,
        ownerTypeId: toAdmin.id,
        ownerId: toAdmin.adminId,
        campaignId: toAdmin.id,
      });
    } else if (toAdmin.type === Milestone.type) {
      Object.assign(newDonation, {
        ownerType: toAdmin.type,
        ownerTypeId: toAdmin.id,
        ownerId: toAdmin.adminId,
        campaignId: toAdmin.campaignId,
      });
    } else
      Object.assign(newDonation, {
        ownerType: toAdmin.type,
        ownerTypeId: toAdmin.id,
        ownerId: toAdmin.adminId,
      });
    return feathersClient
      .service('donations')
      .create(newDonation)
      .catch(err => {
        ErrorPopup(
          'Your donation has been initiated, however an error occurred when attempting to save. You should see your donation appear within ~30 mins.',
          err,
        );
      });
  }

  static updateSpentDonations(donations) {
    return feathersClient
      .service('donations')
      .patch(
        null,
        { pendingAmountRemaining: 0 },
        { query: { _id: { $in: donations.map(d => d._id) } } },
      );
  }

  static getMilestoneDonationsCount(milestoneId) {
    return feathersClient
      .service('/donations')
      .find({
        query: {
          ownerType: 'milestone',
          ownerTypeId: milestoneId,
          lessThanCutoff: { $ne: true },
          pendingAmountRemaining: { $ne: 0 },
          status: Donation.COMMITTED,
          $limit: 0,
        },
      })
      .then(({ total }) => total);
  }

  static async getMilestoneDonations(milestoneId) {
    const service = feathersClient.service('/donations');
    let data = [];
    let total;
    let spare = config.donationCollectCountLimit;
    const pledgeSet = new Set();
    do {
      const query = {
        ownerType: 'milestone',
        ownerTypeId: milestoneId,
        lessThanCutoff: { $ne: true },
        pendingAmountRemaining: { $ne: 0 },
        status: Donation.COMMITTED,
        $skip: data.length,
        // After having #donationCollectionCountLimit distinct pledges, check for next donations and add it if its pledgeId overlaps
        $limit: spare || 1,
        $sort: { 'token.symbol': 1, pledgeId: 1 }, // group by token
      };
      // eslint-disable-next-line no-await-in-loop
      const resp = await service.find({ query });

      if (spare === 0) {
        if (!pledgeSet.has(resp.data[0].pledgeId)) {
          break;
        }
      } else {
        resp.data.map(d => d.pledgeId).forEach(pledgeId => pledgeSet.add(pledgeId));
        spare = config.donationCollectCountLimit - pledgeSet.size;
      }

      data = data.concat(resp.data);
      total = resp.total;
      // We can collect donations from #donationCollectionCountLimit distinct pledges
    } while (data.length < total);

    if (data.length === 0) throw new Error('no-donations');

    const pledges = [];
    const tokens = new Set();
    data.forEach(donation => {
      const pledge = pledges.find(n => n.id === donation.pledgeId);
      tokens.add(donation.token.foreignAddress);

      if (pledge) {
        pledge.amount = pledge.amount.plus(donation.amountRemaining);
      } else {
        pledges.push({
          id: donation.pledgeId,
          amount: new BigNumber(donation.amountRemaining),
        });
      }
    });

    return {
      donations: data,
      tokens: Array.from(tokens),
      hasMoreDonations: data.length !== total,
      pledges: pledges.map(
        pledge =>
          // due to some issue in web3, utils.toHex(pledge.amount) breaks during minification.
          // BN.toString(16) will return a hex string as well
          `0x${utils.padLeft(pledge.amount.toString(16), 48)}${utils.padLeft(
            utils.toHex(pledge.id).substring(2),
            16,
          )}`,
      ),
    };
  }

  /**
   * traverse donation parents up to reach a level at which donations have COMMITTED status
   *
   * @param {string[]} parentIds Id of donation
   */
  static async getDonationNextCommittedParents(parentIds) {
    const res = await feathersClient.service('/donations').find(
      paramsForServer({
        query: {
          _id: { $in: parentIds },
        },
        schema: 'includeTypeAndGiverDetails',
      }),
    );
    if (res.data.length > 0) {
      // Reached to committed level
      if (res.data[0].status === Donation.COMMITTED) {
        return Promise.resolve(res.data.map(d => new Donation(d)));
      }
      const parents = res.data.map(d => d.parentDonations).flat();
      if (parents.length > 0) {
        return DonationService.getDonationNextCommittedParents(parents);
      }
    }
    return Promise.resolve([]);
  }
}

export default DonationService;
