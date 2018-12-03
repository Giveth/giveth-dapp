import React, { Component } from 'react';
import Modal from 'react-modal';
import { utils } from 'web3';
import { Form, Input } from 'formsy-react-components';
import PropTypes from 'prop-types';
import { paramsForServer } from 'feathers-hooks-common';
import Slider from 'react-rangeslider';
import 'react-rangeslider/lib/index.css';
import BigNumber from 'bignumber.js';
import InputToken from 'react-input-token';

import { checkBalance } from '../lib/middleware';
import { feathersClient } from '../lib/feathersClient';
import Loader from './Loader';
import config from '../configuration';
import SelectFormsy from './SelectFormsy';
import NetworkWarning from './NetworkWarning';

import Donation from '../models/Donation';
import Campaign from '../models/Campaign';
import User from '../models/User';

import DonationService from '../services/DonationService';
import { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';

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

const _getTokenWhitelist = () => {
  const r = React.whitelist.tokenWhitelist;
  return r.map(t => {
    if (t.symbol === 'ETH') {
      t.name = `${config.homeNetworkName} ETH`;
    }
    t.balance = '0';
    return t;
  });
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
class BaseDelegateMultipleButton extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isSaving: false,
      isLoadingDonations: true,
      modalVisible: false,
      delegations: [],
      maxAmount: 0,
      delegationOptions: [],
      objectToDelegateFrom: [],
      tokenWhitelistOptions: _getTokenWhitelist().map(t => ({
        value: t.address,
        title: t.name,
      })),
      selectedToken: this.props.milestone
        ? this.props.milestone.token
        : _getTokenWhitelist().find(t => t.symbol === 'ETH'),
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
              this.selectedObject({ target: { value: [delegationOptions[0].id] } });
            }
          });
        },
        () => {},
      );
  }

  setToken(address) {
    this.setState(
      {
        selectedToken: _getTokenWhitelist().find(t => t.address === address),
        isLoadingDonations: true,
      },
      () => this.loadDonations(this.state.objectToDelegateFrom),
    );
  }

  selectedObject({ target }) {
    this.setState({ objectToDelegateFrom: target.value, isLoadingDonations: true });

    this.loadDonations(target.value);
  }

  loadDonations(ids) {
    if (ids.length !== 1) return;

    const entity = this.state.delegationOptions.find(c => c.id === ids[0]);

    if (this.donationsObserver) this.donationsObserver.unsubscribe();

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

    const query = paramsForServer({
      query: {
        amountRemaining: { $ne: 0 },
        ...options,
        $sort: { createdAt: 1 },
        'token.symbol': this.state.selectedToken.symbol,
      },
      schema: 'includeTypeAndGiverDetails',
    });

    // start watching donations, this will re-run when donations change or are added
    this.donationsObserver = feathersClient
      .service('donations')
      .watch({ listStrategy: 'always' })
      .find(query)
      .subscribe(
        donations => {
          const delegations = donations.data.map(d => new Donation(d));
          let amount = utils.fromWei(
            delegations
              .reduce((sum, d) => sum.add(utils.toBN(d.amountRemaining)), utils.toBN('0'))
              .toString(),
          );

          if (
            this.props.milestone &&
            new BigNumber(this.props.milestone.maxAmount).lt(new BigNumber(amount))
          )
            amount = this.props.milestone.maxAmount;

          this.setState({
            delegations,
            maxAmount: amount,
            amount,
            isLoadingDonations: false,
          });
        },
        () => this.setState({ isLoadingDonations: false }),
      );
  }

  openDialog() {
    checkBalance(this.props.balance).then(() => this.setState({ modalVisible: true }));
  }

  submit(model) {
    this.setState({ isSaving: true });

    const onCreated = txLink => {
      this.setState({ isSaving: false, modalVisible: false, objectToDelegateFrom: [] });
      React.swal({
        title: 'Delegated!',
        content: React.swal.msg(
          <span>
            The donations have been delegated,{' '}
            <a href={`${txLink}`} target="_blank" rel="noopener noreferrer">
              view the transaction here.
            </a>
            <p>
              The donations have been delegated. Please note the the Giver may have{' '}
              <strong>3 days</strong> to reject your delegation before the money gets committed.
            </p>
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
      utils.toWei(model.amount),
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
    } = this.state;
    const { campaign, milestone, validProvider, isForeignNetwork } = this.props;

    return (
      <span style={style}>
        <button type="button" className="btn btn-info" onClick={() => this.openDialog()}>
          Delegate funds here
        </button>

        <Modal
          isOpen={this.state.modalVisible}
          style={modalStyles}
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
            <NetworkWarning
              incorrectNetwork={!isForeignNetwork}
              networkName={config.foreignNetworkName}
            />
          )}
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
                  placeholder={this.props.campaign ? 'Select a DAC' : 'Select a DAC or Campaign'}
                  value={this.state.objectToDelegateFrom}
                  options={delegationOptions}
                  onSelect={this.selectedObject}
                  maxLength={1}
                />
              </div>

              {this.state.objectToDelegateFrom.length !== 1 && (
                <p>
                  Please select entity from which you want to delegate money to the{' '}
                  {campaign ? campaign.title : milestone.title}{' '}
                </p>
              )}
              {this.state.objectToDelegateFrom.length === 1 && isLoadingDonations && (
                <Loader className="small btn-loader" />
              )}
              {this.state.objectToDelegateFrom.length === 1 && !isLoadingDonations && (
                <div>
                  {!this.props.milestone && (
                    <SelectFormsy
                      name="token"
                      id="token-select"
                      label="Select token or ETH to delegate"
                      helpText=""
                      value={selectedToken && selectedToken.address}
                      cta="--- Select ---"
                      options={tokenWhitelistOptions}
                      onChange={address => this.setToken(address)}
                    />
                  )}

                  {delegations.length === 0 && (
                    <p>
                      The amount available to delegate is {this.state.maxAmount}{' '}
                      {selectedToken.symbol}. Please select a different currency or different source
                      DAC/Campaign.
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
                          max={Number(this.state.maxAmount)}
                          step={this.state.maxAmount / 10}
                          value={Number(this.state.amount)}
                          labels={{ 0: '0', [this.state.maxAmount]: this.state.maxAmount }}
                          tooltip={false}
                          onChange={amount =>
                            this.setState(prevState => ({
                              amount:
                                Number(amount).toFixed(2) > prevState.maxAmount
                                  ? prevState.maxAmount
                                  : Number(amount).toFixed(2),
                            }))
                          }
                        />
                      </div>

                      <div className="form-group">
                        <Input
                          type="text"
                          validations={`greaterThan:0,isNumeric,lessOrEqualTo:${
                            this.state.maxAmount
                          }`}
                          validationErrors={{
                            greaterThan: 'Enter value greater than 0',
                            lessOrEqualTo: `The donations you are delegating have combined value of ${
                              this.state.maxAmount
                            }. Do not input higher amount than that.`,
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
                        disabled={isSaving || !isForeignNetwork}
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
        </Modal>
      </span>
    );
  }
}

const DelegateMultipleButton = props => (
  <Web3Consumer>
    {({ state: { isForeignNetwork, validProvider, balance } }) => (
      <BaseDelegateMultipleButton
        ETHBalance={balance}
        validProvider={validProvider}
        isForeignNetwork={isForeignNetwork}
        {...props}
      />
    )}
  </Web3Consumer>
);

BaseDelegateMultipleButton.propTypes = {
  balance: PropTypes.objectOf(utils.BN).isRequired,
  currentUser: PropTypes.instanceOf(User).isRequired,
  campaign: PropTypes.instanceOf(Campaign),
  milestone: PropTypes.shape(),
  style: PropTypes.shape(),
  validProvider: PropTypes.bool.isRequired,
  isForeignNetwork: PropTypes.bool.isRequired,
};

BaseDelegateMultipleButton.defaultProps = {
  campaign: undefined,
  milestone: undefined,
  style: {},
};

export default DelegateMultipleButton;
