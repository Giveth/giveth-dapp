import React from 'react';
import { LPPCampaign } from 'lpp-campaign';
import { utils } from 'web3';
import BigNumber from 'bignumber.js';
import { paramsForServer } from 'feathers-hooks-common';
import { LiquidPledging } from 'giveth-liquidpledging';

import Donation from '../models/Donation';
import Community from '../models/Community';
import Trace from '../models/Trace';
import Campaign from '../models/Campaign';
import extraGas from '../lib/blockchain/extraGas';
import { feathersClient } from '../lib/feathersClient';
import config from '../configuration';

import ErrorHandler from '../lib/ErrorHandler';
import ErrorPopup from '../components/ErrorPopup';
import { sendAnalyticsTracking } from '../lib/SegmentAnalytics';
import {
  convertUsdValueToEthValue,
  getConversionRateBetweenTwoSymbol,
} from './ConversionRateService';

const etherScanUrl = config.etherscan;

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
 * @param {string|number} nonce Override nonce value
 * @param token ERC20 Token
 */
const createAllowance = (
  token,
  tokenContractAddress,
  tokenHolderAddress,
  amount,
  nonce = undefined,
) => {
  const opts = { from: tokenHolderAddress };
  if (nonce) opts.nonce = nonce;

  let txHash;
  return token.methods
    .approve(config.givethBridgeAddress, amount)
    .send(opts)
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

class DonationBlockchainService {
  /**
   * Delegate multiple donations to some entity (either Campaign or Trace)
   *
   * @param {Array}    donations   Array of donations that can be delegated
   * @param {string}   amount      Total amount in wei to be delegated - needs to be between 0 and total donation amount
   * @param {Object}   delegateTo  Entity to which the donation should be delegated
   * @param {String}   comment     Delegation comment
   * @param {function} onCreated   Callback function after the transaction has been broadcasted to chain and stored in feathers
   * @param {function} onSuccess   Callback function after the transaction has been mined
   * @param {function} onError     Callback function after error happened
   * @param web3                   web3 instance
   */
  static delegateMultiple(
    donations,
    amount,
    delegateTo,
    comment,
    onCreated = () => {},
    onSuccess = () => {},
    onError = () => {},
    web3,
  ) {
    const { ownerType, ownerEntity, delegateEntity, delegateId } = donations[0];
    let txHash;
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

    const encodedPledges = getPledges();
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
      const liquidPledging = new LiquidPledging(web3, config.liquidPledgingAddress);
      return liquidPledging.mTransfer(delegateId, encodedPledges, receiverId, {
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
            comment,
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
              intendedProjectId: delegateTo.projectId, // only support delegating to campaigns/traces right now
              intendedProjectType: delegateTo.type,
              intendedProjectTypeId: delegateTo.id,
            });
          } else {
            // owner of the donation is making the transfer
            // only support delegating to campaigns/traces right now
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
          const from = delegateId > 0 ? delegateEntity.ownerAddress : ownerEntity.ownerAddress;
          DonationBlockchainService.sendDelegateAnalyticsData({
            donation,
            newDonation,
            delegateTo,
            txHash,
            from,
          });
        });
      })
      .then(() => onSuccess(`${etherScanUrl}tx/${txHash}`))
      .catch(err => onError(err, txHash));
  }

  /**
   * Delegate the donation to some entity (either Campaign or Trace)
   *
   * @param {Donation} donation    Donation to be delegated
   * @param {string}   amount      Amount of the donation that is to be delegated - needs to be between 0 and donation amount
   * @param {string}   comment     comment
   * @param {object}   delegateTo  Entity to which the donation should be delegated
   * @param {function} onCreated   Callback function after the transaction has been broadcasted to chain and stored in feathers
   * @param {function} onSuccess   Callback function after the transaction has been mined
   * @param {function} onError     Callback function after error happened
   * @param web3                   Web3 instance
   */
  static delegate(
    donation,
    amount,
    comment,
    delegateTo,
    onCreated = () => {},
    onSuccess = () => {},
    onError = () => {},
    web3,
  ) {
    let txHash;
    const from =
      donation.delegateId > 0
        ? donation.delegateEntity.ownerAddress
        : donation.ownerEntity.ownerAddress;
    const senderId = donation.delegateId > 0 ? donation.delegateId : donation.ownerId;
    const receiverId =
      delegateTo.type === 'community' ? delegateTo.delegateId : delegateTo.projectId;

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
      const liquidPledging = new LiquidPledging(web3, config.liquidPledgingAddress);
      return liquidPledging.transfer(senderId, donation.pledgeId, amount, receiverId, {
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
          comment,
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
            intendedProjectId: delegateTo.projectId, // only support delegating to campaigns/traces right now
            intendedProjectType: delegateTo.type,
            intendedProjectTypeId: delegateTo.id,
          });
        } else {
          // owner of the donation is making the transfer
          // only support delegating to campaigns/traces right now
          Object.assign(newDonation, {
            status: Donation.COMMITTED,
            ownerId: delegateTo.projectId,
            ownerTypeId: delegateTo.id,
            ownerType: delegateTo.type,
          });
        }

        const txLink = `${etherScanUrl}tx/${txHash}`;

        feathersClient
          .service('/donations')
          .create(newDonation)
          .then(() => onCreated(txLink))
          .catch(err => {
            ErrorPopup('Unable to create the donation in feathers', err);
            onError(err);
          });
        DonationBlockchainService.sendDelegateAnalyticsData({
          donation,
          newDonation,
          delegateTo,
          txHash,
          from: newDonation.giverAddress,
        });
      })
      .then(() => onSuccess(`${etherScanUrl}tx/${txHash}`))
      .catch(err => {
        const message = `There was a problem with the delegation transaction.${etherScanUrl}tx/${txHash}`;
        ErrorHandler(err, message, false, onError);
      });
  }

  /**
   *
   * @param donation : it means the parent donation of new donation
   * @param delegateTo
   * @param newDonation
   * @param from
   * @param txHash
   */
  static async sendDelegateAnalyticsData({ donation, delegateTo, newDonation, from, txHash }) {
    const txLink = `${etherScanUrl}tx/${txHash}`;
    const currency = newDonation.token.symbol;

    const result = await getConversionRateBetweenTwoSymbol({
      date: new Date(),
      symbol: currency,
      to: 'USD',
    });
    const rate = result.rates.USD;
    const amount = Number(newDonation.amount) / 10 ** 18;
    const usdValue = amount * rate;
    const ethValue = currency === 'ETH' ? amount : await convertUsdValueToEthValue(usdValue);
    const analyticsData = {
      category: 'Donation',
      txUrl: txLink,
      userAddress: from,
      currency,
      amount,
      usdValue,
      ethValue,
      transactionId: newDonation.txHash,
      entityTitle: delegateTo.title,
      entityId: delegateTo.id,
      entitySlug: delegateTo.slug,

      // it;s the only way we can sure the entityType what is it
      entityType: delegateTo.formType ? 'trace' : 'campaign',
      entityOwnerAddress: delegateTo.ownerAddress,
      traceType: delegateTo.formType,
    };

    if (newDonation.status === Donation.TO_APPROVE) {
      // it's delegated from community
      sendAnalyticsTracking('Delegated', {
        ...analyticsData,
        action: 'delegation proposed',
        parentEntityTitle: donation.delegateEntity.title,
        parentEntityId: donation.delegateEntity._id,
        parentEntityOwnerAddress: donation.delegateEntity.ownerAddress,
        parentEntitySlug: donation.delegateEntity.slug,
        parentEntityType: 'community',
      });
    } else {
      const campaign = await feathersClient.service('campaigns').get(donation.ownerTypeId);
      // delegate from campaign
      sendAnalyticsTracking('Delegated', {
        ...analyticsData,
        action: 'delegated',
        parentEntityOwnerAddress: campaign.ownerAddress,
        parentEntitySlug: campaign.slug,
        parentEntityTitle: campaign.title,
        parentEntityId: donation.ownerTypeId,
        parentEntityType: donation.ownerType,
      });
    }
  }

  /**
   * Reject the delegation of the donation
   *
   * @param {Donation} donation  Donation which delegation should be rejected
   * @param {string}   address   Address of the user who calls reject
   * @param {function} onCreated Callback function after the transaction has been broadcasted to chain and stored in feathers
   * @param {function} onSuccess Callback function after the transaction has been mined
   * @param web3
   */
  static reject(donation, address, onCreated = () => {}, onSuccess = () => {}, web3) {
    let txHash;
    const _amountRemainingInWei = utils.toWei(donation.amountRemaining.toFixed());
    const liquidPledging = new LiquidPledging(web3, config.liquidPledgingAddress);

    return liquidPledging
      .transfer(donation.ownerId, donation.pledgeId, _amountRemainingInWei, donation.delegateId, {
        from: address,
        $extraGas: extraGas(),
      })
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
            const message =
              'Something went wrong while committing your donation.' +
              `${etherScanUrl}tx/${txHash} => ${JSON.stringify(err, null, 2)}`;
            ErrorHandler(err, message);
          });
      })
      .then(() => {
        onSuccess(`${etherScanUrl}tx/${txHash}`);
      })
      .catch(err => {
        if (txHash && err.message && err.message.includes('unknown transaction')) return; // bug in web3 seems to constantly fail due to this error, but the tx is correct
        ErrorHandler(err, 'Something went wrong with the transaction!');
      });
  }

  /**
   * Commit donation that has been delegated
   *
   * @param {Donation} donation  Donation to be committed
   * @param {string}   address   Address of the user who calls commit
   * @param {function} onCreated Callback function after the transaction has been broadcasted to chain and stored in feathers
   * @param {function} onSuccess Callback function after the transaction has been mined
   * @param web3
   */
  static commit(donation, address, onCreated = () => {}, onSuccess = () => {}, web3) {
    let txHash;

    const _amountRemainingInWei = utils.toWei(donation.amountRemaining.toFixed());
    const liquidPledging = new LiquidPledging(web3, config.liquidPledgingAddress);

    return liquidPledging
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
          });

        const txLink = `${etherScanUrl}tx/${txHash}`;

        sendAnalyticsTracking('Delegated', {
          category: 'Donation',
          action: 'delegation approved',
          id: donation._id,
          txUrl: txLink,
          userAddress: newDonation.giverAddress,
          receiverId: newDonation.ownerTypeId,
        });
      })
      .then(() => {
        onSuccess(`${etherScanUrl}tx/${txHash}`);
      })
      .catch(err => {
        if (txHash && err.message && err.message.includes('unknown transaction')) return; // bug in web3 seems to constantly fail due to this error, but the tx is correct
        ErrorHandler(err, 'Something went wrong with your transaction!');
      });
  }

  /**
   * Refund a donation
   *
   * @param {Donation} donation  Donation to be refunded
   * @param {string}   address   Address of the user who calls refund
   * @param {function} onCreated Callback function after the transaction has been broadcasted to chain and stored in feathers
   * @param {function} onSuccess Callback function after the transaction has been mined
   * @param web3
   */
  static refund(donation, address, onCreated = () => {}, onSuccess = () => {}, web3) {
    let txHash;

    const _amountRemainingInWei = utils.toWei(donation.amountRemaining.toFixed());
    const liquidPledging = new LiquidPledging(web3, config.liquidPledgingAddress);

    // this isn't the most gas efficient, but should always work. If the canceledPledge
    // has been partially transferred already, then it will have been normalized and the entire
    // value will exist in pledgeId. It would avoid an on-chain loop to find the normalized pledge
    // if we pass pledgeId when the canceledPledge has already been normalized
    return liquidPledging
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
          });
      })
      .then(() => {
        onSuccess(`${etherScanUrl}tx/${txHash}`);
      })
      .catch(err => {
        if (txHash && err.message && err.message.includes('unknown transaction')) return; // bug in web3 seems to constantly fail due to this error, but the tx is correct
        ErrorHandler(err, 'Something went wrong with the transaction.');
      });
  }

  /**
   * get token allowance
   *
   * @param {string} tokenContractAddress Address of the ERC20 token
   * @param {string} tokenHolderAddress Address of the token holder, by default the current logged in user
   * @param token ERC20 Token
   */
  static async getERC20tokenAllowance(tokenContractAddress, tokenHolderAddress, token) {
    // if web3 is not loaded correctly ERC20 will be undefined
    if (token)
      return token.methods.allowance(tokenHolderAddress, config.givethBridgeAddress).call();

    return '0';
  }

  /**
   * Clear an allowance approval for an ERC20 token
   *
   * @param {string} tokenContractAddress Address of the ERC20 token
   * @param {string} tokenHolderAddress Address of the token holder, by default the current logged in user
   * @param token ERC20 Token
   */
  static async clearERC20TokenApproval(tokenContractAddress, tokenHolderAddress, token) {
    // read existing allowance for the givethBridge
    const allowance = await token.methods
      .allowance(tokenHolderAddress, config.givethBridgeAddress)
      .call();
    const allowanceNumber = new BigNumber(allowance);

    if (!allowanceNumber.isZero()) {
      let txHash;
      await token.methods
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
   * @param {function} onAllowanceChange callback to update allowance amount
   * @param web3        web3 instance
   * @param token ERC20 Token
   */
  static async approveERC20tokenTransfer(
    tokenContractAddress,
    tokenHolderAddress,
    amount = -1,
    onAllowanceChange = () => {},
    web3,
    token,
  ) {
    const getAllowance = () =>
      token.methods.allowance(tokenHolderAddress, config.givethBridgeAddress).call();

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
      result = (await createAllowance(token, tokenContractAddress, tokenHolderAddress, amount))
        .status;
      onAllowanceChange();
    } else if (amountNumber.gt(allowanceNumber)) {
      // return _createAllowance(web3, etherScanUrl, ERC20, tokenHolderAddress, 0);
      const firstTxEvent = createAllowance(token, tokenContractAddress, tokenHolderAddress, 0);

      firstTxEvent.on('receipt', onAllowanceChange);

      result = new Promise((resolve, reject) => {
        firstTxEvent.catch(reject);

        firstTxEvent.on('transactionHash', async transactionHash => {
          const tx = await web3.eth.getTransaction(transactionHash);
          try {
            const secondTxEvent = await createAllowance(
              token,
              tokenContractAddress,
              tokenHolderAddress,
              amount,
              String(Number(tx.nonce) + 1),
            );
            onAllowanceChange();
            const { status } = secondTxEvent;
            resolve(status);
          } catch (e) {
            reject(e);
          }
        });
      });
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
   * @param {string} comment comment for donation
   */
  static newFeathersDonation(giver, toAdmin, amount, token, txHash, txNonce, comment) {
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
      comment,
    };

    // donation to a delegate
    if (toAdmin.type === Community.type) {
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
    } else if (toAdmin.type === Trace.type) {
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
        // const message =
        // 'Your donation has been initiated, however an error occurred when attempting to save. You should see your donation appear within ~30 mins.';
        console.log('err :>> ', err);
        ErrorHandler(err, err.name);
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

  static getTraceDonationsCount(traceId) {
    return feathersClient
      .service('/donations')
      .find({
        query: {
          ownerType: 'trace',
          ownerTypeId: traceId,
          lessThanCutoff: { $ne: true },
          pendingAmountRemaining: { $ne: 0 },
          status: Donation.COMMITTED,
          $limit: 0,
        },
      })
      .then(({ total }) => total);
  }

  static async getTraceDonations(traceId) {
    const service = feathersClient.service('/donations');
    let data = [];
    let total;
    let spare = config.donationCollectCountLimit;
    const pledgeSet = new Set();
    do {
      const query = {
        ownerType: 'trace',
        ownerTypeId: traceId,
        lessThanCutoff: { $ne: true },
        pendingAmountRemaining: { $ne: 0 },
        status: Donation.COMMITTED,
        $skip: data.length,
        // After having #donationCollectionCountLimit distinct pledges, check for next donations and add it if its pledgeId overlaps
        $limit: spare || 1,
        $sort: { tokenAddress: 1, pledgeId: 1 }, // group by token
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
   * @param {donation} donation
   */
  static async getDonationNextCommittedParents(parentIds, donation) {
    const res = await feathersClient.service('/donations').find(
      paramsForServer({
        query: {
          _id: { $in: parentIds },
        },
        schema: 'includeTypeAndGiverDetails',
      }),
    );
    if (res.data.length > 0) {
      const parent = res.data[0];
      // Reached to committed level
      if (parent.status === Donation.COMMITTED) {
        return Promise.resolve(res.data.map(d => new Donation(d)));
      }
      // Fill donation homeTxHash value by parent
      if (parent.status === Donation.WAITING && parent.homeTxHash) {
        donation.homeTxHash = parent.homeTxHash;
      }
      const parents = res.data.map(d => d.parentDonations).flat();
      if (parents.length > 0) {
        return DonationBlockchainService.getDonationNextCommittedParents(parents, donation);
      }
    }
    return Promise.resolve([]);
  }
}

export default DonationBlockchainService;
