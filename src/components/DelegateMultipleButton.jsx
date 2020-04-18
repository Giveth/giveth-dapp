/* eslint-disable no-restricted-globals */
import React, { Component, Fragment } from 'react';
import Modal from 'react-modal';
import BigNumber from 'bignumber.js';
import { utils } from 'web3';
import { Form, Input } from 'formsy-react-components';
import PropTypes from 'prop-types';
import { paramsForServer } from 'feathers-hooks-common';
import Slider from 'react-rangeslider';
import 'react-rangeslider/lib/index.css';
import InputToken from 'react-input-token';

import Donation from 'models/Donation';
import Campaign from 'models/Campaign';
import Milestone from 'models/Milestone';
import User from 'models/User';
import { isLoggedIn, checkBalance } from '../lib/middleware';
import { feathersClient } from '../lib/feathersClient';
import Loader from './Loader';
import config from '../configuration';
import SelectFormsy from './SelectFormsy';
import ActionNetworkWarning from './ActionNetworkWarning';

import DonationService from '../services/DonationService';
import { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';
import { Consumer as WhiteListConsumer } from '../contextProviders/WhiteListProvider';

BigNumber.config({ DECIMAL_PLACES: 18 });
Modal.setAppElement('#root');

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

/**
 * Retrieves the oldest 100 donations that the user can delegate
 *
 * @prop {BN}           balance     Current user's balance
 * @prop {User}         currentUser Current user of the Dapp
 * @prop {Campaign}     campaign    If the delegation is towards campaign, this contains the campaign
 * @prop {Object}       milestone   It the delegation is towards campaign, this contains the milestone
 * @prop {Object}       style       Styles added to the button
 */
class DelegateMultipleButton extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isSaving: false,
      isLoadingDonations: true,
      modalVisible: false,
      delegations: [],
      maxAmount: new BigNumber('0'),
      selectedAmount: new BigNumber('0'),
      delegationOptions: [],
      objectToDelegateFrom: [],
      tokenWhitelistOptions: props.tokenWhitelist.map(t => ({
        value: t.address,
        title: t.name,
      })),
      selectedToken:
        this.props.milestone && this.props.milestone.acceptsSingleToken
          ? this.props.milestone.token
          : props.tokenWhitelist[0],
    };

    this.loadDonations = this.loadDonations.bind(this);
    this.selectedObject = this.selectedObject.bind(this);
    this.submit = this.submit.bind(this);
  }

  componentDidMount() {
    this.dacsObserver = feathersClient
      .service('dacs')
      .watch({ listStrategy: 'always' })
      .find({
        query: {
          delegateId: { $gt: '0' },
          ownerAddress: this.props.currentUser.address,
          $select: ['ownerAddress', 'title', '_id', 'delegateId', 'delegateEntity', 'delegate'],
        },
      })
      .subscribe(
        resp => {
          const dacs = resp.data.map(c => ({
            name: c.title,
            id: c._id,
            ownerAddress: c.ownerAddress,
            delegateId: c.delegateId,
            delegateEntity: c.delegateEntity,
            delegate: c.delegate,
            type: 'dac',
          }));

          const delegationOptions =
            this.props.milestone &&
            this.props.campaign.ownerAddress.toLowerCase() ===
              this.props.currentUser.address.toLowerCase()
              ? dacs.concat([
                  {
                    id: this.props.campaign._id,
                    name: this.props.campaign.title,
                    projectId: this.props.campaign.projectId,
                    ownerEntity: this.props.milestone.ownerEntity,
                    type: 'campaign',
                  },
                ])
              : dacs;

          this.setState({ delegationOptions }, () => {
            if (delegationOptions.length === 1) {
              this.selectedObject(
                { target: { value: [delegationOptions[0].id] } },
                new BigNumber(0),
              );
            }
          });
        },
        () => {},
      );
  }

  setToken(address) {
    this.setState(
      {
        selectedToken: this.props.tokenWhitelist.find(t => t.address === address),
        isLoadingDonations: true,
      },
      () => this.loadDonations(this.state.objectToDelegateFrom),
    );
  }

  selectedObject({ target }, selectedAmount) {
    this.setState(
      {
        objectToDelegateFrom: target.value,
        isLoadingDonations: true,
      },
      () => this.loadDonations(target.value, selectedAmount),
    );
  }

  async loadDonations(ids, selectedAmount) {
    if (ids.length !== 1) return;

    const entity = this.state.delegationOptions.find(c => c.id === ids[0]);

    const options = {};

    switch (entity.type) {
      case 'dac':
        options.delegateId = entity.delegateId;
        options.delegateTypeId = entity.id;
        options.status = Donation.WAITING;

        break;
      case 'campaign':
        options.ownerId = entity.projectId;
        options.ownerTypeId = entity.id;
        options.status = Donation.COMMITTED;
        break;
      default:
        break;
    }

    const service = feathersClient.service('donations');
    let donations = [];
    let total;
    let spare = config.donationDelegateCountLimit;
    const pledgeSet = new Set();
    // After having #donationDelegateCountLimit distinct pledges, check for next donations and add it if its pledgeId overlaps
    do {
      const query = paramsForServer({
        query: {
          amountRemaining: { $ne: 0 },
          ...options,
          $sort: { createdAt: 1 },
          $limit: spare || 1,
          'token.symbol': this.state.selectedToken.symbol,
          $skip: donations.length,
        },
        schema: 'includeTypeAndGiverDetails',
      });
      // eslint-disable-next-line no-await-in-loop
      const resp = await service.find(query);

      if (spare === 0) {
        if (!pledgeSet.has(resp.data[0].pledgeId)) {
          break;
        }
      } else {
        resp.data.map(d => d.pledgeId).forEach(pledgeId => pledgeSet.add(pledgeId));
        spare = config.donationDelegateCountLimit - pledgeSet.size;
      }

      donations = donations.concat(resp.data);
      total = resp.total;
      // We can collect donations from #donationCollectionCountLimit distinct pledges
    } while (donations.length < total);

    // start watching donations, this will re-run when donations change or are added

    const delegations = donations.map(d => new Donation(d));
    let amount = delegations.reduce((sum, d) => sum.plus(d.amountRemaining), new BigNumber('0'));

    let localMax = amount;

    if (selectedAmount && selectedAmount.toNumber() !== 0) {
      amount = selectedAmount;
    }

    if (this.props.milestone && this.props.milestone.isCapped) {
      const maxDonationAmount = this.props.milestone.maxAmount.minus(
        this.props.milestone.totalDonatedSingleToken,
      );

      if (maxDonationAmount.lt(amount)) {
        amount = maxDonationAmount;
        localMax = maxDonationAmount;
      } else if (maxDonationAmount.lt(localMax)) {
        localMax = maxDonationAmount;
      }
    }

    this.setState({
      delegations,
      maxAmount: localMax,
      isLoadingDonations: false,
      amount: amount.toString(),
    });

    this.setState({ isLoadingDonations: false });
  }

  openDialog() {
    isLoggedIn(this.props.currentUser)
      .then(() => checkBalance(this.props.balance))
      .then(() => this.setState({ modalVisible: true }));
  }

  submit() {
    const { objectToDelegateFrom, delegationOptions } = this.state;
    this.setState({ isSaving: true });

    const delegate = delegationOptions.find(o => o.id === objectToDelegateFrom[0]);
    const delegateType = delegate.type;

    const onCreated = txLink => {
      this.setState({
        isSaving: false,
        modalVisible: false,
        objectToDelegateFrom: [],
      });
      React.swal({
        title: 'Delegated!',
        content: React.swal.msg(
          <span>
            The donations have been delegated,{' '}
            <a href={`${txLink}`} target="_blank" rel="noopener noreferrer">
              view the transaction here.
            </a>
            {delegateType === 'dac' && (
              <p>
                The donations have been delegated. Please note the the Giver may have{' '}
                <strong>3 days</strong> to reject your delegation before the money gets committed.
              </p>
            )}
          </span>,
        ),
        icon: 'success',
      });
    };

    const onSuccess = txLink => {
      React.toast.success(
        <p>
          The delegation has been confirmed!
          <br />
          <a href={`${txLink}`} target="_blank" rel="noopener noreferrer">
            View transaction
          </a>
        </p>,
      );
    };

    const onError = () => {
      this.setState({ isSaving: false });
      React.toast.error(<p>There has been an error with the delegation</p>);
    };

    const onCancel = () => {
      this.setState({ isSaving: false });
      React.toast.error(<p>The delegation transaction has been cancelled</p>);
    };

    DonationService.delegateMultiple(
      this.state.delegations,
      utils.toWei(Number(this.state.amount).toFixed(18)),
      this.props.milestone || this.props.campaign,
      onCreated,
      onSuccess,
      onError,
      onCancel,
    );
  }

  render() {
    const style = { display: 'inline-block', ...this.props.style };
    const {
      isSaving,
      isLoading,
      delegationOptions,
      delegations,
      isLoadingDonations,
      tokenWhitelistOptions,
      selectedToken,
      maxAmount,
      amount,
    } = this.state;
    const {
      campaign,
      milestone,
      validProvider,
      isCorrectNetwork,
      displayForeignNetRequiredWarning,
    } = this.props;

    return (
      <span style={style}>
        <button
          type="button"
          className="btn btn-info"
          onClick={() => {
            if (validProvider && !isCorrectNetwork) {
              displayForeignNetRequiredWarning();
            } else {
              this.openDialog();
            }
          }}
        >
          Delegate funds here
        </button>

        <Modal
          isOpen={this.state.modalVisible}
          style={modalStyles}
          shouldCloseOnOverlayClick={false}
          onRequestClose={() => {
            this.setState({ modalVisible: false });
          }}
        >
          {!validProvider && (
            <div className="alert alert-warning">
              <i className="fa fa-exclamation-triangle" />
              It is recommended that you install <a href="https://metamask.io/">MetaMask</a> to
              donate
            </div>
          )}
          {validProvider && (
            <ActionNetworkWarning
              incorrectNetwork={!isCorrectNetwork}
              networkName={config.foreignNetworkName}
            />
          )}
          {validProvider && isCorrectNetwork && (
            <Fragment>
              <p>
                You are delegating donations to
                {!milestone && <strong> {campaign.title}</strong>}
                {milestone && <strong> {milestone.title}</strong>}
              </p>
              {isLoading && <Loader className="small btn-loader" />}
              {!isLoading && (
                <Form onSubmit={this.submit} layout="vertical">
                  <div className="form-group">
                    <span className="label">Delegate from:</span>
                    <InputToken
                      name="delegateFrom"
                      label="Delegate from:"
                      placeholder={milestone ? 'Select a DAC or Campaign' : 'Select a DAC'}
                      value={this.state.objectToDelegateFrom}
                      options={delegationOptions}
                      onSelect={v => this.selectedObject(v, this.state.selectedAmount)}
                      maxLength={1}
                    />
                  </div>

                  {this.state.objectToDelegateFrom.length !== 1 && (
                    <p>
                      Please select entity from which you want to delegate money to the{' '}
                      {milestone ? milestone.title : campaign.title}{' '}
                    </p>
                  )}
                  {this.state.objectToDelegateFrom.length === 1 && isLoadingDonations && (
                    <Loader className="small btn-loader" />
                  )}
                  {this.state.objectToDelegateFrom.length === 1 && !isLoadingDonations && (
                    <div>
                      {(!this.props.milestone || !this.props.milestone.acceptsSingleToken) && (
                        <SelectFormsy
                          name="token"
                          id="token-select"
                          label={`Select token or ${config.nativeTokenName} to delegate`}
                          helpText=""
                          value={selectedToken && selectedToken.address}
                          options={tokenWhitelistOptions}
                          onChange={address => this.setToken(address)}
                        />
                      )}

                      {delegations.length === 0 && (
                        <p>
                          The amount available to delegate is 0 {selectedToken.symbol}
                          <br />
                          Please select{' '}
                          {!this.props.milestone || !this.props.milestone.acceptsSingleToken
                            ? 'a different currency or '
                            : ''}
                          different source {milestone ? 'DAC/Campaign' : 'DAC'}
                        </p>
                      )}
                      {delegations.length > 0 && (
                        <div>
                          <span className="label">Amount {selectedToken.symbol} to delegate:</span>

                          <div className="form-group">
                            <Slider
                              type="range"
                              name="amount2"
                              min={0}
                              max={maxAmount.toNumber()}
                              step={maxAmount.dividedBy(20).toNumber()}
                              value={Number(amount)}
                              labels={{
                                0: '0',
                                [maxAmount.toNumber()]: maxAmount.precision(6).toString(),
                              }}
                              tooltip={false}
                              onChange={newAmount =>
                                this.setState(prevState => {
                                  const { maxAmount: prevMaxAmount } = prevState;
                                  let result;
                                  const number = prevMaxAmount.gte(newAmount)
                                    ? newAmount
                                    : prevMaxAmount;

                                  const roundedNumber = BigNumber(number).toFixed(
                                    4,
                                    BigNumber.ROUND_DOWN,
                                  );

                                  if (prevMaxAmount.gt(number) && Number(roundedNumber) > 0) {
                                    result = roundedNumber;
                                  } else {
                                    result = number.toString();
                                  }

                                  return {
                                    amount: result,
                                    selectedAmount: new BigNumber(newAmount),
                                  };
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
                                lessOrEqualTo: `The donations you are delegating have combined value of ${maxAmount.toNumber()}. Do not input higher amount than that.`,
                                isNumeric: 'Provide correct number',
                              }}
                              name="amount"
                              value={amount}
                              onChange={(name, newAmount) =>
                                this.setState({
                                  amount: newAmount,
                                  selectedAmount: new BigNumber(newAmount),
                                })
                              }
                            />
                          </div>

                          <button
                            className="btn btn-success"
                            formNoValidate
                            type="submit"
                            disabled={isSaving || !isCorrectNetwork}
                          >
                            {isSaving ? 'Delegating...' : 'Delegate here'}
                          </button>
                          <button
                            className="btn btn-light float-right"
                            type="button"
                            onClick={() => {
                              this.setState({ modalVisible: false });
                            }}
                          >
                            Close
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </Form>
              )}
            </Fragment>
          )}
        </Modal>
      </span>
    );
  }
}

DelegateMultipleButton.propTypes = {
  balance: PropTypes.instanceOf(BigNumber).isRequired,
  currentUser: PropTypes.instanceOf(User).isRequired,
  campaign: PropTypes.instanceOf(Campaign),
  milestone: PropTypes.instanceOf(Milestone),
  style: PropTypes.shape(),
  validProvider: PropTypes.bool.isRequired,
  isCorrectNetwork: PropTypes.bool.isRequired,
  displayForeignNetRequiredWarning: PropTypes.func.isRequired,
  tokenWhitelist: PropTypes.arrayOf(PropTypes.shape()).isRequired,
};

DelegateMultipleButton.defaultProps = {
  campaign: undefined,
  milestone: undefined,
  style: {},
};

export default props => (
  <WhiteListConsumer>
    {({ state: { tokenWhitelist } }) => (
      <Web3Consumer>
        {({
          state: { isForeignNetwork, validProvider },
          actions: { displayForeignNetRequiredWarning },
        }) => (
          <DelegateMultipleButton
            validProvider={validProvider}
            isCorrectNetwork={isForeignNetwork}
            displayForeignNetRequiredWarning={displayForeignNetRequiredWarning}
            tokenWhitelist={tokenWhitelist}
            {...props}
          />
        )}
      </Web3Consumer>
    )}
  </WhiteListConsumer>
);
