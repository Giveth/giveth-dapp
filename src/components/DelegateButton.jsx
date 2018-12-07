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

// FIXME: We need slider component that uses bignumbers, there are some precision issues here
class DelegateButton extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isSaving: false,
      objectsToDelegateTo: [],
      modalVisible: false,
      amount: utils.fromWei(props.donation.amountRemaining),
      maxAmount: utils.fromWei(props.donation.amountRemaining),
    };

    this.submit = this.submit.bind(this);
    this.selectedObject = this.selectedObject.bind(this);
  }

  openDialog() {
    checkBalance(this.props.balance)
      .then(() => this.setState({ modalVisible: true }))
      .catch(err => {
        if (err === 'noBalance') {
          // handle no balance error
        }
      });
  }

  selectedObject({ target }) {
    const admin = this.props.types.find(t => t._id === target.value[0]);

    let maxAmount = utils.fromWei(this.props.donation.amountRemaining);

    if (admin && admin instanceof Milestone) {
      const maxDelegationAmount = new BigNumber(admin.maxAmount).minus(
        utils.fromWei(admin.currentBalance),
      );
      if (maxDelegationAmount.lt(new BigNumber(utils.fromWei(this.props.donation.amountRemaining))))
        maxAmount = utils.fromWei(maxDelegationAmount.toString());
    }

    this.setState({
      maxAmount,
      amount: maxAmount,
      objectsToDelegateTo: target.value,
    });
  }

  submit(model) {
    const { toBN } = utils;
    const { donation } = this.props;
    this.setState({ isSaving: true });

    // find the type of where we delegate to
    const admin = this.props.types.find(t => t._id === this.state.objectsToDelegateTo[0]);

    // TODO: find a more friendly way to do this.
    if (admin.type === Milestone.type && toBN(admin.maxAmount).lt(toBN(admin.totalDonated || 0))) {
      React.toast.error('That milestone has reached its funding goal. Please pick another.');
      return;
    }

    const onCreated = txLink => {
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
          <p>
            The donation has been delegated,{' '}
            <a href={`${txLink}`} target="_blank" rel="noopener noreferrer">
              view the transaction here.
            </a>
            {msg}
          </p>,
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
    const { isSaving, objectsToDelegateTo, maxAmount } = this.state;
    const style = { display: 'inline-block' };
    const pStyle = { whiteSpace: 'normal' };

    const getTypes = () =>
      types.map(t => {
        const el = {};
        el.name = t.title;
        el.type = t instanceof Milestone ? Milestone.type : Campaign.type;
        el.id = t._id;
        el.element = (
          <span>
            {t.title} <em>{t instanceof Milestone ? 'Milestone' : 'Campaign'}</em>
          </span>
        );
        return el;
      });

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
            You are delegating donation from{' '}
            <strong>{donation.giver.name || donation.giverAddress}</strong> of a value{' '}
            <strong>
              {utils.fromWei(donation.amountRemaining)} {donation.token.symbol}
            </strong>{' '}
            that has been donated to <strong>{donation.donatedTo.name}</strong>
          </p>
          <Form onSubmit={this.submit} layout="vertical">
            <div className="form-group">
              <span className="label">Delegate to:</span>
              <InputToken
                name="delegateTo"
                label="Delegate to:"
                placeholder={
                  milestoneOnly ? 'Select a Milestone' : 'Select a Campaign or Milestone'
                }
                value={objectsToDelegateTo}
                options={getTypes()}
                onSelect={this.selectedObject}
                maxLength={1}
              />
            </div>

            <span className="label">Amount to delegate:</span>

            <div className="form-group">
              <Slider
                type="range"
                name="amount2"
                min={0}
                max={Number(maxAmount)}
                step={maxAmount / 10}
                value={Number(this.state.amount)}
                labels={{
                  0: '0',
                  [maxAmount]: maxAmount,
                }}
                tooltip={false}
                onChange={amount => this.setState({ amount: Number(amount).toFixed(2) })}
              />
            </div>

            <div className="form-group">
              <Input
                type="text"
                validations={`greaterThan:0,isNumeric,lessOrEqualTo:${maxAmount}`}
                validationErrors={{
                  greaterThan: 'Enter value greater than 0',
                  lessOrEqualTo: `The donation maximum amount you can delegate is ${maxAmount}. Do not input higher amount.`,
                  isNumeric: 'Provide correct number',
                }}
                name="amount"
                value={this.state.amount}
                onChange={(name, amount) => this.setState({ amount })}
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
        </Modal>
      </span>
    );
  }
}

DelegateButton.propTypes = {
  balance: PropTypes.objectOf(utils.BN).isRequired,
  types: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  milestoneOnly: PropTypes.bool,
  donation: PropTypes.instanceOf(Donation).isRequired,
};

DelegateButton.defaultProps = {
  milestoneOnly: false,
};

export default DelegateButton;
