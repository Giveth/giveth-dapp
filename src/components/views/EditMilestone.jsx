/* eslint-disable react/sort-comp */
import React, { Component, Fragment } from 'react';
import { Prompt, Link } from 'react-router-dom';
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
  isOwner,
  getTruncatedText,
  getStartOfDayUTC,
  ZERO_ADDRESS,
  ANY_TOKEN,
  history,
} from '../../lib/helpers';
import {
  checkForeignNetwork,
  checkBalance,
  authenticateIfPossible,
  checkProfile,
  sleep,
  historyBackWFallback,
} from '../../lib/middleware';
import LoaderButton from '../LoaderButton';
import User from '../../models/User';
import templates from '../../lib/milestoneTemplates';

import ErrorPopup from '../ErrorPopup';
import MilestoneProof from '../MilestoneProof';

import { Consumer as WhiteListConsumer } from '../../contextProviders/WhiteListProvider';
import getConversionRatesContext from '../../containers/getConversionRatesContext';
import MilestoneService from '../../services/MilestoneService';
import CampaignService from '../../services/CampaignService';
import DACService from '../../services/DACService';
import LPMilestone from '../../models/LPMilestone';
import BridgedMilestone from '../../models/BridgedMilestone';
import {
  draftStates,
  loadDraft,
  loadMilestoneDraft,
  setDraftType,
  milestoneIdMatch,
  onDraftChange,
  onImageChange,
  saveDraft,
  deleteDraft,
  DraftButton,
} from '../Draft';

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

let milestoneTemp = null;
let inDraft = false;
let isValid = false;
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
    if (milestoneTemp == null) {
      milestoneTemp = _this.state.milestone;
    }
    return milestoneTemp;
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
      componentDraftLoaded: false,
      milestone: MilestoneFactory.create({
        maxAmount: '0',
        fiatAmount: '0',
      }),
      tokenWhitelistOptions: props.tokenWhitelist.map(t => ({
        value: t.address,
        title: t.name,
      })),
      isBlocking: false,
      draftState: draftStates.hidden,
      toggles: {
        hasReviewer: true,
        delegatePercent: true,
        isLPMilestone: false,
        acceptsSingleToken: true,
        isCapped: true,
        itemizeState: false,
      },
    };

    this.form = React.createRef();
    this._isMounted = false;

    this.submit = this.submit.bind(this);
    this.setImage = this.setImage.bind(this);
    this.setMaxAmount = this.setMaxAmount.bind(this);
    this.setFiatAmount = this.setFiatAmount.bind(this);
    this.changeSelectedFiat = this.changeSelectedFiat.bind(this);
    this.onItemsChanged = this.onItemsChanged.bind(this);
    this.handleTemplateChange = this.handleTemplateChange.bind(this);
    this.validateMilestoneDesc = this.validateMilestoneDesc.bind(this);
    this.loadDraft = loadDraft.bind(this);
    this.loadMilestoneDraft = loadMilestoneDraft.bind(this);
    this.onDraftChange = onDraftChange.bind(this);
    this.onImageChange = onImageChange.bind(this);
    this.saveDraft = saveDraft.bind(this);
    this.setDraftType = setDraftType.bind(this);
    this.saveDraftAndDelete = this.saveDraftAndDelete.bind(this);
    this.retrieveMilestone = this.retrieveMilestone(this);
  }

  componentDidMount() {
    this._isMounted = true;
    this.initComponent();
  }

  async initComponent() {
    checkForeignNetwork(this.props.isForeignNetwork)
      .then(() => this.checkUser())
      .then(async () => {
        if (!this._isMounted) return;

        this.setState({
          campaignId: this.props.match.params.id,
        });

        await DACService.getDACs(
          undefined, // Limit
          0, // Skip
          (dacs, _) => {
            if (!this._isMounted) return;
            const formatDACS = dacs.map(r => ({
              value: r.myDelegateId.toString(),
              title: `${r.myDelegateId ? r.myDelegateId : '?'} - ${r._title}`,
            }));

            this.setState(prevState => {
              const newToggles = { ...prevState.toggles };
              if (dacs.length === 0) {
                newToggles.delegatePercent = false;
              }
              return {
                dacs: prevState.dacs.concat(formatDACS),
                toggles: newToggles,
              };
            });
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
        } else if (this.props.isNew) {
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

            if (!this._isMounted) return;

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

            this.setState({
              campaignTitle: campaign.title,
              campaignProjectId: campaign.projectId,
              milestone,
              isLoading: false,
            });

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
        } else if (err !== undefined) {
          ErrorPopup('Something went wrong. Please try again.', err);
        }
      });
  }

  componentDidUpdate(prevProps) {
    const milestoneOwner = this.state.milestone.owner;
    const { currentUser } = this.props;
    if (!this._isMounted) return;
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

  componentWillUnmount() {
    this._isMounted = false;
  }

  onAddItem(item) {
    if (!this._isMounted) return;
    this.addItem(item);
    if (this.state.componentDraftLoaded === false) return;

    this.setState({ addMilestoneItemModalVisible: false });
  }

  retrieveMilestone() {
    if (this.state.componentDraftLoaded === true) {
      const { milestone } = this.state;
      return milestone;
    }
    return milestoneTemp;
  }

  onItemsChanged(items) {
    if (!this._isMounted) return;
    let milestoneObject = null;
    try {
      milestoneObject = this.retrieveMilestone();
    } catch (e) {
      const { milestone } = this.state;
      milestoneObject = milestone;
    }
    milestoneObject.items = items;
    if (this.state.componentDraftLoaded === false) {
      milestoneTemp = milestoneObject;
      return;
    }

    this.setState({
      milestone: milestoneObject,
      refreshList: milestoneObject.items,
    });
    this.onDraftChange();
  }

  setImage(image) {
    if (!this._isMounted) return;
    let milestoneObject = null;
    try {
      milestoneObject = this.retrieveMilestone();
    } catch (e) {
      const { milestone } = this.state;
      milestoneObject = milestone;
    }
    milestoneObject.image = image;
    if (this.state.componentDraftLoaded === false) {
      milestoneTemp = milestoneObject;
      return;
    }
    this.onImageChange();
  }

  setDate(date) {
    if (!this._isMounted) return;
    const milestone = returnMilestone(this);
    milestone.date = date;
    this.props.getConversionRates(date, milestone.token.symbol).then(resp => {
      if (!this._isMounted) return;
      let rate =
        resp &&
        resp.rates &&
        (resp.rates[milestone.selectedFiatType] ||
          Object.values(resp.rates).find(v => v !== undefined));

      // This rate is undefined, use the milestone rate

      if (milestone.token.symbol) {
        milestone.selectedFiatType = milestone.token.symbol;
        if (resp.rates[milestone.token.symbol]) {
          rate = resp.rates[milestone.token.symbol];
        }
      }

      if (milestone.isCapped) {
        milestone.maxAmount = milestone.fiatAmount.div(rate);
        milestone.conversionRateTimestamp = resp.timestamp;
      }
      if (this.state.componentDraftLoaded === false) {
        milestoneTemp = milestone;
        return;
      }

      this.setState({ milestone });
    });
  }

  setFiatAmount(name, value) {
    if (!this._isMounted) return;
    const milestone = returnMilestone(this);
    const maxAmount = new BigNumber(value || '0');
    const conversionRate = this.props.currentRate.rates[milestone.selectedFiatType];

    if (conversionRate && maxAmount.gte(0)) {
      milestone.maxAmount = maxAmount;
      milestone.fiatAmount = maxAmount.times(conversionRate);
      milestone.conversionRateTimestamp = this.props.currentRate.timestamp;
      if (this.state.componentDraftLoaded === false) {
        milestoneTemp = milestone;
        return;
      }

      this.setState({ milestone });
    }
  }

  setMaxAmount(name, value) {
    if (!this._isMounted) return;
    const milestone = returnMilestone(this);
    const fiatAmount = new BigNumber(value || '0');
    const conversionRate = this.props.currentRate.rates[milestone.selectedFiatType];
    if (conversionRate && fiatAmount.gte(0)) {
      milestone.maxAmount = fiatAmount.div(conversionRate);
      milestone.fiatAmount = fiatAmount;
      milestone.conversionRateTimestamp = this.props.currentRate.timestamp;
      if (this.state.componentDraftLoaded === false) {
        milestoneTemp = milestone;
        return;
      }

      this.setState({ milestone });
    }
  }

  changeSelectedFiat(fiatType) {
    if (!this._isMounted) return;
    const milestone = returnMilestone(this);
    const conversionRate = this.props.currentRate.rates[fiatType];
    milestone.maxAmount = milestone.fiatAmount.div(conversionRate);
    milestone.selectedFiatType = fiatType;
    if (this.state.componentDraftLoaded === false) {
      milestoneTemp = milestone;
      return;
    }

    this.setState({ milestone });
  }

  saveDraftAndDelete() {
    if (!this._isMounted) return;
    if (this.state.componentDraftLoaded === false) return;
    const itemNames = this.saveDraft(true);
    deleteDraft(itemNames);
    this.saveDraft();
  }

  async toggleFormValid(formState) {
    if (!this._isMounted) return formState;
    if (inDraft === false) this.initializeDraft();
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

  async initializeDraft() {
    if (
      !milestoneIdMatch(this.state.campaignId) ||
      this.state.componentDraftLoaded === true ||
      inDraft === true
    )
      return;
    inDraft = true;
    this.setDraftType();
    this.loadDraft();
    await sleep(500);
    this.loadMilestoneDraft();
    this.setState({
      componentDraftLoaded: true,
    });
  }

  setToken(address) {
    if (!this._isMounted || address === ANY_TOKEN.address) return;
    this.getNewRates(address);
  }

  setDacId(dacId) {
    if (!this._isMounted) return;
    const milestone = returnMilestone(this);
    milestone.dacId = dacId;
    if (this.state.componentDraftLoaded === false) {
      milestoneTemp = milestone;
      return;
    }

    this.setState({ milestone });
  }

  async getNewRates(address) {
    if (!this._isMounted) return;
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
    if (!this._isMounted) return;

    this.setState({ milestone }, () => {
      this.setDate(this.state.milestone.data || getStartOfDayUTC());
    });
  }

  async getDateRate(date, token) {
    if (!this._isMounted) return null;
    if (this.state.componentDraftLoaded === false) return null;
    const { rates } = await this.props.getConversionRates(date, token.symbol);
    return rates;
  }

  checkUser() {
    if (!this._isMounted) return null;
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
    if (!this._isMounted) return;
    const { toggles } = this.state;
    const milestone = returnMilestone(this);
    milestone.itemizeState = value;
    toggles.itemizeState = value;
    if (this.state.componentDraftLoaded === false) {
      milestoneTemp = milestone;
      return;
    }

    this.setState({ milestone, toggles });
    this.onDraftChange();
  }

  hasReviewer(value) {
    if (!this._isMounted) return;
    const { toggles } = this.state;
    const milestone = returnMilestone(this);
    milestone.reviewerAddress = value ? '' : ZERO_ADDRESS;
    toggles.hasReviewer = value;
    if (this.state.componentDraftLoaded === false) {
      milestoneTemp = milestone;
      return;
    }

    this.setState({ milestone, toggles });
    this.onDraftChange();
  }

  delegatePercent(value) {
    if (!this._isMounted) return;
    const { toggles, dacs } = this.state;
    const milestone = returnMilestone(this);
    const dacIdMilestone = value && dacs.length > 0 ? parseInt(dacs[0].value, 10) : 0;
    milestone.dacId = parseInt(dacIdMilestone, 10);
    toggles.delegatePercent = value;
    if (this.state.componentDraftLoaded === false && this.props.isNew) {
      milestoneTemp = milestone;
      return;
    }
    this.setState({ milestone, toggles });
    this.onDraftChange();
  }

  async loadDraftStatus(draftSettings) {
    const { campaignProjectId, toggles } = this.state;
    const milestone = milestoneTemp;

    const {
      hasReviewer,
      acceptsSingleToken,
      maxAmount,
      fiatAmount,
      selectedFiatType,
      isCapped,
      itemizeState,
      tokenAddress,
      dacId,
      isLPMilestone,
      itemsList,
    } = draftSettings;

    if ((hasReviewer === undefined || hasReviewer === null) && this.props.isNew) {
      this.delegatePercent(true);
      return;
    }

    let cappedBool = false;
    if (isCapped !== undefined && isCapped === 'true') {
      cappedBool = true;
    } else cappedBool = false;
    let hasRevBool = false;
    if (hasReviewer !== undefined && hasReviewer === 'true') {
      hasRevBool = true;
    } else hasRevBool = false;
    let acceptsBool = false;
    if (acceptsSingleToken !== undefined && acceptsSingleToken === 'true') {
      acceptsBool = true;
    } else acceptsBool = false;
    let itemBool = false;
    if (itemizeState !== undefined && itemizeState === 'true') {
      itemBool = true;
    } else itemBool = false;

    if (!this.props.isNew) return;
    if (!milestone.reviewerAddress == null) return;

    if (hasReviewer !== undefined) {
      milestone.reviewerAddress = hasRevBool ? '' : ZERO_ADDRESS;
      toggles.hasReviewer = hasRevBool;
      this.hasReviewer(hasRevBool);
    }
    if (acceptsSingleToken !== undefined) {
      if (!acceptsSingleToken) {
        // if ANY_TOKEN is allowed, then we can't have a cap
        milestone.maxAmount = undefined;
        milestone.itemizeState = false;
      }
      this.acceptsSingleToken(acceptsBool);
      toggles.acceptsSingleToken = acceptsBool;
    }
    if (maxAmount) {
      milestone.maxAmount = new BigNumber(maxAmount);
    }
    if (fiatAmount) {
      milestone.fiatAmount = new BigNumber(fiatAmount);
    }
    if (selectedFiatType) {
      milestone.selectedFiatType = selectedFiatType;
    }

    if (isCapped !== undefined) {
      milestone.maxAmount = cappedBool ? new BigNumber(0) : undefined;
      toggles.isCapped = cappedBool;
      this.isCapped(cappedBool);
    }
    if (itemizeState !== undefined) {
      milestone.itemizeState = itemBool;
      toggles.itemizeState = itemBool;
    }
    if (itemizeState === 'true') {
      itemsList.forEach(i => {
        this.addItem(i);
      });
    }
    if (tokenAddress) {
      const token = this.props.tokenWhitelist.find(t => t.address === tokenAddress)
        ? this.props.tokenWhitelist.find(t => t.address === tokenAddress)
        : ANY_TOKEN;
      milestone.token = token;
      if (milestone.token === undefined) {
        milestone.token = ANY_TOKEN;
        toggles.acceptsSingleToken = true;
        this.acceptsSingleToken(true);
      }
    } else {
      milestone.token = ANY_TOKEN;
      toggles.acceptsSingleToken = true;
      this.acceptsSingleToken(true);
    }
    if (parseInt(dacId, 10) !== 0) {
      this.delegatePercent(true);
      milestone.dacId = parseInt(dacId, 10);
    } else {
      this.delegatePercent(false);
    }

    if (isLPMilestone === 'true') {
      if (!isLPMilestone) {
        const ms = new BridgedMilestone(milestone.toFeathers());
        ms.itemizeState = toggles.itemizeState;

        this.setState({ milestone: ms });
      } else {
        const ms = new LPMilestone({
          ...milestone.toFeathers(),
          recipientId: campaignProjectId,
        });
        ms.itemizeState = toggles.itemizeState;

        this.setState({ milestone: ms });
      }
      toggles.isLPMilestone = isLPMilestone;
    } else {
      this.setState({ milestone });
    }

    this.setState({ toggles });
    if (tokenAddress !== ANY_TOKEN.address) {
      this.setToken(tokenAddress);
    }
    await sleep(5000);
    if (isValid) {
      this.toggleFormValid(true);
    }
  }

  isLPMilestone(value) {
    if (!this._isMounted) return;
    const { campaignProjectId, toggles } = this.state;
    const milestone = returnMilestone(this);
    let ms = null;
    if (!value) {
      ms = new BridgedMilestone(milestone.toFeathers());
      ms.itemizeState = toggles.itemizeState;
    } else {
      ms = new LPMilestone({
        ...milestone.toFeathers(),
        recipientId: campaignProjectId,
      });
      ms.itemizeState = toggles.itemizeState;
    }
    if (this.state.componentDraftLoaded === false) {
      milestoneTemp = milestone;
      return;
    }

    this.setState({ milestone: ms });
    this.onDraftChange();
    toggles.isLPMilestone = value;

    this.setState({ toggles });
  }

  acceptsSingleToken(value) {
    if (!this._isMounted) return;
    const { toggles } = this.state;
    const milestone = returnMilestone(this);
    milestone.token = value ? this.props.tokenWhitelist[0] : ANY_TOKEN;
    if (!value) {
      // if ANY_TOKEN is allowed, then we can't have a cap
      milestone.maxAmount = undefined;
      milestone.itemizeState = false;
    }
    toggles.acceptsSingleToken = value;
    if (this.state.componentDraftLoaded === false) {
      milestoneTemp = milestone;
      return;
    }

    this.setState({ milestone, toggles });
    this.onDraftChange();
  }

  isCapped(value) {
    if (!this._isMounted) return;
    const { toggles } = this.state;
    const milestone = returnMilestone(this);
    milestone.maxAmount = value ? new BigNumber(0) : undefined;
    if (value) {
      milestone.fiatAmount = new BigNumber(0);
    }
    toggles.isCapped = value;
    if (this.state.componentDraftLoaded === false) {
      milestoneTemp = milestone;
      return;
    }

    this.setState({ milestone, toggles });
    this.onDraftChange();
  }

  toggleAddMilestoneItemModal() {
    if (!this._isMounted) return;

    this.setState(prevState => ({
      addMilestoneItemModalVisible: !prevState.addMilestoneItemModalVisible,
    }));
  }

  setMyAddressAsRecipient() {
    if (!this._isMounted) return;
    const milestone = returnMilestone(this);
    milestone.recipientAddress = this.props.currentUser.address;
    if (this.state.componentDraftLoaded === false) {
      milestoneTemp = milestone;
      return;
    }

    this.setState({ milestone });
  }

  submit() {
    if (!this._isMounted) return;
    const itemNames = this.saveDraft(true);
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
          if (milestoneIdMatch(this.state.campaignId)) {
            deleteDraft(itemNames);
          }
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
            isBlocking: false,
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
        isBlocking: false,
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
    if (!this._isMounted) return;
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
    if (!this._isMounted) return;
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
      if (!this._isMounted || !rate) return;
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
    if (!this._isMounted) return;
    const milestone = this.retrieveMilestone();
    milestone.description = templates.templates[option];
    if (this.state.componentDraftLoaded === false) {
      milestoneTemp = milestone;
      return;
    }

    this.setState({
      milestone,
      template: option,
    });
  }

  onFormChange() {
    if (!this._isMounted) return;
    this.triggerRouteBlocking();
    this.onDraftChange();
  }

  triggerRouteBlocking() {
    if (!this._isMounted) return;
    const form = this.form.current.formsyForm;
    // we only block routing if the form state is not submitted
    if (this.state.loadTime + 5000 >= Date.now()) return;

    this.setState({
      isBlocking: form && (!form.state.formSubmitted || form.state.isSubmitting),
    });
  }

  validateMilestoneDesc(value) {
    if (!this._isMounted) return null;
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
      isBlocking,
      milestone,
      draftState,
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
                      isValid = true;
                      this.toggleFormValid(true);
                    }}
                    onInvalid={() => this.toggleFormValid(false)}
                    onChange={e => this.onFormChange(e)}
                    layout="vertical"
                  >
                    <Prompt
                      when={isBlocking && draftState >= draftStates.changed}
                      message={() =>
                        `You have unsaved changes. Are you sure you want to navigate from this page?`
                      }
                    />

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
                        previewImage={milestone.image}
                        required={isNew}
                      />
                    </div>

                    {this.state.dacs.length > 0 && (
                      <div className="form-group">
                        <div className="form-group react-toggle-container">
                          <Toggle
                            id="itemize-state"
                            checked={milestone.delegatePercent}
                            onChange={e => this.delegatePercent(e.target.checked)}
                            disabled={!isNew && !isProposed}
                          />
                          <span className="label">Donate 3% to a DAC</span>
                          {!milestone.delegatePercent && (
                            <span className="help-block">
                              Supporting a DAC is optional, this will help a lot the growth of
                              amazing projects.
                            </span>
                          )}
                        </div>
                        {milestone.delegatePercent && (
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
                          checked={!milestone.hasReviewer}
                          onChange={e => this.hasReviewer(!e.target.checked)}
                          disabled={!isNew && !isProposed}
                        />
                        <span className="label">Disable Milestone Reviewer</span>
                        {!milestone.hasReviewer && (
                          <span className="help-block">
                            Choosing not to use a reviewer on your Milestone will allow you to
                            withdraw donations at anytime. The downside is that you are no longer
                            held accountable for completing the Milestone before funds can be
                            withdrawn and thus less likely to receive donations.
                          </span>
                        )}
                      </div>
                      {milestone.hasReviewer && (
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
                          checked={milestone instanceof LPMilestone}
                          onChange={e => this.isLPMilestone(e.target.checked)}
                          disabled={!isNew && !isProposed}
                        />
                        <span className="label">Raise funds for Campaign: {campaignTitle} </span>
                      </div>
                      {!(milestone instanceof LPMilestone) && (
                        <Fragment>
                          <Input
                            name="recipientAddress"
                            id="title-input"
                            type="text"
                            value={milestone.recipientAddress}
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
                        checked={!milestone.acceptsSingleToken}
                        onChange={e => this.acceptsSingleToken(!e.target.checked)}
                        disabled={!isNew && !isProposed}
                      />
                      <span className="label">Accept donations in all tokens</span>
                    </div>
                    {milestone.acceptsSingleToken && (
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
                        disabled={(!isNew && !isProposed) || !milestone.acceptsSingleToken}
                      />
                      <span className="label">Disable Milestone fundraising cap</span>
                      {!milestone.isCapped && (
                        <span className="help-block">
                          {milestone.acceptsSingleToken
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
                            checked={milestone.itemizeState}
                            onChange={e => this.itemizeState(e.target.checked)}
                            disabled={!isNew && !isProposed}
                          />
                          <span className="label">Add multiple expenses, invoices or items</span>
                        </div>

                        {!milestone.itemizeState ? (
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
                                    required={!milestone.itemizeState}
                                    disabled={!isNew && !isProposed}
                                  />
                                </div>
                              </div>

                              <div className="form-group row">
                                <div className="col-4">
                                  <Input
                                    name="fiatAmount"
                                    min="0"
                                    id="fiatamount-input"
                                    type="number"
                                    step="any"
                                    label={`Maximum amount in ${milestone.selectedFiatType}`}
                                    value={milestone.fiatAmount.toFixed()}
                                    placeholder="10"
                                    validations="greaterThan:0"
                                    validationErrors={{
                                      greaterEqualTo: 'Minimum value must be greater than 0',
                                    }}
                                    disabled={!isNew && !isProposed}
                                    onChange={this.setMaxAmount}
                                  />
                                </div>

                                <div className="col-4">
                                  <SelectFormsy
                                    name="fiatType"
                                    label="Currency"
                                    value={milestone.selectedFiatType}
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

                                <div className="col-4">
                                  <Input
                                    name="maxAmount"
                                    min="0"
                                    id="maxamount-input"
                                    type="number"
                                    step="any"
                                    label={`Maximum amount in ${milestone.token.name}`}
                                    value={milestone.maxAmount.toFixed()}
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
                      <div className="col-4">
                        <DraftButton
                          draftState={this.state.draftState}
                          onClick={this.saveDraftAndDelete}
                        />
                      </div>
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
    {({ state: { tokenWhitelist, reviewers, isLoading }, actions: { isCampaignManager } }) => (
      <div>
        {isLoading && <Loader className="fixed" />}
        {!isLoading && (
          <EditMilestone
            tokenWhitelist={tokenWhitelist}
            reviewers={reviewers}
            isCampaignManager={isCampaignManager}
            {...props}
          />
        )}
      </div>
    )}
  </WhiteListConsumer>
));
