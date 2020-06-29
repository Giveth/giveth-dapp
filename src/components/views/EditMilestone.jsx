/* eslint-disable react/sort-comp */
import React, { Component, Fragment } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import Toggle from 'react-toggle';
import BigNumber from 'bignumber.js';
import { Form, Input } from 'formsy-react-components';
import GA from 'lib/GoogleAnalytics';
import queryString from 'query-string';
import Milestone from 'models/Milestone';
import MilestoneFactory from 'models/MilestoneFactory';
import { utils } from 'web3';
import Loader from '../Loader';
import QuillFormsy from '../QuillFormsy';
import SelectFormsy from '../SelectFormsy';
import DatePickerFormsy from '../DatePickerFormsy';
import FormsyImageUploader from '../FormsyImageUploader';
import GoBackButton from '../GoBackButton';
import {
  ANY_TOKEN,
  getStartOfDayUTC,
  getTruncatedText,
  history,
  isOwner,
  ZERO_ADDRESS,
} from '../../lib/helpers';
import {
  authenticateIfPossible,
  checkBalance,
  checkForeignNetwork,
  checkProfile,
  historyBackWFallback,
  sleep,
} from '../../lib/middleware';
import LoaderButton from '../LoaderButton';
import User from '../../models/User';
import templates from '../../lib/milestoneTemplates';
import config from '../../configuration';

import ErrorPopup from '../ErrorPopup';
import MilestoneProof from '../MilestoneProof';

import { Consumer as WhiteListConsumer } from '../../contextProviders/WhiteListProvider';
import getConversionRatesContext from '../../containers/getConversionRatesContext';
import MilestoneService from '../../services/MilestoneService';
import CampaignService from '../../services/CampaignService';
import DACService from '../../services/DACService';
import LPMilestone from '../../models/LPMilestone';
import BridgedMilestone from '../../models/BridgedMilestone';

BigNumber.config({ DECIMAL_PLACES: 18 });

// The following query string variables are loaded in the order displayed here
const validQueryStringVariables = [
  'title',
  'recipientAddress',
  'reviewerAddress',
  'description',
  'selectedFiatType',
  'date',
  'token',
  'tokenAddress',
  'maxAmount',
  'isCapped',
  'requireReviewer',
  // 'fiatAmount', // FIXME: The fiatAmount does not work because it is overwritten when the getConversionRates function is called. This function modifies th e provider and causes re-render which makes the maxAmount being updated incorrectly. The function needs to change to not update the provider state and not expose currentRate
];

const WAIT_INTERVAL = 1000;

const lastFormState = false;

function returnHelpText(conversionRateLoading, milestone, currentRate) {
  if (!conversionRateLoading) {
    return `1 ${milestone.token.symbol} = ${currentRate.rates[milestone.selectedFiatType]} ${
      milestone.selectedFiatType
    }`;
  }
  return ``;
}

function returnMilestone(_this) {
  try {
    return _this.retrieveMilestone();
  } catch (e) {
    return _this.state.milestone;
  }
}

/**
 * Create or edit a Milestone
 *
 *  @props
 *    isNew (bool):
 *      If set, component will load an empty model.
 *      If not set, component expects an id param and will load a milestone object from backend
 *
 *  @params
 *    id (string): an id of a milestone object
 */

class EditMilestone extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      refreshList: [],
      dacs: [],
      isSaving: false,
      formIsValid: false,
      loadTime: Date.now(),
      milestone: MilestoneFactory.create({
        maxAmount: '0',
        fiatAmount: '0',
      }),
      tokenWhitelistOptions: props.tokenWhitelist.map(t => ({
        value: t.address,
        title: t.name,
      })),
      hasReviewer: true,
      delegatePercent: true,
      isLPMilestone: false,
      acceptsSingleToken: true,
      itemizeState: false,
      selectedFiatType: 'EUR',
      fiatAmount: BigNumber('0'),
      maxAmount: BigNumber('0'),
      recipientAddress: '',
    };

    this.form = React.createRef();

    this.submit = this.submit.bind(this);
    this.setImage = this.setImage.bind(this);
    this.setMaxAmount = this.setMaxAmount.bind(this);
    this.setFiatAmount = this.setFiatAmount.bind(this);
    this.setRecipientAddress = this.setRecipientAddress.bind(this);
    this.triggerChange = this.triggerChange.bind(this);
    this.changeSelectedFiat = this.changeSelectedFiat.bind(this);
    this.onItemsChanged = this.onItemsChanged.bind(this);
    this.handleTemplateChange = this.handleTemplateChange.bind(this);
    this.validateMilestoneDesc = this.validateMilestoneDesc.bind(this);
    this.retrieveMilestone = this.retrieveMilestone.bind(this);
    this.setDelegatePercent = this.setDelegatePercent.bind(this);

    this.timer = null;
  }

  componentDidMount() {
    this.initComponent();
  }

  initComponent() {
    const { isForeignNetwork, match, displayForeignNetRequiredWarning } = this.props;
    checkForeignNetwork(isForeignNetwork, displayForeignNetRequiredWarning)
      .then(() => this.checkUser())
      .then(async () => {
        this.setState({
          campaignId: match.params.id,
        });

        await DACService.getDACs(
          undefined, // Limit
          0, // Skip
          (dacs, _) => {
            const formatDACS = dacs.map(r => ({
              value: r.myDelegateId.toString(),
              title: `${r.myDelegateId ? r.myDelegateId : '?'} - ${r._title}`,
            }));

            this.setState(
              prevState => {
                let { delegatePercent } = prevState;
                if (dacs.length === 0) {
                  delegatePercent = false;
                }
                return {
                  dacs: prevState.dacs.concat(formatDACS),
                  delegatePercent,
                };
              },
              () => {
                if (this.state.delegatePercent) {
                  this.setDelegatePercent(true);
                }
              },
            );
          },
          () => {},
        );

        // load a single milestones (when editing)
        if (!this.props.isNew) {
          try {
            const milestone = await MilestoneService.get(this.props.match.params.milestoneId);

            if (
              !(
                isOwner(milestone.owner.address, this.props.currentUser) ||
                isOwner(milestone.campaign.ownerAddress, this.props.currentUser)
              )
            ) {
              this.props.history.goBack();
            }

            this.setState({
              milestone,
              campaignTitle: milestone.campaign.title,
              campaignProjectId: milestone.campaign.projectId,
              campaignId: milestone.campaignId,
              refreshList: milestone.items,
              hasReviewer:
                milestone.reviewerAddress !== '' && milestone.reviewerAddress !== ZERO_ADDRESS,
              delegatePercent: milestone.dacId !== 0,
              isLPMilestone: milestone instanceof LPMilestone,
              acceptsSingleToken: milestone.token !== ANY_TOKEN,
              itemizeState: milestone.itemizeState,
              selectedFiatType: milestone.selectedFiatType,
              fiatAmount: milestone.fiatAmount,
              maxAmount: milestone.maxAmount,
              recipientAddress: milestone.recipientAddress,
              image: milestone.image,
            });

            await this.props.getConversionRates(milestone.date, milestone.token.symbol);

            this.setState({
              isLoading: false,
            });
          } catch (err) {
            ErrorPopup(
              'Sadly we were unable to load the requested Milestone details. Please try again.',
              err,
            );
          }
        } else {
          // isNew
          try {
            const qs = queryString.parse(this.props.location.search);
            const campaign = await CampaignService.get(this.props.match.params.id);

            if (campaign.projectId < 0) {
              this.props.history.goBack();
              return;
            }

            const milestone = MilestoneFactory.create({
              maxAmount: '0',
              fiatAmount: '0',
              token: this.props.tokenWhitelist[0],
            });

            validQueryStringVariables.forEach(variable => {
              if (!qs[variable]) return;
              switch (variable) {
                case 'fiatAmount':
                case 'maxAmount': {
                  const number = new BigNumber(qs[variable]);
                  if (!number.isNaN()) milestone[variable] = number;
                  break;
                }
                case 'tokenAddress': {
                  const token = this.props.tokenWhitelist.find(t => t.address === qs[variable]);
                  if (token) milestone.token = token;
                  break;
                }
                case 'token': {
                  const token = this.props.tokenWhitelist.find(t => t.symbol === qs[variable]);
                  if (token) milestone.token = token;
                  break;
                }
                case 'date': {
                  const date = getStartOfDayUTC(qs[variable]);
                  if (date.isValid()) milestone.date = date;
                  break;
                }
                case 'isCapped':
                  milestone.maxAmount = qs[variable] === '1' ? new BigNumber(0) : undefined;
                  if (qs[variable] === '1') {
                    milestone.fiatAmount = new BigNumber(0);
                  }
                  break;
                case 'requireReviewer':
                  milestone.reviewerAddress = qs[variable] === '1' ? '' : ZERO_ADDRESS;
                  break;
                default:
                  milestone[variable] = qs[variable];
                  break;
              }
            });

            // milestone.recipientAddress = this.props.currentUser.address;
            milestone.selectedFiatType = milestone.token.symbol;

            const { rates } = await this.props.getConversionRates(
              milestone.date,
              milestone.token.symbol,
            );

            if (milestone.isCapped) {
              const rate = rates[milestone.selectedFiatType];
              if (rate && milestone.maxAmount && milestone.maxAmount.gt(0)) {
                milestone.fiatAmount = milestone.maxAmount.times(rate);
              } else if (rate && milestone.fiatAmount && milestone.fiatAmount.gt(0)) {
                milestone.maxAmount = milestone.fiatAmount.div(rate);
              } else {
                milestone.maxAmount = new BigNumber('0');
                milestone.fiatAmount = new BigNumber('0');
              }
            }

            const { maxAmount, fiatAmount, selectedFiatType } = milestone;
            this.setState(
              {
                campaignTitle: campaign.title,
                campaignProjectId: campaign.projectId,
                milestone,
                isLoading: false,
                selectedFiatType,
                fiatAmount,
                maxAmount,
              },
              () => {
                this.setDelegatePercent(true);
              },
            );

            this.setDate(this.state.milestone.date);
          } catch (e) {
            ErrorPopup(
              'Sadly we were unable to load the Campaign in which this Milestone was created. Please try again.',
              e,
            );

            this.setState({
              isLoading: false,
            });
          }
        }
      })

      .catch(err => {
        // TODO: This is not super user friendly, fix it
        if (err === 'noBalance') {
          ErrorPopup('Something went wrong.', err);
          this.props.history.goBack();
        } else if (err !== undefined && err.message !== 'wrongNetwork') {
          ErrorPopup('Something went wrong. Please try again.', err);
        }
      });
  }

  componentDidUpdate(prevProps) {
    const milestoneOwner = this.state.milestone.owner;
    const { currentUser } = this.props;
    if (prevProps.currentUser !== currentUser) {
      const milestoneOwnerAddress = this.state.milestone.owner.address;
      const campaignOwner = this.state.milestone.campaign.ownerAddress;
      if (!milestoneOwner || !campaignOwner || !currentUser) {
        history.goBack();
        return;
      }
      this.checkUser().then(() => {
        if (!isOwner(milestoneOwnerAddress, currentUser) || !isOwner(campaignOwner, currentUser))
          this.props.history.goBack();
      });
    } else if (currentUser && !prevProps.balance.eq(this.props.balance)) {
      checkBalance(this.props.balance);
    }
  }

  retrieveMilestone() {
    const { milestone } = this.state;
    return milestone;
  }

  onItemsChanged(items) {
    let milestoneObject = null;
    try {
      milestoneObject = this.retrieveMilestone();
    } catch (e) {
      const { milestone } = this.state;
      milestoneObject = milestone;
    }
    milestoneObject.items = items;

    this.setState({
      refreshList: milestoneObject.items,
      milestone: milestoneObject,
    });
  }

  setImage(image) {
    let milestoneObject = null;
    try {
      milestoneObject = this.retrieveMilestone();
    } catch (e) {
      const { milestone } = this.state;
      milestoneObject = milestone;
    }
    milestoneObject.image = image;
    this.setState({ image });
  }

  setDate(date) {
    const milestone = returnMilestone(this);
    milestone.date = date;
    this.props.getConversionRates(date, milestone.token.symbol).then(resp => {
      let rate =
        resp &&
        resp.rates &&
        (resp.rates[milestone.selectedFiatType] ||
          Object.values(resp.rates).find(v => v !== undefined));

      // This rate is undefined, use the milestone rate

      if (rate === undefined && milestone.token.symbol) {
        milestone.selectedFiatType = milestone.token.symbol;
        rate = 1;
      }

      if (milestone.isCapped) {
        milestone.maxAmount = milestone.fiatAmount.div(rate);
        if (resp) {
          milestone.conversionRateTimestamp = resp.timestamp;
        }
      }

      const { selectedFiatType, maxAmount } = milestone;
      this.setState({ selectedFiatType, maxAmount, milestone });
    });
  }

  setFiatAmount(name, value) {
    const milestone = returnMilestone(this);
    const maxAmount = new BigNumber(value || '0');
    const conversionRate = this.props.currentRate.rates[milestone.selectedFiatType];

    if (conversionRate && maxAmount.gte(0)) {
      clearTimeout(this.timer);

      milestone.maxAmount = maxAmount;
      milestone.fiatAmount = maxAmount.times(conversionRate);
      milestone.conversionRateTimestamp = this.props.currentRate.timestamp;

      this.timer = setTimeout(this.triggerChange, WAIT_INTERVAL);
    }
  }

  setMaxAmount(name, value) {
    const milestone = returnMilestone(this);
    const fiatAmount = new BigNumber(value || '0');
    const conversionRate = this.props.currentRate.rates[milestone.selectedFiatType];
    if (conversionRate && fiatAmount.gte(0)) {
      clearTimeout(this.timer);

      milestone.maxAmount = fiatAmount.div(conversionRate);
      milestone.fiatAmount = fiatAmount;
      milestone.conversionRateTimestamp = this.props.currentRate.timestamp;

      this.timer = setTimeout(this.triggerChange, WAIT_INTERVAL);
    }
  }

  changeSelectedFiat(fiatType) {
    const milestone = returnMilestone(this);
    const conversionRate = this.props.currentRate.rates[fiatType];
    milestone.maxAmount = milestone.fiatAmount.div(conversionRate);
    milestone.selectedFiatType = fiatType;

    const { selectedFiatType, maxAmount } = milestone;
    this.setState({ selectedFiatType, maxAmount, milestone });
  }

  async toggleFormValid(formState) {
    if (lastFormState === formState) return formState;
    if (this.state.loadTime + 5000 <= Date.now()) {
      if (this.state.milestone.itemizeState) {
        this.setState(prevState => ({
          formIsValid: formState && prevState.milestone.items.length > 0,
        }));
      } else {
        this.setState({ formIsValid: formState });
      }
    }
    return formState;
  }

  setToken(address) {
    if (address === ANY_TOKEN.address) return;
    this.getNewRates(address);
  }

  setDacId(dacId) {
    const milestone = returnMilestone(this);
    milestone.dacId = dacId;
    this.setState({ milestone });
  }

  async getNewRates(address) {
    if (!address) return;
    const milestone = returnMilestone(this);
    const token = this.props.tokenWhitelist.find(t => t.address === address);
    milestone.token = token;
    if (!milestone.items || milestone.items.length === 0) {
      this.updateMilestoneState(milestone);
      return;
    }
    const results = [];
    const ratesCollection = {};
    milestone.items.forEach(item => {
      results.push(
        this.getDateRate(item.date, token).then(rate => {
          ratesCollection[item.date] = rate;
        }),
      );
    });
    await Promise.all(results);
    milestone.items.forEach(item => {
      const rates = ratesCollection[item.date];
      if (rates) {
        if (rates[item.selectedFiatType] === undefined) {
          item.conversionRate = rates[token.symbol];
          item.wei = utils.toWei(
            new BigNumber(item.fiatAmount).div(item.conversionRate).toFixed(18),
          );
        } else {
          item.conversionRate = rates[item.selectedFiatType];
          item.wei = utils.toWei(
            new BigNumber(item.fiatAmount).div(item.conversionRate).toFixed(18),
          );
        }
      }
    });
    this.updateMilestoneState(milestone);
  }

  updateMilestoneState(milestone) {
    this.setState({ milestone }, () => {
      this.setDate(this.state.milestone.data || getStartOfDayUTC());
    });
  }

  async getDateRate(date, token) {
    const { rates } = await this.props.getConversionRates(date, token.symbol);
    return rates;
  }

  checkUser() {
    if (!this.props.currentUser) {
      this.props.history.push('/');
      return Promise.reject();
    }

    return authenticateIfPossible(this.props.currentUser, true)
      .then(async () => {
        if (!this.props.isProposed && !this.props.isCampaignManager(this.props.currentUser)) {
          historyBackWFallback();
          await sleep(2000);
          ErrorPopup('You are not whitelisted', null);
        }
      })
      .then(() => checkProfile(this.props.currentUser))
      .then(() => !this.props.isProposed && checkBalance(this.props.balance));
  }

  itemizeState(value) {
    const milestone = returnMilestone(this);
    milestone.itemizeState = value;

    this.setState({ itemizeState: value, milestone });
  }

  hasReviewer(value) {
    const milestone = returnMilestone(this);
    milestone.reviewerAddress = value ? '' : ZERO_ADDRESS;

    this.setState({ hasReviewer: value, milestone });
  }

  setDelegatePercent(value) {
    const { dacs } = this.state;
    const milestone = returnMilestone(this);
    const { defaultDacId } = config;
    const defaultValue =
      defaultDacId && dacs.some(d => d.value === String(defaultDacId)) ? defaultDacId : 0;
    const milestoneDacId =
      value && dacs.length > 0 ? defaultValue || parseInt(dacs[0].value, 10) : 0;
    milestone.dacId = milestoneDacId;
    this.setState({ delegatePercent: value, milestone });
  }

  isLPMilestone(value) {
    const { campaignProjectId, itemizeState } = this.state;
    const milestone = returnMilestone(this);
    let ms = null;
    if (!value) {
      ms = new BridgedMilestone(milestone.toFeathers());
      ms.itemizeState = itemizeState;
    } else {
      ms = new LPMilestone({
        ...milestone.toFeathers(),
        recipientId: campaignProjectId,
        recipientAddress: undefined,
      });
      ms.itemizeState = itemizeState;
    }

    if (!this.props.isNew) {
      ms._id = milestone.id;
    }

    this.setState({ isLPMilestone: value, milestone: ms });
  }

  acceptsSingleToken(value) {
    const milestone = returnMilestone(this);
    milestone.token = value ? this.props.tokenWhitelist[0] : ANY_TOKEN;
    if (!value) {
      // if ANY_TOKEN is allowed, then we can't have a cap
      milestone.maxAmount = undefined;
      milestone.itemizeState = false;
    }

    this.setState({
      acceptsSingleToken: value,
      maxAmount: milestone.maxAmount,
      milestone,
    });
  }

  isCapped(value) {
    const milestone = returnMilestone(this);
    milestone.maxAmount = value ? new BigNumber(0) : undefined;
    if (value) {
      milestone.fiatAmount = new BigNumber(0);
    }

    const { fiatAmount, maxAmount } = milestone;
    this.setState({ fiatAmount, maxAmount, milestone });
  }

  setMyAddressAsRecipient() {
    const milestone = returnMilestone(this);
    milestone.recipientAddress = this.props.currentUser.address;

    this.setState({ recipientAddress: milestone.recipientAddress, milestone });
  }

  triggerChange() {
    const milestone = returnMilestone(this);
    const { maxAmount, fiatAmount, recipientAddress } = milestone;
    this.setState({
      fiatAmount,
      maxAmount,
      recipientAddress: recipientAddress || '',
    });
  }

  setRecipientAddress(name, value) {
    clearTimeout(this.timer);
    const milestone = returnMilestone(this);
    milestone.recipientAddress = value;

    this.timer = setTimeout(this.triggerChange, WAIT_INTERVAL);
    this.setState({ milestone });
  }

  submit() {
    const { milestone } = this.state;

    milestone.ownerAddress = this.props.currentUser.address;
    milestone.campaignId = this.state.campaignId;
    milestone.status =
      this.props.isProposed || milestone.status === Milestone.REJECTED
        ? Milestone.PROPOSED
        : milestone.status; // make sure not to change status!
    if (milestone.isCapped) {
      milestone.conversionRate = this.props.currentRate.rates[milestone.selectedFiatType];
    }
    milestone.parentProjectId = this.state.campaignProjectId;

    const _saveMilestone = () =>
      MilestoneService.save({
        milestone,
        from: this.props.currentUser.address,
        afterSave: (created, txUrl, res) => {
          if (created) {
            if (this.props.isProposed) {
              const url = res ? `/campaigns/${res.campaign._id}/milestones/${res._id}` : undefined;
              React.toast.info(
                <Fragment>
                  <p>Your Milestone has been proposed to the Campaign Owner.</p>
                  {url && <Link to={url}>View milestone</Link>}
                </Fragment>,
              );
            }
          } else if (txUrl) {
            React.toast.info(
              <p>
                Your Milestone is pending....
                <br />
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  View transaction
                </a>
              </p>,
            );
          } else {
            React.toast.success(
              <p>
                Your Milestone has been updated!
                <br />
              </p>,
            );
            GA.trackEvent({
              category: 'Milestone',
              action: 'updated',
              label: this.state.id,
            });
          }

          this.setState({
            isSaving: false,
          });
          this.props.history.goBack();
        },
        afterMined: (created, txUrl) => {
          React.toast.success(
            <p>
              Your Milestone has been created!
              <br />
              <a href={txUrl} target="_blank" rel="noopener noreferrer">
                View transaction
              </a>
            </p>,
          );
        },
        onError: errorMessage => {
          React.toast.error(errorMessage);

          this.setState({ isSaving: false });
        },
      });

    this.setState(
      {
        isSaving: true,
      },
      () => {
        if (this.props.isProposed && this.props.isNew) {
          React.swal({
            title: 'Propose Milestone?',
            text:
              'The Milestone will be proposed to the Campaign owner and he or she might approve or reject your milestone.',
            icon: 'warning',
            dangerMode: true,
            buttons: ['Cancel', 'Yes, propose'],
          }).then(isConfirmed => {
            if (isConfirmed) _saveMilestone();
            else this.setState({ isSaving: false });
          });
        } else {
          _saveMilestone();
        }
      },
    );
  }

  removeItem(index) {
    const { milestone } = this.state;
    delete milestone.items[index];
    milestone.items = milestone.items.filter(() => true);

    this.setState({ milestone });
  }

  btnText() {
    if (this.props.isNew) {
      return this.props.isProposed ? 'Propose Milestone' : 'Create Milestone';
    }
    return 'Update Milestone';
  }

  addItem(item) {
    let milestoneObject = null;
    try {
      milestoneObject = this.retrieveMilestone();
    } catch (e) {
      const { milestone } = this.state;
      milestoneObject = milestone;
    }
    let tokenSymbol = null;
    if (!milestoneObject.token.symbol) {
      tokenSymbol = 'ETH';
    } else {
      const { symbol } = milestoneObject.token;
      tokenSymbol = symbol;
    }
    this.getDateRate(item.date, tokenSymbol).then(rate => {
      if (!rate) return;
      if (rate[item.selectedFiatType] === undefined) {
        item.conversionRate = rate.EUR;
        item.selectedFiatType = 'EUR';
        item.wei = utils.toWei(new BigNumber(item.fiatAmount).div(item.conversionRate).toFixed(18));
      } else {
        item.conversionRate = rate[item.selectedFiatType];
        item.wei = utils.toWei(new BigNumber(item.fiatAmount).div(item.conversionRate).toFixed(18));
      }
      milestoneObject.items = milestoneObject.items.concat(item);

      this.setState({
        milestone: milestoneObject,
        refreshList: milestoneObject.items,
      });
    });
  }

  handleTemplateChange(option) {
    const milestone = this.retrieveMilestone();
    milestone.description = templates.templates[option];
    this.setState({ milestone, template: option });
  }

  validateMilestoneDesc(value) {
    if (this.state.template === 'Reward DAO') {
      return (
        value.includes('Intro') &&
        value.includes('Description') &&
        value.includes('Proof') &&
        value.includes('Video') &&
        value.includes('Reward')
      );
    }
    if (this.state.template === 'Regular Reward') {
      return (
        value.includes('Intro') &&
        value.includes('Description') &&
        value.includes('Video') &&
        value.includes('Amount')
      );
    }
    if (this.state.template === 'Expenses') {
      return value.includes('Expenses') && value.includes('Description');
    }
    if (this.state.template === 'Bounties') {
      return (
        value.includes('Intro') &&
        value.includes('What') &&
        value.includes('Why') &&
        value.includes('Deadline') &&
        value.includes('Link to Bounty')
      );
    }
    return value.length > 10;
  }

  render() {
    const {
      isNew,
      isProposed,
      currentRate,
      fiatTypes,
      reviewers,
      conversionRateLoading,
    } = this.props;
    const {
      dacs,
      isLoading,
      isSaving,
      refreshList,
      formIsValid,
      campaignTitle,
      tokenWhitelistOptions,
      milestone,
      hasReviewer,
      delegatePercent,
      isLPMilestone,
      acceptsSingleToken,
      itemizeState,
      selectedFiatType,
      fiatAmount,
      maxAmount,
      recipientAddress,
      image,
    } = this.state;

    return (
      <div id="edit-milestone-view">
        <div className="container-fluid page-layout edit-view">
          <div>
            <div className="col-md-8 m-auto">
              {isLoading && <Loader className="fixed" />}

              {!isLoading && (
                <div>
                  <GoBackButton
                    history={history}
                    title={isNew ? 'Back' : `Milestone: ${milestone.title}`}
                  />

                  <div className="form-header">
                    {isNew && !isProposed && <h3>Add a new Milestone</h3>}

                    {!isNew && !isProposed && <h3>Edit Milestone {milestone.title}</h3>}

                    {isNew && isProposed && <h3>Propose a Milestone</h3>}

                    <h6>
                      Campaign: <strong>{getTruncatedText(campaignTitle, 100)}</strong>
                    </h6>

                    <p>
                      <i className="fa fa-question-circle" />A Milestone is a single accomplishment
                      within a project. In the end, all donations end up in Milestones. Once your
                      Milestone is completed, you can request a payout.
                    </p>

                    {isProposed && (
                      <p>
                        <i className="fa fa-exclamation-triangle" />
                        You are proposing a Milestone to the Campaign Owner. The Campaign Owner can
                        accept or reject your Milestone
                      </p>
                    )}
                  </div>

                  <Form
                    id="edit-milestone-form"
                    onSubmit={this.submit}
                    ref={this.form}
                    mapping={inputs => {
                      milestone.title = inputs.title;
                      milestone.description = inputs.description;
                      milestone.reviewerAddress = inputs.reviewerAddress || ZERO_ADDRESS;
                      milestone.dacId = parseInt(inputs.dacId, 10) || 0;
                      milestone.recipientAddress = inputs.recipientAddress || ZERO_ADDRESS;
                    }}
                    onValid={() => {
                      this.toggleFormValid(true);
                    }}
                    onInvalid={() => this.toggleFormValid(false)}
                    layout="vertical"
                  >
                    <Input
                      name="title"
                      label="What are you going to accomplish in this Milestone?"
                      id="title-input"
                      type="text"
                      value={milestone.title}
                      placeholder="E.g. buying goods"
                      help="Describe your Milestone in 1 sentence."
                      validations="minLength:3"
                      validationErrors={{
                        minLength: 'Please provide at least 3 characters.',
                      }}
                      required
                      autoFocus
                    />
                    <div className="form-group">
                      <QuillFormsy
                        name="description"
                        templatesDropdown
                        label="Explain how you are going to do this successfully."
                        helpText="Make it as extensive as necessary. Your goal is to build trust,
                        so that people donate Ether to your Campaign. Don't hesitate to add a detailed budget for this Milestone"
                        value={milestone.description}
                        placeholder="Describe how you're going to execute your Milestone successfully
                        ..."
                        onTextChanged={content => this.constructSummary(content)}
                        validations={{
                          templateValidator: function(values, value) {
                            return this.validateMilestoneDesc(value);
                          }.bind(this),
                        }}
                        help="Describe your Milestone."
                        handleTemplateChange={this.handleTemplateChange}
                        validationErrors={{
                          templateValidator:
                            'Please provide at least 10 characters and do not edit the template keywords.',
                        }}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <FormsyImageUploader
                        setImage={this.setImage}
                        previewImage={image}
                        required={isNew}
                      />
                    </div>

                    {dacs.length > 0 && (
                      <div className="form-group">
                        <div className="form-group react-toggle-container">
                          <Toggle
                            id="itemize-state"
                            checked={delegatePercent}
                            onChange={e => this.setDelegatePercent(e.target.checked)}
                            disabled={!isNew && !isProposed}
                          />
                          <span className="label">Donate 3% to a DAC</span>
                          {!delegatePercent && (
                            <span className="help-block">
                              Supporting a DAC is optional, this will help a lot the growth of
                              amazing projects.
                            </span>
                          )}
                        </div>
                        {delegatePercent && (
                          <SelectFormsy
                            name="dacId"
                            id="dac-select"
                            label="DAC to donate to"
                            helpText="Funds will be delegated each time someone donates"
                            value={milestone.dacId}
                            options={dacs}
                            validations="isNumber"
                            validationErrors={{
                              isNumber: 'Please select a delegate.',
                            }}
                            required
                            disabled={!isNew && !isProposed}
                          />
                        )}
                      </div>
                    )}

                    <div className="form-group">
                      <div className="form-group react-toggle-container">
                        <Toggle
                          id="itemize-state"
                          checked={!hasReviewer}
                          onChange={e => this.hasReviewer(!e.target.checked)}
                          disabled={!isNew && !isProposed}
                        />
                        <span className="label">Disable Milestone Reviewer</span>
                        {!hasReviewer && (
                          <span className="help-block">
                            Choosing not to use a reviewer on your Milestone will allow you to
                            withdraw donations at anytime. The downside is that you are no longer
                            held accountable for completing the Milestone before funds can be
                            withdrawn and thus less likely to receive donations.
                          </span>
                        )}
                      </div>
                      {hasReviewer && (
                        <SelectFormsy
                          name="reviewerAddress"
                          id="reviewer-select"
                          label="Select a reviewer"
                          helpText="The reviewer verifies that the Milestone is completed successfully, thus building trust in your Milestone"
                          value={milestone.reviewerAddress}
                          cta="--- Select a reviewer ---"
                          options={reviewers}
                          validations="isEtherAddress"
                          validationErrors={{
                            isEtherAddress: 'Please select a reviewer.',
                          }}
                          required
                          disabled={!isNew && !isProposed}
                        />
                      )}
                    </div>
                    <div className="label">Where will the money go after completion?</div>
                    <div className="form-group recipient-address-container">
                      <div className="react-toggle-container">
                        <Toggle
                          id="itemize-state"
                          checked={isLPMilestone}
                          onChange={e => this.isLPMilestone(e.target.checked)}
                          disabled={!isNew && !isProposed}
                        />
                        <span className="label">Raise funds for Campaign: {campaignTitle} </span>
                      </div>
                      {!isLPMilestone && (
                        <Fragment>
                          <Input
                            name="recipientAddress"
                            id="title-input"
                            type="text"
                            value={recipientAddress}
                            onChange={this.setRecipientAddress}
                            placeholder={ZERO_ADDRESS}
                            help="Enter an Ethereum address. If left blank, you will be required to set the recipient address before you can withdraw from this Milestone"
                            validations="isEtherAddress"
                            validationErrors={{
                              isEtherAddress: 'Please insert a valid Ethereum address.',
                            }}
                            disabled={!isNew && !isProposed}
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-link btn-setter"
                            onClick={() => this.setMyAddressAsRecipient()}
                          >
                            Use My Address
                          </button>
                        </Fragment>
                      )}
                    </div>

                    <div className="form-group react-toggle-container">
                      <Toggle
                        id="itemize-state"
                        checked={!acceptsSingleToken}
                        onChange={e => this.acceptsSingleToken(!e.target.checked)}
                        disabled={!isNew && !isProposed}
                      />
                      <span className="label">Accept donations in all tokens</span>
                    </div>
                    {acceptsSingleToken && (
                      <SelectFormsy
                        name="token"
                        id="token-select"
                        label="Raising funds in"
                        helpText="Select the token you're raising funds in"
                        value={milestone.token && milestone.token.address}
                        options={tokenWhitelistOptions}
                        onChange={address => this.setToken(address)}
                        required
                        disabled={!isNew && !isProposed}
                      />
                    )}

                    <div className="react-toggle-container">
                      <Toggle
                        id="itemize-state"
                        checked={!milestone.isCapped}
                        onChange={e => this.isCapped(!e.target.checked)}
                        disabled={(!isNew && !isProposed) || !acceptsSingleToken}
                      />
                      <span className="label">Disable Milestone fundraising cap</span>
                      {!milestone.isCapped && (
                        <span className="help-block">
                          {acceptsSingleToken
                            ? 'It is recommended that you set a fundraising cap for your Milestone.'
                            : 'In order to set a fundraising cap, you must only accept donations in a single token'}
                        </span>
                      )}
                    </div>
                    {milestone.isCapped && (
                      <Fragment>
                        <div className="react-toggle-container">
                          <Toggle
                            id="itemize-state"
                            checked={itemizeState}
                            onChange={e => this.itemizeState(e.target.checked)}
                            disabled={!isNew && !isProposed}
                          />
                          <span className="label">Add multiple expenses, invoices or items</span>
                        </div>

                        {!itemizeState ? (
                          <div className="card milestone-items-card">
                            <div className="card-body">
                              {conversionRateLoading && <Loader />}

                              <div className="form-group row">
                                <div className="col-12">
                                  <DatePickerFormsy
                                    name="date"
                                    type="text"
                                    value={milestone.date}
                                    startDate={milestone.date}
                                    label="Milestone date"
                                    changeDate={dt => this.setDate(dt)}
                                    placeholder="Select a date"
                                    help="Select a date"
                                    validations="isMoment"
                                    validationErrors={{
                                      isMoment: 'Please provide a date.',
                                    }}
                                    required={!itemizeState}
                                    disabled={!isNew && !isProposed}
                                  />
                                </div>
                              </div>

                              <div className="form-group row">
                                <div className="col-5">
                                  <Input
                                    name="fiatAmount"
                                    min="0"
                                    id="fiatamount-input"
                                    type="number"
                                    step="any"
                                    label={`Maximum amount in ${selectedFiatType}`}
                                    value={fiatAmount.toFixed()}
                                    placeholder="10"
                                    validations="greaterThan:0"
                                    validationErrors={{
                                      greaterEqualTo: 'Minimum value must be greater than 0',
                                    }}
                                    disabled={!isNew && !isProposed}
                                    onChange={this.setMaxAmount}
                                  />
                                </div>

                                <div className="col-2">
                                  <SelectFormsy
                                    name="fiatType"
                                    label="Currency"
                                    value={selectedFiatType}
                                    options={fiatTypes}
                                    allowedOptions={currentRate.rates}
                                    onChange={this.changeSelectedFiat}
                                    helpText={returnHelpText(
                                      conversionRateLoading,
                                      milestone,
                                      currentRate,
                                    )}
                                    disabled={!isNew && !isProposed}
                                    required
                                  />
                                </div>

                                <div className="col-5">
                                  <Input
                                    name="maxAmount"
                                    min="0"
                                    id="maxamount-input"
                                    type="number"
                                    step="any"
                                    label={`Maximum amount in ${milestone.token.name}`}
                                    value={maxAmount.toFixed()}
                                    placeholder="10"
                                    validations="greaterThan:0"
                                    validationErrors={{
                                      greaterEqualTo: 'Minimum value must be greater than 0',
                                    }}
                                    required
                                    disabled={!isNew && !isProposed}
                                    onChange={this.setFiatAmount}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <MilestoneProof
                            isEditMode
                            onItemsChanged={returnedItems => this.onItemsChanged(returnedItems)}
                            token={milestone.token}
                            milestoneStatus={milestone.status}
                            refreshList={refreshList}
                          />
                        )}
                      </Fragment>
                    )}

                    <div className="form-group row">
                      <div className="col-4">
                        <GoBackButton
                          history={history}
                          title={isNew ? 'Back' : `Milestone: ${milestone.title}`}
                        />
                      </div>
                      <div className="col-4" />
                      <div className="col-4">
                        <LoaderButton
                          className="btn btn-success pull-right"
                          formNoValidate
                          type="submit"
                          disabled={conversionRateLoading || isSaving || !formIsValid}
                          isLoading={isSaving}
                          network="Foreign"
                          loadingText="Saving..."
                        >
                          <span>{this.btnText()}</span>
                        </LoaderButton>
                      </div>
                    </div>
                  </Form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

EditMilestone.propTypes = {
  currentUser: PropTypes.instanceOf(User),
  location: PropTypes.shape().isRequired,
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  }).isRequired,
  isProposed: PropTypes.bool,
  isNew: PropTypes.bool,
  balance: PropTypes.instanceOf(BigNumber).isRequired,
  isForeignNetwork: PropTypes.bool.isRequired,
  displayForeignNetRequiredWarning: PropTypes.func.isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
      milestoneId: PropTypes.string,
    }).isRequired,
  }).isRequired,
  getConversionRates: PropTypes.func.isRequired,
  currentRate: PropTypes.shape({
    rates: PropTypes.shape().isRequired,
    timestamp: PropTypes.string.isRequired,
  }),
  conversionRateLoading: PropTypes.bool.isRequired,
  fiatTypes: PropTypes.arrayOf(PropTypes.object).isRequired,
  isCampaignManager: PropTypes.func.isRequired,
  reviewers: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  tokenWhitelist: PropTypes.arrayOf(PropTypes.shape()).isRequired,
};

EditMilestone.defaultProps = {
  currentUser: undefined,
  isNew: false,
  isProposed: false,
  currentRate: undefined,
};

export default getConversionRatesContext(props => (
  <WhiteListConsumer>
    {({
      state: { activeTokenWhitelist, reviewers, isLoading },
      actions: { isCampaignManager },
    }) => (
      <div>
        {isLoading && <Loader className="fixed" />}
        {!isLoading && (
          <EditMilestone
            tokenWhitelist={activeTokenWhitelist}
            reviewers={reviewers}
            isCampaignManager={isCampaignManager}
            {...props}
          />
        )}
      </div>
    )}
  </WhiteListConsumer>
));
