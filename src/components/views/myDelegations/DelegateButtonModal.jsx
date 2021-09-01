import React, { Component, Fragment } from 'react';
import BigNumber from 'bignumber.js';
import {
  Input,
  Select,
  Slider,
  Form,
  InputNumber,
  Modal,
  Typography,
  Checkbox,
  Spin,
  notification,
} from 'antd';
import Web3, { utils } from 'web3';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';

import Donation from 'models/Donation';
import Trace from 'models/Trace';
import Campaign from 'models/Campaign';
import ReactTooltip from 'react-tooltip';
import DonationBlockchainService from '../../../services/DonationBlockchainService';
import { convertEthHelper, roundBigNumber, txNotification } from '../../../lib/helpers';
import AmountSliderMarks from '../../AmountSliderMarks';
import CampaignService from '../../../services/CampaignService';
import Loader from '../../Loader';
import ErrorHandler from '../../../lib/ErrorHandler';
import { TraceService } from '../../../services';

function getFilterType(types, donation) {
  return types.filter(t => !t.acceptsSingleToken || t.token.symbol === donation.token.symbol);
}

function getTypes(types) {
  return types.map(t => {
    const isTrace = t instanceof Trace;
    const el = {};
    el.name = t.title;
    el.type = isTrace ? Trace.type : Campaign.type;
    el.id = t._id;
    el.projectId = t.projectId;

    if (isTrace) {
      el.maxAmount = t.maxAmount;
      el.donationCounters = t.donationCounters;
      el.campaign = {};
      el.campaign.name = t.campaign.title;
      el.campaign.id = t.campaign._id;
      el.campaign.projectId = t.campaign.projectId;
      el.campaign.status = t.campaign.status;
      el.campaign.type = Campaign.type;
    } else {
      el.status = t.status;
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
      isLoading: true,
      delegateToTrace: true,
      usdRate: 0,
      selectedCampaign: {},
      selectedTrace: {},
      traces: [],
      campaigns: [],
      amount: convertEthHelper(amountRemaining, token.decimals),
      delegationComment: '',
      maxAmount: roundBigNumber(amountRemaining, 18),
    };

    this.debouncedCampaignSearch = React.createRef();
    this.debouncedTraceSearch = React.createRef();

    this.fetchCommunityCampaigns = this.fetchCommunityCampaigns.bind(this);
    this.fetchTraces = this.fetchTraces.bind(this);
    this.selectCampaign = this.selectCampaign.bind(this);
    this.submit = this.submit.bind(this);
    this.selectTrace = this.selectTrace.bind(this);
  }

  componentDidMount() {
    const { traceOnly, donation } = this.props;
    const ownerTypeId = donation._ownerTypeId;
    this.updateRates();
    if (traceOnly) {
      this.setState(
        {
          campaigns: [{ id: ownerTypeId, name: donation._ownerEntity.title }],
          delegateToTrace: true,
        },
        () => this.selectCampaign(ownerTypeId),
      );
    } else this.fetchCommunityCampaigns(); // Proposing campaigns that Community had delegated before

    this.debouncedCampaignSearch.current = debounce(query => this.fetchCampaigns(query), 1000);
    this.debouncedTraceSearch.current = debounce(query => this.fetchTraces(query), 1000);
  }

  setMaxAmount() {
    const { donation } = this.props;
    const { amount, selectedTrace, delegateToTrace } = this.state;
    const donationMaxAmount = donation.amountRemaining;
    const { decimals } = donation.token;

    let traceAmountRemaining;
    if (delegateToTrace && selectedTrace.maxAmount) {
      const hasDonations =
        selectedTrace.donationCounters && selectedTrace.donationCounters.length > 0;
      const traceTotalDonations =
        hasDonations && BigNumber.sum(...selectedTrace.donationCounters.map(d => d.currentBalance));
      traceAmountRemaining = traceTotalDonations
        ? selectedTrace.maxAmount.minus(traceTotalDonations)
        : selectedTrace.maxAmount;
    }

    const maxAmount = traceAmountRemaining
      ? BigNumber.min(donationMaxAmount, traceAmountRemaining)
      : donationMaxAmount;
    const sliderMarks = AmountSliderMarks(maxAmount, decimals);

    this.setState({
      maxAmount: roundBigNumber(maxAmount, decimals),
      amount: convertEthHelper(BigNumber.min(amount, maxAmount), decimals),
      sliderMarks,
    });
  }

  fetchTraces(searchPhrase) {
    const { selectedCampaign } = this.state;

    const query = { fullyFunded: { $ne: true } };

    if (selectedCampaign.id) query.campaignId = selectedCampaign.id;

    if (searchPhrase) {
      query.$text = { $search: searchPhrase };
      query.$sort = { score: { $meta: 'textScore' } };
      query.$select = { score: { $meta: 'textScore' } };
    }

    TraceService.getActiveTraces(
      10,
      0,
      _traces => {
        const filteredTypes = getFilterType(_traces, this.props.donation);
        const objectsToDelegateTypes = getTypes(filteredTypes);
        this.setState({
          isLoading: false,
          isLoadingEntities: false,
          traces: objectsToDelegateTypes,
        });
      },
      err => {
        ErrorHandler(err, 'Some error on fetching Traces, please try later');
        this.setState({ isLoading: false, isLoadingEntities: false });
      },
      query,
    );
  }

  fetchCommunityCampaigns() {
    CampaignService.getCampaignsByIdArray(this.props.donation._delegateEntity.campaigns || [])
      .then(_campaigns => {
        const objectsToDelegateTypes = getTypes(_campaigns);
        this.setState({ campaigns: objectsToDelegateTypes, isLoading: false });
      })
      .catch(err => {
        ErrorHandler(err, 'Some error on fetching Campaigns, please try later');
        this.setState({ isLoading: false });
      });
  }

  fetchCampaigns(query) {
    CampaignService.getCampaigns(
      10,
      0,
      false,
      _campaigns => {
        const objectsToDelegateTypes = getTypes(_campaigns);
        this.setState({
          campaigns: objectsToDelegateTypes,
          isLoading: false,
          isLoadingEntities: false,
        });
      },
      err => {
        ErrorHandler(err, 'Some error on fetching Campaigns, please try later');
        this.setState({ isLoading: false, isLoadingEntities: false });
      },
      ['_id', 'title', 'projectId'],
      query,
    );
  }

  updateRates() {
    const { donation, getConversionRates } = this.props;
    getConversionRates(new Date(), donation.token.symbol, 'USD')
      .then(res => this.setState({ usdRate: res.rates.USD }))
      .catch(() => this.setState({ usdRate: 0 }));
  }

  selectTrace(traceId) {
    const { traces } = this.state;
    const selectedTrace = traces.find(t => t.id === traceId);
    this.setState({ selectedTrace, selectedCampaign: selectedTrace.campaign }, this.setMaxAmount);
  }

  selectCampaign(campaignId) {
    const { campaigns } = this.state;
    const selectedCampaign = campaigns.find(t => t.id === campaignId);

    this.setState(
      {
        isLoading: true,
        selectedCampaign,
        selectedTrace: {},
      },
      () => {
        this.fetchTraces();
        this.setMaxAmount();
      },
    );
  }

  submit() {
    const { donation } = this.props;
    this.setState({ isSaving: true });

    const { selectedCampaign, selectedTrace, delegateToTrace } = this.state;
    // find the type of where we delegate to
    const admin = !delegateToTrace || !selectedTrace.name ? selectedCampaign : selectedTrace;

    if (selectedCampaign.status === Campaign.ARCHIVED)
      return notification.error({
        message: '',
        description: `${selectedCampaign.name} Campaign is archived. This campaign and its Traces can't be delegated.`,
      });

    const onCreated = txLink => {
      this.props.closeDialog();
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

      Modal.success({
        title: 'Delegated!',
        content: (
          <Fragment>
            <p>
              The donation has been delegated,{' '}
              <a href={`${txLink}`} target="_blank" rel="noopener noreferrer">
                view the transaction here.
              </a>
            </p>
            {msg}
          </Fragment>
        ),
        centered: true,
      });
    };

    const onSuccess = txUrl => txNotification('Your donation has been confirmed!', txUrl);

    const onError = () => {
      this.setState({ isSaving: false });
      this.props.closeDialog();
    };

    return DonationBlockchainService.delegate(
      donation,
      utils.toWei(this.state.amount),
      this.state.delegationComment,
      admin,
      onCreated,
      onSuccess,
      onError,
      this.props.web3,
    );
  }

  render() {
    const { traceOnly, donation } = this.props;
    const { token } = donation;
    const { decimals } = token;

    const {
      isSaving,
      isLoading,
      maxAmount,
      amount,
      sliderMarks,
      usdRate,
      campaigns,
      traces,
      selectedTrace,
      selectedCampaign,
      delegateToTrace,
      isLoadingEntities,
    } = this.state;

    let isZeroAmount = false;
    if (Number(amount) === 0) {
      isZeroAmount = true;
    }

    const selectedTraceName = selectedTrace.name;
    const selectedCampaignName = selectedCampaign.name;
    const totalSelected = traceOnly ? selectedTraceName : selectedTraceName || selectedCampaignName;
    const formIsValid = totalSelected && !isZeroAmount;
    const usdValue = usdRate * amount;

    return (
      <div id="delegate-modal">
        {traceOnly && <p>Select a Trace to delegate this donation to:</p>}
        {!traceOnly && <p>Select a Campaign or Trace to delegate this donation to:</p>}

        <p style={{ whiteSpace: 'normal' }}>
          You are delegating donation made on{' '}
          <strong>{new Date(donation.createdAt).toLocaleDateString()}</strong> by{' '}
          <strong>{donation.giver.name || donation.giverAddress}</strong> of a value{' '}
          <strong>
            {donation.amountRemaining.toFixed()} {token.symbol}
          </strong>{' '}
          that has been donated to <strong>{donation.donatedTo.name}</strong>
        </p>
        <Form onFinish={this.submit} requiredMark>
          <div className="form-group">
            <div className="alert alert-info py-2 my-3 d-flex align-items-center">
              <i className="fa fa-info-circle fa-2x mr-3" />
              Need more results to delegate to? Try searching...
            </div>
            <span className="label">
              Delegate to:
              <i
                className="fa fa-question-circle-o btn btn-sm btn-explain"
                data-tip="React-tooltip"
                data-for="delegateHint"
              />
              <ReactTooltip id="delegateHint" place="right" type="dark" effect="solid">
                Choose a Campaign or a Trace to delegate your funds to.
              </ReactTooltip>
            </span>
            {isLoading ? (
              <Loader />
            ) : (
              <div>
                <Select
                  name="delegateTo"
                  placeholder="Select a Campaign"
                  showSearch
                  allowClear
                  onClear={() => this.setState({ selectedCampaign: {} }, this.setMaxAmount)}
                  optionFilterProp="children"
                  disabled={!!traceOnly}
                  value={selectedCampaignName}
                  onSelect={this.selectCampaign}
                  onSearch={query => {
                    if (!isLoadingEntities) this.setState({ isLoadingEntities: true });
                    this.debouncedCampaignSearch.current(query);
                  }}
                  style={{ width: '100%' }}
                  className="mb-3"
                  notFoundContent={isLoadingEntities ? <Spin size="small" /> : null}
                >
                  {campaigns.map(item => (
                    <Select.Option value={item.id} key={item.id}>
                      {item.name}
                    </Select.Option>
                  ))}
                </Select>

                {!traceOnly && (
                  <Checkbox
                    checked={delegateToTrace}
                    onChange={() =>
                      this.setState({ delegateToTrace: !delegateToTrace }, this.setMaxAmount)
                    }
                    className="mb-3"
                  >
                    <div>I want to delegate to Trace</div>
                  </Checkbox>
                )}

                {delegateToTrace && (
                  <Form.Item
                    name="delegateToTrace"
                    rules={[
                      {
                        required: true,
                        message: 'In case of delegating to Trace, this field is required.',
                      },
                    ]}
                  >
                    <Select
                      name="delegateToTrace"
                      placeholder="Select a Trace"
                      showSearch
                      optionFilterProp="children"
                      value={selectedTraceName}
                      allowClear
                      onClear={() => this.setState({ selectedTrace: {} }, this.setMaxAmount)}
                      onSelect={this.selectTrace}
                      onSearch={query => {
                        if (!isLoadingEntities) this.setState({ isLoadingEntities: true });
                        this.debouncedTraceSearch.current(query);
                      }}
                      style={{ width: '100%' }}
                      className="mb-3"
                      notFoundContent={isLoadingEntities ? <Spin size="small" /> : null}
                    >
                      {traces.map(item => (
                        <Select.Option value={item.id} key={item.id}>
                          {item.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                )}
              </div>
            )}
          </div>
          {totalSelected && !isLoading && (
            <React.Fragment>
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
                <InputNumber
                  min={0}
                  max={maxAmount.decimalPlaces(Number(decimals), BigNumber.ROUND_DOWN).toNumber()}
                  id="amount-input"
                  value={amount}
                  onChange={newAmount => this.setState({ amount: newAmount })}
                  autoFocus
                  style={{ minWidth: '200px' }}
                  className="rounded"
                  size="large"
                  precision={decimals}
                />
                <Typography.Text className="ant-form-text pl-2" type="secondary">
                  ≈ {Math.round(usdValue)} USD
                </Typography.Text>
              </div>

              <div className="form-group">
                <Input.TextArea
                  name="comment"
                  id="comment-input"
                  className="rounded"
                  placeholder="Comment"
                  onChange={e => this.setState({ delegationComment: e.target.value })}
                />
              </div>
            </React.Fragment>
          )}

          <button
            className="btn btn-success"
            formNoValidate
            type="submit"
            disabled={isSaving || !formIsValid}
          >
            {isSaving ? 'Delegating...' : 'Delegate here'}
          </button>
        </Form>
      </div>
    );
  }
}

DelegateButtonModal.propTypes = {
  traceOnly: PropTypes.bool,
  donation: PropTypes.instanceOf(Donation).isRequired,
  closeDialog: PropTypes.func.isRequired,
  web3: PropTypes.instanceOf(Web3).isRequired,
  getConversionRates: PropTypes.func.isRequired,
};

DelegateButtonModal.defaultProps = {
  traceOnly: false,
};

export default DelegateButtonModal;
