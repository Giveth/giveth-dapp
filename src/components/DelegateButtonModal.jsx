import React, { Component } from 'react';
import BigNumber from 'bignumber.js';
import { Slider } from 'antd';

import { utils } from 'web3';
import { Form, Textarea } from 'formsy-react-components';
import InputToken from 'react-input-token';
import PropTypes from 'prop-types';
import 'react-rangeslider/lib/index.css';

import GA from 'lib/GoogleAnalytics';
import Donation from 'models/Donation';
import Milestone from 'models/Milestone';
import Campaign from 'models/Campaign';
import ReactTooltip from 'react-tooltip';
import DonationService from '../services/DonationService';
import NumericInput from './NumericInput';
import { convertEthHelper, roundBigNumber } from '../lib/helpers';

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
        {t.title} <em>{isMilestone ? 'Milestone' : 'Campaign'}</em>
      </span>
    );
    if (isMilestone) {
      el.campaignProjectId = t.campaign.projectId;
    }
    return el;
  });
}

// FIXME: We need slider component that uses bignumbers, there are some precision issues here
class DelegateButtonModal extends Component {
  constructor(props) {
    super(props);

    const { donation } = this.props;
    const { amountRemaining, token } = donation;

    this.state = {
      isSaving: false,
      objectsToDelegateToCampaign: [],
      objectsToDelegateToMilestone: [],
      amount: convertEthHelper(amountRemaining, token.decimals),
      comment: '',
      maxAmount: roundBigNumber(amountRemaining, 18),
      curProjectId: null,
      formIsValid: false,
    };

    this.form = React.createRef();

    this.submit = this.submit.bind(this);
    this.selectedObject = this.selectedObject.bind(this);
    this.toggleFormValid = this.toggleFormValid.bind(this);
  }

  selectedObject(type, { target }) {
    const { types, donation } = this.props;
    const { amount } = this.state;
    const admin = types.find(t => t._id === target.value[0]);

    let maxAmount = donation.amountRemaining;

    if (admin && admin instanceof Milestone && admin.isCapped) {
      const maxDelegationAmount = admin.maxAmount.minus(admin.currentBalance);

      if (maxDelegationAmount.lt(donation.amountRemaining)) {
        maxAmount = maxDelegationAmount;
      }
    }

    const { decimals } = donation.token;

    this.setState({
      maxAmount: roundBigNumber(maxAmount, decimals),
      amount: convertEthHelper(BigNumber.min(amount, maxAmount), decimals),
    });

    if (type === Milestone.type) {
      this.setState(
        {
          objectsToDelegateToMilestone: target.value,
        },
        this.toggleFormValid,
      );
      if (admin) {
        const campaign = types.find(t => admin.campaign.projectId === t.projectId);
        this.setState(
          {
            objectsToDelegateToCampaign: campaign ? [campaign._id] : [],
          },
          this.toggleFormValid,
        );
      }
    } else {
      this.setState(
        {
          curProjectId: admin ? admin.projectId : null,
          objectsToDelegateToCampaign: target.value,
        },
        this.toggleFormValid,
      );

      const { objectsToDelegateToMilestone } = this.state;
      if (objectsToDelegateToMilestone.length > 0) {
        const milestone = types.find(
          t => t.type === Milestone.type && t._id === objectsToDelegateToMilestone[0],
        );
        if (!admin || !milestone || milestone.campaign.projectId !== admin.projectId) {
          this.setState({ objectsToDelegateToMilestone: [] }, this.toggleFormValid);
        }
      }
    }
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
      admin.maxAmount.lte(admin.currentBalance || 0)
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

    const onError = () => {
      this.setState({ isSaving: false });
    };

    // FIXME: This is super ugly, there is a short flash period when the submit button is pressed before the unlock/success appears
    this.props.closeDialog();
    this.setState({
      amount: '0',
      objectsToDelegateToCampaign: [],
      objectsToDelegateToMilestone: [],
    });

    DonationService.delegate(
      this.props.donation,
      utils.toWei(model.amount),
      model.comment,
      admin,
      onCreated,
      onSuccess,
      onError,
    );
  }

  toggleFormValid(formIsValid) {
    if (formIsValid === false) {
      this.setState({ formIsValid: false });
      return;
    }

    // not called by Form component
    if (formIsValid === undefined) {
      const form = this.form.current.formsyForm;
      const isValid = form && form.state.isValid;
      if (!isValid) {
        this.setState({ formIsValid: false });
        return;
      }
    }

    this.setState(prevState => {
      const { objectsToDelegateToMilestone, objectsToDelegateToCampaign } = prevState;
      const totalSelected =
        objectsToDelegateToMilestone.length + objectsToDelegateToCampaign.length;
      return {
        formIsValid: totalSelected !== 0,
      };
    });
  }

  render() {
    const { types, milestoneOnly, donation, closeDialog } = this.props;
    const { token } = donation;
    const { decimals } = token;

    const {
      isSaving,
      objectsToDelegateToMilestone,
      objectsToDelegateToCampaign,
      maxAmount,
      curProjectId,
      amount,
      comment,
      formIsValid,
    } = this.state;

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

    const sliderMarks = {
      0: '0',
    };
    sliderMarks[maxAmount.toNumber()] = maxAmount.toNumber();

    return (
      <React.Fragment>
        {milestoneOnly && <p>Select a Milestone to delegate this donation to:</p>}
        {!milestoneOnly && <p>Select a Campaign or Milestone to delegate this donation to:</p>}

        <p style={pStyle}>
          You are delegating donation made on{' '}
          <strong>{new Date(donation.createdAt).toLocaleDateString()}</strong> by{' '}
          <strong>{donation.giver.name || donation.giverAddress}</strong> of a value{' '}
          <strong>
            {donation.amountRemaining.toFixed()} {token.symbol}
          </strong>{' '}
          that has been donated to <strong>{donation.donatedTo.name}</strong>
        </p>
        <Form
          onSubmit={this.submit}
          layout="vertical"
          onValid={() => this.toggleFormValid(true)}
          onInvalid={() => this.toggleFormValid(false)}
          ref={this.form}
        >
          <div className="form-group">
            <span className="label">
              Delegate to:
              <i
                className="fa fa-question-circle-o btn btn-sm btn-explain"
                data-tip="React-tooltip"
                data-for="delegateHint"
              />
              <ReactTooltip id="delegateHint" place="right" type="dark" effect="solid">
                Just fill campaign field to delegate to campaign, otherwise fund is delegated to
                milestone
              </ReactTooltip>
            </span>
            <div>
              <InputToken
                disabled={milestoneOnly}
                name="delegateTo"
                label="Delegate to:"
                placeholder="Select a Campaign"
                value={campaignValue}
                options={milestoneOnly ? milestoneOnlyCampaignTypes : campaignTypes}
                onSelect={v => this.selectedObject(Campaign.type, v)}
                maxLength={1}
              />
              <InputToken
                name="delegateToMilestone"
                label="Delegate to:"
                placeholder="Select a Milestone"
                value={objectsToDelegateToMilestone}
                options={milestoneTypes}
                onSelect={v => this.selectedObject(Milestone.type, v)}
                maxLength={1}
              />
            </div>
          </div>

          <span className="label">Amount to delegate:</span>

          <div className="form-group" id="amount_slider">
            <Slider
              min={0}
              max={maxAmount.toNumber()}
              onChange={newAmount => {
                this.setState({ amount: newAmount.toString() });
              }}
              value={amount}
              marks={sliderMarks}
              step={decimals ? 1 / 10 ** decimals : 1}
            />
          </div>

          <div className="form-group">
            <NumericInput
              token={token}
              maxAmount={maxAmount}
              id="amount-input"
              value={amount}
              onChange={newAmount => this.setState({ amount: newAmount })}
              lteMessage={`The donation maximum amount you can delegate is ${convertEthHelper(
                maxAmount,
                token.decimals,
              )}. Do not input higher amount.`}
              autoFocus
            />
          </div>
          <div className="form-group">
            <Textarea name="comment" id="comment-input" value={comment} placeholder="Comment" />
          </div>
          <button
            className="btn btn-success"
            formNoValidate
            type="submit"
            disabled={isSaving || !formIsValid}
          >
            {isSaving ? 'Delegating...' : 'Delegate here'}
          </button>
          <button className="btn btn-light float-right" type="button" onClick={closeDialog}>
            Close
          </button>
        </Form>
      </React.Fragment>
    );
  }
}

DelegateButtonModal.propTypes = {
  types: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  milestoneOnly: PropTypes.bool,
  donation: PropTypes.instanceOf(Donation).isRequired,
  closeDialog: PropTypes.func.isRequired,
};

DelegateButtonModal.defaultProps = {
  milestoneOnly: false,
};

export default DelegateButtonModal;
