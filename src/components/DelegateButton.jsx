/* eslint-disable no-restricted-globals */
/* eslint-disable react/sort-comp */
import React, { Component } from 'react';
import Modal from 'react-modal';
import BigNumber from 'bignumber.js';

import { utils } from 'web3';
import { Form, Input } from 'formsy-react-components';
import InputToken from 'react-input-token';
import PropTypes from 'prop-types';
import Slider from 'react-rangeslider';
import 'react-rangeslider/lib/index.css';

import GA from 'lib/GoogleAnalytics';
import Donation from 'models/Donation';
import Milestone from 'models/Milestone';
import Campaign from 'models/Campaign';
import ErrorPopup from './ErrorPopup';
import { checkBalance } from '../lib/middleware';

import DonationService from '../services/DonationService';

const modalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-20%',
    transform: 'translate(-50%, -50%)',
    boxShadow: '0 0 40px #ccc',
    overflowY: 'scroll',
  },
};

Modal.setAppElement('#root');

function getFilterType(types, donation) {
  return types.filter(
    t =>
      !(t instanceof Milestone) ||
      !t.acceptsSingleToken ||
      t.token.symbol === donation.token.symbol,
  );
}

function getTypes(types) {
  return types.map(t => {
    const isMilestone = t instanceof Milestone;
    const el = {};
    el.name = t.title;
    el.type = isMilestone ? Milestone.type : Campaign.type;
    el.id = t._id;
    el.element = (
      <span>
        {t.title} <em>{t instanceof Milestone ? 'Milestone' : 'Campaign'}</em>
      </span>
    );
    if (isMilestone) {
      el.campaignProjectId = t.campaign.projectId;
    }
    return el;
  });
}

// FIXME: We need slider component that uses bignumbers, there are some precision issues here
class DelegateButton extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isSaving: false,
      objectsToDelegateToCampaign: [],
      objectsToDelegateToMilestone: [],
      modalVisible: false,
      amount: '0',
      amountSelected: '0',
      maxAmount: new BigNumber('0'),
      curProjectId: null,
    };

    this.submit = this.submit.bind(this);
    this.selectedObject = this.selectedObject.bind(this);
  }

  openDialog() {
    checkBalance(this.props.balance)
      .then(() =>
        this.setState({
          modalVisible: true,
          amount: this.props.donation.amountRemaining.toFixed(),
          maxAmount: this.props.donation.amountRemaining,
        }),
      )
      .catch(err => {
        if (err === 'noBalance') {
          ErrorPopup('There is no balance left on the account.', err);
        } else {
          ErrorPopup('Something went wrong.', err);
        }
      });
  }

  selectedObject(type, { target }, amountSelected) {
    const admin = this.props.types.find(t => t._id === target.value[0]);

    let maxAmount = this.props.donation.amountRemaining;

    if (admin && admin instanceof Campaign && admin.isCapped) {
      const maxDelegationAmount = admin.maxAmount.minus(admin.currentBalance);

      if (maxDelegationAmount.lt(this.props.donation.amountRemaining)) {
        maxAmount = maxDelegationAmount;
      }
    }
    let tempAmount = 0;
    if (amountSelected !== 0) {
      tempAmount = amountSelected;
    } else {
      tempAmount = maxAmount.toFixed();
    }

    this.setState({
      maxAmount,
      amount: tempAmount,
      objectsToDelegateToCampaign: target.value,
    });
    if (type === Milestone.type) {
      this.setState({ objectsToDelegateToMilestone: target.value });
    } else {
      this.setState({
        curProjectId: admin ? admin.projectId : null,
        objectsToDelegateToCampaign: target.value,
      });
    }
  }

  selectedMilestoneObject({ target }) {
    const admin = this.props.types.find(t => t._id === target.value[0]);

    let maxAmount = this.props.donation.amountRemaining;

    if (admin && admin instanceof Milestone && admin.isCapped) {
      const maxDelegationAmount = admin.maxAmount.minus(admin.currentBalance);

      if (maxDelegationAmount.lt(this.props.donation.amountRemaining)) {
        maxAmount = maxDelegationAmount;
      }
    }

    this.setState({
      maxAmount,
      amount: maxAmount.toFixed(),
      objectsToDelegateToMilestone: target.value,
    });
  }

  submit(model) {
    const { donation } = this.props;
    this.setState({ isSaving: true });

    const { objectsToDelegateToCampaign, objectsToDelegateToMilestone } = this.state;
    const objectsToDelegateTo = objectsToDelegateToMilestone[0] || objectsToDelegateToCampaign[0];
    // find the type of where we delegate to
    const admin = this.props.types.find(t => t._id === objectsToDelegateTo);

    // TODO: find a more friendly way to do this.
    if (
      admin instanceof Milestone &&
      admin.isCapped &&
      admin.maxAmount.lt(admin.currentBalance || 0)
    ) {
      React.toast.error('That Milestone has reached its funding goal. Please pick another.');
      return;
    }

    const onCreated = txLink => {
      this.setState({ isSaving: false });
      const msg =
        donation.delegateId > 0 ? (
          <p>
            The Giver has <strong>3 days</strong> to reject your delegation before the money gets
            locked
          </p>
        ) : (
          <p>The Giver has been notified.</p>
        );

      GA.trackEvent({
        category: 'Donation',
        action: 'delegated',
        label: donation._id,
      });

      React.swal({
        title: 'Delegated!',
        content: React.swal.msg(
          <div>
            <p>
              The donation has been delegated,{' '}
              <a href={`${txLink}`} target="_blank" rel="noopener noreferrer">
                view the transaction here.
              </a>
            </p>
            {msg}
          </div>,
        ),
        icon: 'success',
      });
    };

    const onSuccess = txLink => {
      React.toast.success(
        <p>
          Your donation has been confirmed!
          <br />
          <a href={`${txLink}`} target="_blank" rel="noopener noreferrer">
            View transaction
          </a>
        </p>,
      );
    };
    // FIXME: This is super ugly, there is a short flash period when the submit button is pressed before the unlock/success appears
    this.setState({ modalVisible: false });

    DonationService.delegate(
      this.props.donation,
      utils.toWei(model.amount),
      admin,
      onCreated,
      onSuccess,
    );
  }

  render() {
    const { types, milestoneOnly, donation } = this.props;
    const {
      isSaving,
      objectsToDelegateToMilestone,
      objectsToDelegateToCampaign,
      maxAmount,
      curProjectId,
    } = this.state;
    const style = { display: 'inline-block' };
    const pStyle = { whiteSpace: 'normal' };

    const campaignTypes = [];
    const milestoneTypes = [];

    const milestoneOnlyCampaignTypes = [];
    const filteredTypes = getFilterType(types, donation);
    const objectsToDelegateTypes = getTypes(filteredTypes);

    objectsToDelegateTypes.forEach(t => {
      if (t.type === Milestone.type) {
        if ([null, t.campaignProjectId].includes(curProjectId)) {
          milestoneTypes.push(t);
        }
      } else {
        campaignTypes.push(t);
      }
    });

    const campaignValue = [];
    if (milestoneOnly && filteredTypes.length > 0) {
      milestoneOnlyCampaignTypes.push(...getTypes([filteredTypes[0].campaign]));
      campaignValue.push(milestoneOnlyCampaignTypes[0].id);
    } else {
      campaignValue.push(...objectsToDelegateToCampaign);
    }

    return (
      <span style={style}>
        <button type="button" className="btn btn-success btn-sm" onClick={() => this.openDialog()}>
          Delegate
        </button>

        <Modal
          isOpen={this.state.modalVisible}
          onRequestClose={() => {
            this.setState({ modalVisible: false });
          }}
          contentLabel="Delegate Donation"
          style={modalStyles}
        >
          {milestoneOnly && <p>Select a Milestone to delegate this donation to:</p>}
          {!milestoneOnly && <p>Select a Campaign or Milestone to delegate this donation to:</p>}

          <p style={pStyle}>
            You are delegating donation made on{' '}
            <strong>{new Date(donation.createdAt).toLocaleDateString()}</strong> by{' '}
            <strong>{donation.giver.name || donation.giverAddress}</strong> of a value{' '}
            <strong>
              {donation.amountRemaining.toFixed()} {donation.token.symbol}
            </strong>{' '}
            that has been donated to <strong>{donation.donatedTo.name}</strong>
          </p>
          <Form onSubmit={this.submit} layout="vertical">
            <div className="form-group">
              <span className="label">Delegate to:</span>
              <div layout="vertical">
                <InputToken
                  disabled={milestoneOnly}
                  name="delegateTo"
                  label="Delegate to:"
                  placeholder="Select a Campaign"
                  value={campaignValue}
                  options={milestoneOnly ? milestoneOnlyCampaignTypes : campaignTypes}
                  onSelect={v => this.selectedObject(Campaign.type, v, this.state.amountSelected)}
                  maxLength={1}
                />
                <InputToken
                  name="delegateToMilestone"
                  label="Delegate to:"
                  placeholder="Select a Milestone"
                  value={objectsToDelegateToMilestone}
                  options={milestoneTypes}
                  onSelect={v => this.selectedObject(Milestone.type, v, this.state.amountSelected)}
                />
              </div>
            </div>

            <span className="label">Amount to delegate:</span>

            <div className="form-group">
              <Slider
                type="range"
                name="amount2"
                min={0}
                max={maxAmount.toNumber()}
                step={maxAmount.toNumber() / 10}
                value={Number(this.state.amount)}
                labels={{
                  0: '0',
                  [maxAmount.toNumber()]: maxAmount.toFixed(),
                }}
                tooltip={false}
                onChange={amount =>
                  this.setState({
                    amount: Number(amount).toFixed(2),
                    amountSelected: Number(amount).toFixed(2),
                  })
                }
              />
            </div>

            <div className="form-group">
              <Input
                type="number"
                validations={`greaterThan:0,isNumeric,lessOrEqualTo:${maxAmount.toNumber()}`}
                validationErrors={{
                  greaterThan: 'Enter value greater than 0',
                  lessOrEqualTo: `The donation maximum amount you can delegate is ${maxAmount.toFixed()}. Do not input higher amount.`,
                  isNumeric: 'Provide correct number',
                }}
                name="amount"
                value={this.state.amount}
                onChange={amount =>
                  this.setState({ amount }, this.setState({ amountSelected: amount }))
                }
              />
            </div>

            <button
              className="btn btn-success"
              formNoValidate
              type="submit"
              disabled={
                isSaving || milestoneOnly
                  ? objectsToDelegateToMilestone.length !== 1
                  : campaignValue.length !== 1
              }
            >
              {isSaving ? 'Delegating...' : 'Delegate here'}
            </button>
          </Form>
        </Modal>
      </span>
    );
  }
}

DelegateButton.propTypes = {
  balance: PropTypes.instanceOf(BigNumber).isRequired,
  types: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  milestoneOnly: PropTypes.bool,
  donation: PropTypes.instanceOf(Donation).isRequired,
};

DelegateButton.defaultProps = {
  milestoneOnly: false,
};

export default DelegateButton;
