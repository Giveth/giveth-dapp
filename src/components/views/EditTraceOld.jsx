/* eslint-disable class-methods-use-this */
/* eslint-disable react/sort-comp */
import React, { Component, Fragment } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import Toggle from 'react-toggle';
import BigNumber from 'bignumber.js';
import { Form, Input } from 'formsy-react-components';
import GA from 'lib/GoogleAnalytics';
import queryString from 'query-string';
import Trace from 'models/Trace';
import TraceFactory from 'models/TraceFactory';
import { utils } from 'web3';
import { notification } from 'antd';

import Loader from '../Loader';
import QuillFormsy from '../QuillFormsy';
import SelectFormsy from '../SelectFormsy';
import DatePickerFormsy from '../DatePickerFormsy';
import FormsyImageUploader from '../FormsyImageUploader';
import GoBackButton from '../GoBackButton';
import {
  ANY_TOKEN,
  getHtmlText,
  getStartOfDayUTC,
  getTruncatedText,
  history,
  isOwner,
  ZERO_ADDRESS,
} from '../../lib/helpers';
import {
  authenticateUser,
  checkBalance,
  checkForeignNetwork,
  checkProfile,
  historyBackWFallback,
  sleep,
} from '../../lib/middleware';
import LoaderButton from '../LoaderButton';
import User from '../../models/User';
import templates from '../../lib/traceTemplates';
import config from '../../configuration';

import ErrorPopup from '../ErrorPopup';
import TraceProof from '../TraceProof';

import { Consumer as UserConsumer } from '../../contextProviders/UserProvider';
import { Consumer as WhiteListConsumer } from '../../contextProviders/WhiteListProvider';
import getConversionRatesContext from '../../containers/getConversionRatesContext';
import TraceService from '../../services/TraceService';
import CampaignService from '../../services/CampaignService';
import CommunityService from '../../services/CommunityService';
import LPTrace from '../../models/LPTrace';
import BridgedTrace from '../../models/BridgedTrace';
import DescriptionRender from '../DescriptionRender';
import ErrorHandler from '../../lib/ErrorHandler';

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

const lastFormState = undefined;

function returnHelpText(conversionRateLoading, trace, currentRate) {
  if (!conversionRateLoading) {
    return `1 ${trace.token.symbol} = ${currentRate.rates[trace.selectedFiatType]} ${
      trace.selectedFiatType
    }`;
  }
  return ``;
}

/**
 * Create or edit a Trace
 *
 *  @props
 *    isNew (bool):
 *      If set, component will load an empty model.
 *      If not set, component expects an id param and will load a trace object from backend
 *
 *  @params
 *    id (string): an id of a trace object
 */

class EditTraceOld extends Component {
  constructor(props) {
    super(props);

    const { defaultCommunityId } = config;

    this.state = {
      isLoading: true,
      refreshList: [],
      communities: [],
      isSaving: false,
      formIsValid: false,
      loadTime: Date.now(),
      trace: TraceFactory.create({
        maxAmount: '0',
        fiatAmount: '0',
        communityId: defaultCommunityId,
      }),
      tokenWhitelistOptions: props.tokenWhitelist.map(t => ({
        value: t.address,
        title: t.name,
      })),
      hasReviewer: true,
      delegatePercent: true,
      isLPTrace: false,
      acceptsSingleToken: true,
      itemizeState: false,
      selectedFiatType: 'EUR',
      fiatAmount: BigNumber('0'),
      maxAmount: BigNumber('0'),
      isCapped: true,
      recipientAddress: '',
    };

    this.form = React.createRef();

    this.submit = this.submit.bind(this);
    this.setImage = this.setImage.bind(this);
    this.saveFormInStorage = this.saveFormInStorage.bind(this);
    this.setMaxAmount = this.setMaxAmount.bind(this);
    this.setFiatAmount = this.setFiatAmount.bind(this);
    this.setRecipientAddress = this.setRecipientAddress.bind(this);
    this.triggerChange = this.triggerChange.bind(this);
    this.changeSelectedFiat = this.changeSelectedFiat.bind(this);
    this.onItemsChanged = this.onItemsChanged.bind(this);
    this.handleTemplateChange = this.handleTemplateChange.bind(this);
    this.validateTraceDesc = this.validateTraceDesc.bind(this);
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

        await CommunityService.getCommunities(
          undefined, // Limit
          0, // Skip
          false,
          (communities, _) => {
            const formatCommunities = communities.map(r => ({
              value: r.myDelegateId.toString(),
              title: `${r.myDelegateId ? r.myDelegateId : '?'} - ${r._title}`,
            }));

            this.setState(
              prevState => {
                let { delegatePercent } = prevState;
                if (communities.length === 0) {
                  delegatePercent = false;
                }
                return {
                  communities: prevState.communities.concat(formatCommunities),
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

        // load a single trace (when editing)
        if (!this.props.isNew) {
          try {
            const trace = await TraceService.get(this.props.match.params.traceId);
            if (
              trace.formType ||
              !(
                isOwner(trace.owner.address, this.props.currentUser) ||
                isOwner(trace.campaign.ownerAddress, this.props.currentUser)
              ) ||
              trace.donationCounters.length > 0
            ) {
              return history.goBack();
            }

            this.setState({
              trace,
              campaignTitle: trace.campaign.title,
              campaignProjectId: trace.campaign.projectId,
              campaignId: trace.campaignId,
              refreshList: trace.items,
              hasReviewer: trace.reviewerAddress !== '' && trace.reviewerAddress !== ZERO_ADDRESS,
              delegatePercent: trace.communityId !== 0,
              isLPTrace: trace instanceof LPTrace,
              acceptsSingleToken: trace.token.symbol !== ANY_TOKEN.symbol,
              isCapped: trace.isCapped,
              itemizeState: trace.itemizeState,
              selectedFiatType: trace.selectedFiatType,
              fiatAmount: trace.fiatAmount,
              maxAmount: trace.maxAmount,
              recipientAddress: trace.recipientAddress,
              image: trace.image,
              formIsValid: true,
            });
            await this.props.getConversionRates(trace.date, trace.token.symbol, trace.token.symbol);

            this.setState({
              isLoading: false,
            });
          } catch (err) {
            const message = `Sadly we were unable to load the requested Trace details. Please try again.`;
            ErrorHandler(err, message);
          }
        } else {
          // isNew
          try {
            const qs = queryString.parse(this.props.location.search);
            const campaign = await CampaignService.get(this.props.match.params.id);

            if (campaign.projectId < 0) {
              return this.props.history.goBack();
            }

            const trace = TraceFactory.create({
              maxAmount: '0',
              fiatAmount: '0',
              token: this.props.tokenWhitelist[0] || {},
            });

            const traceForm = sessionStorage.getItem('trace-form');
            if (traceForm) {
              const {
                title,
                description,
                recipientAddress,
                reviewerAddress,
                communityId,
              } = JSON.parse(traceForm);
              if (title) trace.title = title;
              if (description) trace.description = description;
              if (recipientAddress) trace.recipientAddress = recipientAddress;
              if (reviewerAddress) trace.reviewerAddress = reviewerAddress;
              // eslint-disable-next-line radix
              if (communityId) trace.communityId = parseInt(communityId);
            }

            validQueryStringVariables.forEach(variable => {
              if (!qs[variable]) return;
              switch (variable) {
                case 'fiatAmount':
                case 'maxAmount': {
                  const number = new BigNumber(qs[variable]);
                  if (!number.isNaN()) trace[variable] = number;
                  break;
                }
                case 'tokenAddress': {
                  const token = this.props.tokenWhitelist.find(t => t.address === qs[variable]);
                  if (token) trace.token = token;
                  break;
                }
                case 'token': {
                  const token = this.props.tokenWhitelist.find(t => t.symbol === qs[variable]);
                  if (token) trace.token = token;
                  break;
                }
                case 'date': {
                  const date = getStartOfDayUTC(qs[variable]);
                  if (date.isValid()) trace.date = date;
                  break;
                }
                case 'isCapped':
                  trace.maxAmount = qs[variable] === '1' ? new BigNumber(0) : undefined;
                  if (qs[variable] === '1') {
                    trace.fiatAmount = new BigNumber(0);
                  }
                  break;
                case 'requireReviewer':
                  trace.reviewerAddress = qs[variable] === '1' ? '' : ZERO_ADDRESS;
                  break;
                default:
                  trace[variable] = qs[variable];
                  break;
              }
            });

            // trace.recipientAddress = this.props.currentUser.address;
            trace.selectedFiatType = trace.token.symbol;
            const { rates } = await this.props.getConversionRates(
              trace.date,
              trace.token.symbol,
              trace.token.symbol,
            );

            if (trace.isCapped) {
              const rate = rates[trace.selectedFiatType];
              if (rate && trace.maxAmount && trace.maxAmount.gt(0)) {
                trace.fiatAmount = trace.maxAmount.times(rate);
              } else if (rate && trace.fiatAmount && trace.fiatAmount.gt(0)) {
                trace.maxAmount = trace.fiatAmount.div(rate);
              } else {
                trace.maxAmount = new BigNumber('0');
                trace.fiatAmount = new BigNumber('0');
              }
            }

            const { maxAmount, fiatAmount, selectedFiatType } = trace;
            this.setState(
              {
                campaignTitle: campaign.title,
                campaignProjectId: campaign.projectId,
                trace,
                isLoading: false,
                selectedFiatType,
                fiatAmount,
                maxAmount,
              },
              () => {
                this.setDelegatePercent(true);
              },
            );

            this.setDate(this.state.trace.date);
          } catch (e) {
            console.log('e:', e);

            this.props.history.push('/notfound');
          }
        }

        return null;
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
    const { currentUser, isForeignNetwork } = this.props;
    if (!prevProps.isForeignNetwork && isForeignNetwork) {
      this.initComponent();
    }
    if (prevProps.currentUser !== currentUser) {
      const { trace } = this.state;
      const { owner, campaign } = trace;
      const traceOwnerAddress = owner && owner.address;
      const campaignOwner = campaign && campaign.ownerAddress;
      if (!owner || !campaignOwner || !currentUser) {
        return;
      }
      this.checkUser().then(() => {
        if (!isOwner(traceOwnerAddress, currentUser) || !isOwner(campaignOwner, currentUser))
          this.props.history.goBack();
      });
    } else if (currentUser.address && !prevProps.balance.eq(this.props.balance)) {
      checkBalance(this.props.balance);
    }
  }

  onItemsChanged(items) {
    this.setState(prevState => {
      const { trace } = prevState;
      trace.items = items;
      return {
        refreshList: trace.items,
      };
    });
  }

  setImage(image) {
    this.setState(prevState => {
      const { trace } = prevState;
      trace.image = image;
      return { image };
    });
  }

  setDate(date) {
    const { trace } = this.state;
    trace.date = date;
    const { isCapped, token = ANY_TOKEN } = trace;

    if (token.symbol !== ANY_TOKEN.symbol && isCapped) {
      this.props.getConversionRates(date, trace.token.symbol, trace.selectedFiatType).then(resp => {
        let rate =
          resp &&
          resp.rates &&
          (resp.rates[trace.selectedFiatType] ||
            Object.values(resp.rates).find(v => v !== undefined));

        // This rate is undefined, use the trace rate

        if (rate === undefined && trace.token.symbol) {
          trace.selectedFiatType = trace.token.symbol;
          rate = 1;
        }

        if (trace.isCapped) {
          trace.maxAmount = trace.fiatAmount.div(rate);
          if (resp) {
            trace.conversionRateTimestamp = resp.timestamp;
          }
        }

        const { selectedFiatType, maxAmount } = trace;
        this.setState({ selectedFiatType, maxAmount, trace });
      });
    }
  }

  setFiatAmount(name, value) {
    const { trace } = this.state;
    const maxAmount = new BigNumber(value || '0');
    const conversionRate = this.props.currentRate.rates[trace.selectedFiatType];

    if (conversionRate && maxAmount.gte(0)) {
      clearTimeout(this.timer);

      trace.maxAmount = maxAmount;
      trace.fiatAmount = maxAmount.times(conversionRate);
      trace.conversionRateTimestamp = this.props.currentRate.timestamp;

      this.timer = setTimeout(this.triggerChange, WAIT_INTERVAL);
    }
  }

  setMaxAmount(name, value) {
    const { trace } = this.state;
    const fiatAmount = new BigNumber(value || '0');
    const conversionRate = this.props.currentRate.rates[trace.selectedFiatType];
    if (conversionRate && fiatAmount.gte(0)) {
      clearTimeout(this.timer);

      trace.maxAmount = fiatAmount.div(conversionRate);
      trace.fiatAmount = fiatAmount;
      trace.conversionRateTimestamp = this.props.currentRate.timestamp;

      this.timer = setTimeout(this.triggerChange, WAIT_INTERVAL);
    }
  }

  async changeSelectedFiat(fiatType) {
    await this.getDateRate(this.state.trace.date, this.state.trace.token, fiatType);
    this.setState(prevState => {
      const { trace } = prevState;
      const conversionRate = this.props.currentRate.rates[fiatType];
      trace.maxAmount = trace.fiatAmount.div(conversionRate);
      trace.selectedFiatType = fiatType;

      const { selectedFiatType, maxAmount } = trace;
      return { selectedFiatType, maxAmount, trace };
    });
  }

  async toggleFormValid(formState) {
    if (lastFormState === formState) return formState;
    if (this.state.loadTime + 5000 <= Date.now()) {
      if (this.state.trace.itemizeState) {
        this.setState(prevState => ({
          formIsValid: formState && prevState.trace.items.length > 0,
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

  getFiatTypeBasedOnToken() {
    if (this.state.trace.token.rateEqSymbol !== undefined) {
      return this.state.trace.token.rateEqSymbol;
    }
    return this.state.trace.token.symbol;
  }

  async getNewRates(address) {
    if (!address) return;
    const { trace } = this.state;
    const token = this.props.tokenWhitelist.find(t => t.address === address);
    trace.token = token;
    trace.selectedFiatType = this.getFiatTypeBasedOnToken();
    if (!trace.items || trace.items.length === 0) {
      this.updateTraceState(trace);
      return;
    }
    const results = [];
    const ratesCollection = {};
    trace.items.forEach(item => {
      results.push(
        this.getDateRate(item.date, token, item.selectedFiatType).then(rate => {
          ratesCollection[item.date] = rate;
        }),
      );
    });
    await Promise.all(results);
    trace.items.forEach(item => {
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
    this.updateTraceState(trace);
  }

  // Update trace conversion rate and date
  updateTraceState(trace) {
    this.setState({ trace }, () => {
      this.setDate(this.state.trace.data || getStartOfDayUTC());
    });
  }

  async getDateRate(date, token, toRate) {
    const { rates } = await this.props.getConversionRates(date, token.symbol, toRate);
    return rates;
  }

  checkUser() {
    if (!this.props.currentUser) {
      this.props.history.push('/');
      return Promise.reject();
    }

    return authenticateUser(this.props.currentUser, true)
      .then(async () => {
        if (!this.props.isProposed && !this.props.currentUser) {
          historyBackWFallback();
          await sleep(2000);
          ErrorPopup('You are not whitelisted', null);
        }
      })
      .then(() => checkProfile(this.props.currentUser))
      .then(() => !this.props.isProposed && checkBalance(this.props.balance));
  }

  itemizeState(value) {
    this.setState(prevState => {
      const { trace } = prevState;
      trace.itemizeState = value;

      return { itemizeState: value, trace };
    });
  }

  hasReviewer(value) {
    this.setState(prevState => {
      const { trace } = prevState;
      trace.reviewerAddress = value ? '' : ZERO_ADDRESS;
      return { hasReviewer: value };
    });
  }

  setDelegatePercent(value) {
    this.setState(prevState => {
      const { communities, trace } = prevState;
      const { defaultCommunityId } = config;
      const defaultValue =
        defaultCommunityId && communities.some(d => d.value === String(defaultCommunityId))
          ? defaultCommunityId
          : 0;
      const traceCommunityId =
        value && communities.length > 0 ? defaultValue || parseInt(communities[0].value, 10) : 0;
      trace.communityId = traceCommunityId;
      return { delegatePercent: value, trace };
    });
  }

  isLPTrace(value) {
    this.setState(prevState => {
      const { trace, campaignProjectId, itemizeState } = prevState;
      let ms = null;
      if (!value) {
        ms = new BridgedTrace(trace.toFeathers());
        ms.itemizeState = itemizeState;
      } else {
        ms = new LPTrace({
          ...trace.toFeathers(),
          recipientId: campaignProjectId,
          recipientAddress: undefined,
        });
        ms.itemizeState = itemizeState;
      }

      if (!this.props.isNew) {
        ms._id = trace.id;
      }

      return { isLPTrace: value, trace: ms };
    });
  }

  acceptsSingleToken(value) {
    this.setState(prevState => {
      const { trace } = prevState;
      trace.token = value ? this.props.tokenWhitelist[0] : ANY_TOKEN;
      if (!value) {
        // if ANY_TOKEN is allowed, then we can't have a cap
        trace.maxAmount = undefined;
        trace.itemizeState = false;
      }

      this.updateTraceState(trace);

      return {
        acceptsSingleToken: value,
        maxAmount: trace.maxAmount,
        isCapped: value ? prevState.isCapped : false,
      };
    });
  }

  isCapped(value) {
    this.setState(prevState => {
      const { trace } = prevState;
      trace.maxAmount = value ? new BigNumber(0) : undefined;
      if (value) {
        trace.fiatAmount = new BigNumber(0);
      }

      this.updateTraceState(trace);

      const { fiatAmount, maxAmount } = trace;
      return { fiatAmount, maxAmount, isCapped: value };
    });
  }

  setMyAddressAsRecipient() {
    this.setState(prevState => {
      const { trace } = prevState;
      const { currentUser } = this.props;
      trace.recipientAddress = currentUser.address;

      return { recipientAddress: trace.recipientAddress, trace };
    });
  }

  triggerChange() {
    this.setState(prevState => {
      const { trace } = prevState;
      const { maxAmount, fiatAmount, recipientAddress } = trace;
      return {
        fiatAmount,
        maxAmount,
        recipientAddress: recipientAddress || '',
      };
    });
  }

  setRecipientAddress(name, value) {
    clearTimeout(this.timer);
    const { trace } = this.state;
    trace.recipientAddress = value;
    this.timer = setTimeout(this.triggerChange, WAIT_INTERVAL);
  }

  async submit() {
    const { currentUser, currentRate, isProposed, isNew } = this.props;
    const authenticated = await authenticateUser(currentUser, false);
    const { trace } = this.state;

    if (!authenticated) {
      return;
    }

    trace.ownerAddress = currentUser.address;
    trace.campaignId = this.state.campaignId;
    trace.status = isProposed || trace.status === Trace.REJECTED ? Trace.PROPOSED : trace.status; // make sure not to change status!
    if (trace.isCapped && !trace.itemizeState) {
      trace.conversionRate = currentRate.rates[trace.selectedFiatType];
    }
    trace.parentProjectId = this.state.campaignProjectId;

    const _saveTrace = () =>
      TraceService.save({
        trace,
        from: currentUser.address,
        afterSave: (created, txUrl, res) => {
          if (created) {
            if (isNew) {
              const url = res ? `/trace/${res._slug}` : undefined;
              React.toast.info(
                <Fragment>
                  <p>Your Trace has been proposed to the Campaign Owner.</p>
                  {url && <Link to={url}>View trace</Link>}
                </Fragment>,
              );
            }
          } else if (txUrl) {
            React.toast.info(
              <p>
                Your Trace is pending....
                <br />
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  View transaction
                </a>
              </p>,
            );
          } else {
            React.toast.success(
              <p>
                Your Trace has been updated!
                <br />
              </p>,
            );
            GA.trackEvent({
              category: 'Trace',
              action: 'updated',
              label: this.state.id,
            });
          }

          sessionStorage.removeItem('trace-form');
          this.setState({
            isSaving: false,
          });
          if (this.props.isNew) {
            this.props.history.goBack();
          } else {
            history.push(`/campaigns/${trace.campaignId}/traces/${trace.id}`);
          }
        },
        afterMined: (created, txUrl) => {
          if (created) {
            notification.success({
              description: (
                <p>
                  Your Trace has been created!
                  <br />
                  <a href={txUrl} target="_blank" rel="noopener noreferrer">
                    View transaction
                  </a>
                </p>
              ),
            });
          } else {
            notification.success({
              description: (
                <p>
                  Your Trace has been updated!
                  <br />
                  <a href={txUrl} target="_blank" rel="noopener noreferrer">
                    View transaction
                  </a>
                </p>
              ),
            });
          }
        },
        onError: errorMessage => {
          if (errorMessage) React.toast.error(errorMessage);

          this.setState({ isSaving: false });
        },
      });

    this.setState(
      {
        isSaving: true,
      },
      () => {
        if (isProposed && isNew) {
          React.swal({
            title: 'Propose Trace?',
            text:
              'The Trace will be proposed to the Campaign owner and he or she might approve or reject your trace.',
            icon: 'warning',
            dangerMode: true,
            buttons: ['Cancel', 'Yes, propose'],
          }).then(isConfirmed => {
            if (isConfirmed) _saveTrace();
            else this.setState({ isSaving: false });
          });
        } else {
          _saveTrace();
        }
      },
    );
  }

  removeItem(index) {
    const { trace } = this.state;
    delete trace.items[index];
    trace.items = trace.items.filter(() => true);

    this.setState({ trace });
  }

  btnText() {
    if (this.props.isNew) {
      return this.props.isProposed ? 'Propose Trace' : 'Create Trace';
    }
    return 'Update Trace';
  }

  addItem(item) {
    const { trace } = this.state;
    const tokenSymbol = trace.token.symbol || 'ETH';
    this.getDateRate(item.date, tokenSymbol, item.selectedFiatType).then(rate => {
      if (!rate) return;
      if (rate[item.selectedFiatType] === undefined) {
        item.conversionRate = rate.EUR;
        item.selectedFiatType = 'EUR';
        item.wei = utils.toWei(new BigNumber(item.fiatAmount).div(item.conversionRate).toFixed(18));
      } else {
        item.conversionRate = rate[item.selectedFiatType];
        item.wei = utils.toWei(new BigNumber(item.fiatAmount).div(item.conversionRate).toFixed(18));
      }
      trace.items = trace.items.concat(item);

      this.setState({
        refreshList: trace.items,
      });
    });
  }

  handleTemplateChange(option) {
    this.setState(prevState => {
      const { trace } = prevState;
      trace.description = templates.templates[option];
      return { trace, template: option };
    });
  }

  validateTraceDesc(value) {
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
    return getHtmlText(value).length > 10;
  }

  saveFormInStorage(form) {
    if (!this.props.isNew) return;

    const { title, description, reviewerAddress, communityId, recipientAddress } = form;
    sessionStorage.setItem(
      'trace-form',
      JSON.stringify({
        title,
        description,
        reviewerAddress,
        communityId,
        recipientAddress,
      }),
    );
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
      communities,
      isLoading,
      isSaving,
      refreshList,
      formIsValid,
      campaignTitle,
      tokenWhitelistOptions,
      trace,
      hasReviewer,
      delegatePercent,
      isLPTrace,
      acceptsSingleToken,
      itemizeState,
      selectedFiatType,
      fiatAmount,
      maxAmount,
      recipientAddress,
      image,
      isCapped,
    } = this.state;

    const traceHasFunded = trace && trace.donationCounters && trace.donationCounters.length > 0;

    return (
      <div id="edit-trace-view">
        <div className="container-fluid page-layout edit-view">
          <div>
            <div className="col-md-8 m-auto">
              {isLoading && <Loader className="fixed" />}

              {!isLoading && (
                <div>
                  <GoBackButton
                    history={history}
                    title={isNew ? 'Back' : `Trace: ${trace.title}`}
                    to={
                      trace.campaignId && trace.id
                        ? `/campaigns/${trace.campaignId}/traces/${trace.id}`
                        : undefined
                    }
                  />

                  <div className="form-header">
                    {isNew && !isProposed && <h3>Add a new Trace</h3>}

                    {!isNew && !isProposed && <h3>Edit Trace {trace.title}</h3>}

                    {isNew && isProposed && <h3>Propose a Trace</h3>}

                    <h6>
                      Campaign: <strong>{getTruncatedText(campaignTitle, 100)}</strong>
                    </h6>

                    <p>
                      <i className="fa fa-question-circle" />A Trace is a single accomplishment
                      within a project. In the end, all donations end up in Traces. Once your Trace
                      is completed, you can request a payout.
                    </p>

                    {isProposed && (
                      <p>
                        <i className="fa fa-exclamation-triangle" />
                        You are proposing a Trace to the Campaign Owner. The Campaign Owner can
                        accept or reject your Trace
                      </p>
                    )}
                  </div>

                  <Form
                    id="edit-trace-form"
                    onSubmit={this.submit}
                    ref={this.form}
                    mapping={inputs => {
                      trace.title = inputs.title;
                      trace.description = inputs.description;
                      trace.reviewerAddress = inputs.reviewerAddress || ZERO_ADDRESS;
                      trace.communityId = parseInt(inputs.communityId, 10) || 0;
                      trace.recipientAddress = inputs.recipientAddress || ZERO_ADDRESS;
                    }}
                    onChange={val => this.saveFormInStorage(val)}
                    onValid={() => {
                      this.toggleFormValid(true);
                    }}
                    onInvalid={() => this.toggleFormValid(false)}
                    layout="vertical"
                  >
                    <Input
                      name="title"
                      label="What are you going to accomplish in this Trace?"
                      id="title-input"
                      type="text"
                      value={trace.title}
                      placeholder="E.g. buying goods"
                      help="Describe your Trace in 1 sentence."
                      validations="minLength:3"
                      validationErrors={{
                        minLength: 'Please provide at least 3 characters.',
                      }}
                      disabled={traceHasFunded}
                      required
                      autoFocus
                    />

                    {traceHasFunded ? (
                      <div className="card content-card">
                        <div className="card-body content">
                          {DescriptionRender(trace.description)}
                        </div>
                      </div>
                    ) : (
                      <div className="form-group">
                        <QuillFormsy
                          name="description"
                          templatesDropdown
                          label="Explain how you are going to do this successfully."
                          helpText="Make it as extensive as necessary. Your goal is to build trust,
                        so that people donate Ether to your Campaign. Don't hesitate to add a detailed budget for this Trace"
                          value={trace.description}
                          placeholder="Describe how you're going to execute your Trace successfully
                        ..."
                          onTextChanged={content => this.constructSummary(content)}
                          validations={{
                            templateValidator: function(values, value) {
                              return this.validateTraceDesc(value);
                            }.bind(this),
                          }}
                          help="Describe your Trace."
                          handleTemplateChange={this.handleTemplateChange}
                          validationErrors={{
                            templateValidator:
                              'Please provide at least 10 characters and do not edit the template keywords.',
                          }}
                          disabled={traceHasFunded}
                          required
                        />
                      </div>
                    )}
                    <div className="form-group">
                      <FormsyImageUploader
                        setImage={this.setImage}
                        previewImage={image}
                        required={isNew}
                      />
                    </div>

                    {communities.length > 0 && (
                      <div className="form-group">
                        <div className="form-group react-toggle-container">
                          <Toggle
                            id="itemize-state"
                            checked={delegatePercent}
                            onChange={e => this.setDelegatePercent(e.target.checked)}
                            disabled={!isNew && !isProposed}
                          />
                          <span className="label">Donate 3% to a Community</span>
                          {!delegatePercent && (
                            <span className="help-block">
                              Supporting a Community is optional, this will help a lot the growth of
                              amazing projects.
                            </span>
                          )}
                        </div>
                        {delegatePercent && (
                          <SelectFormsy
                            name="communityId"
                            id="community-select"
                            label="Community to donate to"
                            helpText="Funds will be delegated each time someone donates"
                            value={trace.communityId}
                            options={communities}
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
                        <span className="label">Disable Trace Reviewer</span>
                        {!hasReviewer && (
                          <span className="help-block">
                            Choosing not to use a reviewer on your Trace will allow you to withdraw
                            donations at anytime. The downside is that you are no longer held
                            accountable for completing the Trace before funds can be withdrawn and
                            thus less likely to receive donations.
                          </span>
                        )}
                      </div>
                      {hasReviewer && (
                        <SelectFormsy
                          name="reviewerAddress"
                          id="reviewer-select"
                          label="Select a reviewer"
                          helpText="The reviewer verifies that the Trace is completed successfully, thus building trust in your Trace"
                          value={trace.reviewerAddress}
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
                          checked={isLPTrace}
                          onChange={e => this.isLPTrace(e.target.checked)}
                          disabled={!isNew && !isProposed}
                        />
                        <span className="label">Raise funds for Campaign: {campaignTitle} </span>
                      </div>
                      {!isLPTrace && (
                        <Fragment>
                          <Input
                            name="recipientAddress"
                            id="title-input"
                            type="text"
                            value={recipientAddress}
                            onChange={this.setRecipientAddress}
                            placeholder={ZERO_ADDRESS}
                            help="Enter an Ethereum address. If left blank, you will be required to set the recipient address before you can withdraw from this Trace"
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
                        value={trace.token && trace.token.address}
                        options={tokenWhitelistOptions}
                        onChange={address => this.setToken(address)}
                        required
                        disabled={!isNew && !isProposed}
                      />
                    )}

                    <div className="react-toggle-container">
                      <Toggle
                        id="itemize-state"
                        checked={!isCapped}
                        onChange={e => this.isCapped(!e.target.checked)}
                        disabled={(!isNew && !isProposed) || !acceptsSingleToken}
                      />
                      <span className="label">Disable Trace fundraising cap</span>
                      {!trace.isCapped && (
                        <span className="help-block">
                          {acceptsSingleToken
                            ? 'It is recommended that you set a fundraising cap for your Trace.'
                            : 'In order to set a fundraising cap, you must only accept donations in a single token'}
                        </span>
                      )}
                    </div>
                    {trace.isCapped && (
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
                          <div className="card trace-items-card">
                            <div className="card-body">
                              {conversionRateLoading && <Loader />}

                              <div className="form-group row">
                                <div className="col-12">
                                  <DatePickerFormsy
                                    name="date"
                                    type="text"
                                    value={trace.date}
                                    startDate={trace.date}
                                    label="Trace date"
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
                                    onChange={this.changeSelectedFiat}
                                    helpText={returnHelpText(
                                      conversionRateLoading,
                                      trace,
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
                                    label={`Maximum amount in ${trace.token.name}`}
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
                          <TraceProof
                            isEditMode
                            onItemsChanged={returnedItems => this.onItemsChanged(returnedItems)}
                            token={trace.token}
                            traceStatus={trace.status}
                            refreshList={refreshList}
                          />
                        )}
                      </Fragment>
                    )}

                    <div className="form-group row">
                      <div className="col-4">
                        <GoBackButton
                          history={history}
                          title={isNew ? 'Back' : `Trace: ${trace.title}`}
                          to={
                            trace.campaignId && trace.id
                              ? `/campaigns/${trace.campaignId}/traces/${trace.id}`
                              : undefined
                          }
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

EditTraceOld.propTypes = {
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
      traceId: PropTypes.string,
    }).isRequired,
  }).isRequired,
  getConversionRates: PropTypes.func.isRequired,
  currentRate: PropTypes.shape({
    rates: PropTypes.shape().isRequired,
    timestamp: PropTypes.string.isRequired,
  }),
  conversionRateLoading: PropTypes.bool.isRequired,
  fiatTypes: PropTypes.arrayOf(PropTypes.object).isRequired,
  reviewers: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  tokenWhitelist: PropTypes.arrayOf(PropTypes.shape()).isRequired,
};

EditTraceOld.defaultProps = {
  currentUser: undefined,
  isNew: false,
  isProposed: false,
  currentRate: undefined,
};

export default getConversionRatesContext(props => (
  <WhiteListConsumer>
    {({ state: { activeTokenWhitelist, reviewers, isLoading: whitelistIsLoading } }) => (
      <UserConsumer>
        {({ state: { currentUser, isLoading: userIsLoading } }) => (
          <Fragment>
            {(whitelistIsLoading || userIsLoading) && <Loader className="fixed" />}
            {!(whitelistIsLoading || userIsLoading) && (
              <EditTraceOld
                tokenWhitelist={activeTokenWhitelist}
                reviewers={reviewers}
                currentUser={currentUser}
                {...props}
              />
            )}
          </Fragment>
        )}
      </UserConsumer>
    )}
  </WhiteListConsumer>
));
