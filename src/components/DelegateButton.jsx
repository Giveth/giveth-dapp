import React, { Component } from 'react';
import { SkyLightStateless } from 'react-skylight';
import { utils } from 'web3';
import { LPPCampaign } from 'lpp-campaign';
import { LPPDac } from 'lpp-dac';
import { Form } from 'formsy-react-components';
import InputToken from 'react-input-token';
import PropTypes from 'prop-types';

import { feathersClient } from '../lib/feathersClient';
import { takeActionAfterWalletUnlock, checkWalletBalance } from '../lib/middleware';
import { displayTransactionError } from '../lib/helpers';
import getNetwork from '../lib/blockchain/getNetwork';
import getWeb3 from '../lib/blockchain/getWeb3';
import GivethWallet from '../lib/blockchain/GivethWallet';

// TODO Remove the eslint exception and fix feathers to provide id's without underscore
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
      checkWalletBalance(this.props.wallet, this.props.history)
        .then(() => this.setState({ modalVisible: true })));
  }

  selectedObject({ target }) {
    this.setState({ objectsToDelegateTo: target.value.selectedObject });
  }


  submit() {
    const { toBN } = utils;
    const { model } = this.props;
    this.setState({ isSaving: true });

    // find the type of where we delegate to
    const admin = this.props.types.find(t => t.id === this.state.objectsToDelegateTo[0]);

    // TODO find a more friendly way to do this.
    if (admin.type === 'milestone' && toBN(admin.maxAmount).lt(toBN(admin.totalDonated || 0).add(toBN(model.amount)))) {
      React.toast.error('That milestone has reached its funding goal. Please pick another');
      return;
    }

    const delegate = (etherScanUrl, txHash) => {
      const mutation = {
        txHash,
        status: 'pending',
      };

      if (admin.type.toLowerCase() === 'dac') {
        Object.assign(mutation, {
          delegate: admin.delegateId,
          delegateId: admin._id,
        });
      } else {
        Object.assign(mutation, {
          intendedProject: admin.projectId,
          intendedProjectId: admin._id,
          intendedProjectType: admin.type,
        });
      }

      feathersClient.service('/donations').patch(model._id, mutation)
        .then(() => {
          this.resetSkylight();

          let msg;
          if (admin.type === 'milestone' || 'campaign') {
            msg = (<p>The donation has been delegated, <a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">view the transaction here.</a>
              The giver has <strong>3 days</strong> to reject your delegation before the money
              gets locked.
                   </p>);
          } else {
            msg = <p>The donation has been delegated, <a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">view the transaction here.</a> The donator has been notified.</p>;
          }

          React.swal({
            title: 'Delegated!',
            content: React.swal.msg(msg),
            icon: 'success',
          });
        }).catch(() => {
          displayTransactionError(txHash, etherScanUrl);
          this.setState({ isSaving: false });
        });
    };

    let txHash;
    let etherScanUrl;

    Promise.all([getNetwork(), getWeb3()])
      .then(([network, web3]) => {
        const { liquidPledging } = network;
        etherScanUrl = network.etherscan;

        const senderId = (model.delegate > 0) ? model.delegate : model.owner;
        const receiverId = (admin.type === 'dac') ? admin.delegateId : admin.projectId;

        const executeTransfer = () => {
          if (model.ownerType === 'campaign') {
            return new LPPCampaign(web3, model.ownerEntity.pluginAddress)
              .transfer(model.pledgeId, model.amount, receiverId, { $extraGas: 50000 });
          } else if (model.ownerType === 'giver' && model.delegate > 0) {
            return new LPPDac(web3, model.delegateEntity.pluginAddress)
              .transfer(model.pledgeId, model.amount, receiverId, { $extraGas: 50000 });
          }

          return liquidPledging
            .transfer(senderId, model.pledgeId, model.amount, receiverId, { $extraGas: 50000 });
        };

        return executeTransfer()
          .once('transactionHash', (hash) => {
            txHash = hash;
            delegate(etherScanUrl, txHash);
          }).on('error', console.error); // eslint-disable-line no-console
      })
      .then(() => {
        React.toast.success(<p>Your donation has been confirmed!<br /><a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">View transaction</a></p>);
      }).catch(() => {
        displayTransactionError(txHash, etherScanUrl);
        this.setState({ isSaving: false });
      });
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
          hideOnOverlayClicked
          title="Delegate Donation"
          afterClose={() => this.resetSkylight()}
        >

          { milestoneOnly &&
            <p>Select a Milestone to delegate this donation to</p>
          }

          { !milestoneOnly &&
            <p>Select a DAC, Campaign or Milestone to delegate this donation to</p>
          }

          <Form onSubmit={this.submit} layout="vertical">
            <div className="form-group">
              <InputToken
                name="campaigns"
                placeholder={milestoneOnly ? 'Select a milestone' : 'Select a campaign or milestone'}
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
              disabled={isSaving || this.state.objectsToDelegateTo.length === 0}
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
  history: PropTypes.shape({}).isRequired,
  wallet: PropTypes.instanceOf(GivethWallet).isRequired,
  types: PropTypes.shape({
    find: PropTypes.func.isRequired,
  }).isRequired,
  milestoneOnly: PropTypes.bool,
  model: PropTypes.shape({}).isRequired,
};

DelegateButton.defaultProps = {
  milestoneOnly: false,
};

export default DelegateButton;
