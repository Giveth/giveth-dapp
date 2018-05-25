import React, { Component } from 'react';
import { SkyLightStateless } from 'react-skylight';
import { utils } from 'web3';
import { Form, Input } from 'formsy-react-components';
import InputToken from 'react-input-token';
import PropTypes from 'prop-types';

import { checkWalletBalance } from '../lib/middleware';
import GivethWallet from '../lib/blockchain/GivethWallet';

import Donation from '../models/Donation';

import DonationService from '../services/DonationService';

class DelegateButton extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isSaving: false,
      objectsToDelegateTo: [],
      modalVisible: false,
      amount: utils.fromWei(props.donation.amount),
      maxAmount: utils.fromWei(props.donation.amount),
    };

    this.submit = this.submit.bind(this);
    this.selectedObject = this.selectedObject.bind(this);
  }

  openDialog() {
    checkWalletBalance(this.props.wallet).then(() => this.setState({ modalVisible: true }));
  }

  selectedObject({ target }) {
    this.setState({ objectsToDelegateTo: target.value });
  }

  submit(model) {
    const { toBN } = utils;
    const { donation } = this.props;
    this.setState({ isSaving: true });

    // find the type of where we delegate to
    const admin = this.props.types.find(t => t.id === this.state.objectsToDelegateTo[0]);

    // TODO: find a more friendly way to do this.
    if (admin.type === 'milestone' && toBN(admin.maxAmount).lt(toBN(admin.totalDonated || 0))) {
      React.toast.error('That milestone has reached its funding goal. Please pick another.');
      return;
    }

    const onCreated = txLink => {
      this.resetSkylight();

      const msg =
        donation.delegate > 0 ? (
          <p>
            The Giver has <strong>3 days</strong> to reject your delegation before the money gets
            locked
          </p>
        ) : (
          <p>The Giver has been notified.</p>
        );

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
          Your donation has been confirmed!<br />
          <a href={`${txLink}`} target="_blank" rel="noopener noreferrer">
            View transaction
          </a>
        </p>,
      );
    };
    DonationService.delegate(
      this.props.donation,
      utils.toWei(model.amount),
      admin,
      onCreated,
      onSuccess,
    );
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
              <span className="label">Delegate to:</span>
              <InputToken
                name="delegateTo"
                label="Delegate to:"
                placeholder={
                  milestoneOnly ? 'Select a Milestone' : 'Select a Campaign or Milestone'
                }
                value={objectsToDelegateTo}
                options={types}
                onSelect={this.selectedObject}
                maxLength={1}
              />
            </div>

            <div className="form-group">
              <Input
                type="text"
                validations={`greaterThan:0,isNumeric,lessOrEqualTo:${this.state.maxAmount}`}
                validationErrors={{
                  greaterThan: 'Enter value greater than 0',
                  lessOrEqualTo: `The donation you are delegating has value of ${
                    this.state.maxAmount
                  }. Do not input higher amount.`,
                  isNumeric: 'Provide correct number',
                }}
                label="Amount to delegate:"
                name="amount"
                value={this.state.amount}
                onChange={(name, amount) => this.setState({ amount })}
              />
            </div>

            <div className="form-group">
              <Input
                type="range"
                name="amount2"
                min={0}
                max={this.state.maxAmount}
                step={this.state.maxAmount / 10}
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
        </SkyLightStateless>
      </span>
    );
  }
}

DelegateButton.propTypes = {
  wallet: PropTypes.instanceOf(GivethWallet).isRequired,
  types: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  milestoneOnly: PropTypes.bool,
  donation: PropTypes.instanceOf(Donation).isRequired,
};

DelegateButton.defaultProps = {
  milestoneOnly: false,
};

export default DelegateButton;
