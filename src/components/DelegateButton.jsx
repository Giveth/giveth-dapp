import React, { Component } from 'react';
import { SkyLightStateless } from 'react-skylight';
import { utils } from 'web3';
import { LPPCampaign } from 'lpp-campaign';
import { Form } from 'formsy-react-components';
import InputToken from 'react-input-token';
import PropTypes from 'prop-types';

import { feathersClient } from '../lib/feathersClient';
import {
  takeActionAfterWalletUnlock,
  checkWalletBalance,
  confirmBlockchainTransaction,
} from '../lib/middleware';
import { getGasPrice } from '../lib/helpers';
import getNetwork from '../lib/blockchain/getNetwork';
import { getWeb3 } from '../lib/blockchain/getWeb3';
import GivethWallet from '../lib/blockchain/GivethWallet';

import ErrorPopup from './ErrorPopup';

// TODO: Remove once rewritten to model
/* eslint no-underscore-dangle: 0 */
class DelegateButton extends Component {
  constructor() {
    super();

    this.state = {
      isSaving: false,
      objectsToDelegateTo: [],
      modalVisible: false,
    };

    this.submit = this.submit.bind(this);
    this.selectedObject = this.selectedObject.bind(this);
  }

  openDialog() {
    takeActionAfterWalletUnlock(this.props.wallet, () =>
      checkWalletBalance(this.props.wallet).then(() => this.setState({ modalVisible: true })),
    );
  }

  selectedObject({ target }) {
    this.setState({ objectsToDelegateTo: target.value });
  }

  submit() {
    const { toBN } = utils;
    const { model } = this.props;
    this.setState({ isSaving: true });

    // find the type of where we delegate to
    const admin = this.props.types.find(t => t.id === this.state.objectsToDelegateTo[0]);

    // TODO: find a more friendly way to do this.
    if (admin.type === 'milestone' && toBN(admin.maxAmount).lt(toBN(admin.totalDonated || 0))) {
      React.toast.error('That milestone has reached its funding goal. Please pick another.');
      return;
    }

    const delegate = (etherScanUrl, txHash) => {
      const mutation = {
        txHash,
        status: 'pending',
      };

      if (model.ownerType.toLowerCase() === 'campaign') {
        // campaign is the owner, so they transfer the donation, not propose
        Object.assign(mutation, {
          owner: admin.projectId,
          ownerId: admin._id,
          ownerType: admin.type,
        });
      } else {
        // dac proposes a delegation
        Object.assign(mutation, {
          intendedProject: admin.projectId,
          intendedProjectId: admin._id,
          intendedProjectType: admin.type,
        });
      }

      feathersClient
        .service('/donations')
        .patch(model._id, mutation)
        .then(() => {
          this.resetSkylight();

          let msg;
          if (model.delegate > 0) {
            msg = (
              <p>
                The donation has been delegated,{' '}
                <a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                  view the transaction here.
                </a>
                The Giver has <strong>3 days</strong> to reject your delegation before the money
                gets locked.
              </p>
            );
          } else {
            msg = (
              <p>
                The donation has been delegated,{' '}
                <a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                  view the transaction here.
                </a>{' '}
                The Giver has been notified.
              </p>
            );
          }

          React.swal({
            title: 'Delegated!',
            content: React.swal.msg(msg),
            icon: 'success',
          });
        })
        .catch(() => {
          ErrorPopup(
            'Something went wrong with the transaction. Is your wallet unlocked?',
            `${etherScanUrl}tx/${txHash}`,
          );
          this.setState({ isSaving: false });
        });
    };

    let txHash;
    let etherScanUrl;

    const doDelegate = () =>
      Promise.all([getNetwork(), getWeb3(), getGasPrice()])
        .then(([network, web3, gasPrice]) => {
          const { lppDacs, liquidPledging } = network;
          etherScanUrl = network.etherscan;

          const from =
            model.delegate > 0 ? model.delegateEntity.ownerAddress : model.ownerEntity.ownerAddress;
          const senderId = model.delegate > 0 ? model.delegate : model.owner;
          const receiverId = admin.type === 'dac' ? admin.delegateId : admin.projectId;

          const executeTransfer = () => {
            if (model.ownerType === 'campaign') {
              return new LPPCampaign(web3, model.ownerEntity.pluginAddress).transfer(
                model.pledgeId,
                model.amount,
                receiverId,
                {
                  from,
                  $extraGas: 100000,
                  gasPrice,
                },
              );
            } else if (model.ownerType === 'giver' && model.delegate > 0) {
              return lppDacs.transfer(model.delegate, model.pledgeId, model.amount, receiverId, {
                from,
                $extraGas: 100000,
                gasPrice,
              });
            }

            return liquidPledging.transfer(senderId, model.pledgeId, model.amount, receiverId, {
              from,
              $extraGas: 100000,
              gasPrice,
            }); // need to supply extraGas b/c https://github.com/trufflesuite/ganache-core/issues/26
          };

          return executeTransfer()
            .once('transactionHash', hash => {
              txHash = hash;
              delegate(etherScanUrl, txHash);
            })
            .on('error', console.error); // eslint-disable-line no-console
        })
        .then(() => {
          React.toast.success(
            <p>
              Your donation has been confirmed!<br />
              <a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                View transaction
              </a>
            </p>,
          );
        })
        .catch(() => {
          ErrorPopup(
            'Something went wrong with the transaction. Is your wallet unlocked?',
            `${etherScanUrl}tx/${txHash}`,
          );
          this.setState({ isSaving: false });
        });

    // Delegate
    confirmBlockchainTransaction(doDelegate, () => this.setState({ isSaving: false }));
  }

  resetSkylight() {
    this.setState({
      isSaving: false,
      objectsToDelegateTo: [],
    });
  }

  render() {
    const { types, milestoneOnly } = this.props;
    const { isSaving, objectsToDelegateTo } = this.state;
    const style = { display: 'inline-block' };

    return (
      <span style={style}>
        <button className="btn btn-success btn-sm" onClick={() => this.openDialog()}>
          Delegate
        </button>

        <SkyLightStateless
          isVisible={this.state.modalVisible}
          onCloseClicked={() => {
            this.setState({ modalVisible: false });
          }}
          onOverlayClicked={() => {
            this.setState({ modalVisible: false });
          }}
          hideOnOverlayClicked
          title="Delegate Donation"
          afterClose={() => this.resetSkylight()}
        >
          {milestoneOnly && <p>Select a Milestone to delegate this donation to:</p>}

          {!milestoneOnly && <p>Select a Campaign or Milestone to delegate this donation to:</p>}

          <Form onSubmit={this.submit} layout="vertical">
            <div className="form-group">
              <InputToken
                name="campaigns"
                placeholder={
                  milestoneOnly ? 'Select a Milestone' : 'Select a Campaign or Milestone'
                }
                value={objectsToDelegateTo}
                options={types}
                onSelect={this.selectedObject}
                maxLength={1}
              />
            </div>

            <button
              className="btn btn-success"
              formNoValidate
              type="submit"
              disabled={isSaving || objectsToDelegateTo.length !== 1}
            >
              {isSaving ? 'Delegating...' : 'Delegate here'}
            </button>
          </Form>
        </SkyLightStateless>
      </span>
    );
  }
}

DelegateButton.propTypes = {
  wallet: PropTypes.instanceOf(GivethWallet).isRequired,
  types: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  milestoneOnly: PropTypes.bool,
  model: PropTypes.shape({}).isRequired,
};

DelegateButton.defaultProps = {
  milestoneOnly: false,
};

export default DelegateButton;
