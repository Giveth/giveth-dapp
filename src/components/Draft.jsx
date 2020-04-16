import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import MilestoneItem from 'models/MilestoneItem';
import BigNumber from 'bignumber.js';
import LPMilestone from '../models/LPMilestone';

const draftStates = {
  hidden: 0,
  saved: 1,
  changed: 2,
  changedImage: 3,
};

let milestoneDraftLoaded = false;

function getDraftType(state) {
  if ('milestone' in state) {
    return 'milestone';
  }
  if ('campaign' in state) {
    return 'campaign';
  }
  if ('dac' in state) {
    return 'dac';
  }
  return undefined;
}

function setDraftLoaded(_this) {
  _this.setState({ draftLoaded: Date.now() });
}

function loadDraft() {
  if (this.state.draftLoaded) {
    setDraftLoaded(this);
    return;
  }
  if (!this.props.isNew) {
    setDraftLoaded(this);
    return;
  }
  if (!this.form.current || !this.form.current.formsyForm) {
    setDraftLoaded(this);
    return;
  }
  window.setInterval(this.saveDraft, 60000);
  const draftType = getDraftType(this.state);
  const { localStorage } = window;
  if (!localStorage.getItem(`${draftType}.timestamp`)) {
    setDraftLoaded(this);
    return;
  }
  this.form.current.formsyForm.inputs.forEach(input => {
    const name = `${draftType}.${input.props.name}`;
    const value = localStorage.getItem(name);
    if (input.props.name === 'picture') {
      if (value) {
        this.setImage(value);
      }
    }
    if (input.props.name === 'date') {
      const date = moment.utc(value);
      this.setDate(date);
    } else if (value) {
      input.setValue(value);
    }
  });
  this.setState({ draftLoaded: Date.now() });
}

async function loadMilestoneDraft() {
  const isLate = Date.now() > this.state.draftLoaded + 1000;
  if (!this.state.draftLoaded) return;
  if (milestoneDraftLoaded) return;
  milestoneDraftLoaded = true;
  if (isLate) return;

  const { localStorage } = window;
  const hasReviewer = localStorage.getItem('milestone.hasReviewer');

  const acceptsSingleToken = localStorage.getItem('milestone.acceptsSingleToken');

  const isCapped = localStorage.getItem('milestone.isCapped');
  const dacId = localStorage.getItem('milestone.dacId');

  const itemizeState = localStorage.getItem('milestone.itemizeState');
  const itemCount = +localStorage.getItem('milestone.itemCount');
  const itemsList = [];
  if (itemizeState === 'true') {
    this.itemizeState(true);
    for (let i = 0; i < itemCount; i += 1) {
      const id = `milestone.items.${i}`;
      const item = new MilestoneItem({});
      item.date = localStorage.getItem(`${id}.date`);
      item.description = localStorage.getItem(`${id}.description`);
      item.image = localStorage.getItem(`${id}.image`);
      item.selectedFiatType = localStorage.getItem(`${id}.selectedFiatType`);
      item.fiatAmount = new BigNumber(localStorage.getItem(`${id}.fiatAmount`));
      item.wei = localStorage.getItem(`${id}.wei`);
      item.conversionRate = parseFloat(localStorage.getItem(`${id}.conversionRate`));
      item.conversionRateTimestamp = localStorage.getItem(`${id}.conversionRateTimestamp`);
      itemsList.push(item);
    }
  }

  const isLPMilestone = localStorage.getItem('milestone.isLPMilestone');

  const tokenAddress = localStorage.getItem('milestone.tokenAddress');

  const maxAmountItem = localStorage.getItem('milestone.maxAmount');
  let maxAmount;
  if (maxAmountItem) {
    maxAmount = maxAmountItem;
  }

  const fiatAmount = localStorage.getItem('milestone.fiatAmount');

  const selectedFiatType = localStorage.getItem('milestone.selectedFiatType');

  const draftSettings = {
    hasReviewer,
    acceptsSingleToken,
    isCapped,
    dacId,
    itemizeState,
    itemCount,
    itemsList,
    isLPMilestone,
    tokenAddress,
    maxAmount,
    fiatAmount,
    selectedFiatType,
  };
  this.loadDraftStatus(draftSettings);
}

function milestoneIdMatch(id) {
  const { localStorage } = window;
  const campaignId = localStorage.getItem('milestone.campaignId');
  if (!campaignId) return true;
  if (campaignId === id) {
    return true;
  }
  return false;
}

function onDraftChange() {
  if (!this.props.isNew) return;
  const { draftLoaded, draftSaved, draftChanged, draftState } = this.state;
  if (draftLoaded + 1000 > Date.now()) return;
  if (draftSaved && draftSaved + 1000 > Date.now()) return;
  if (draftChanged && Date.now() < draftChanged + 1000) return;
  if (draftState < draftStates.changed) {
    this.setState({
      draftState: draftStates.changed,
      draftChanged: Date.now(),
    });
  }
}

function onImageChange() {
  if (!this.props.isNew) return;
  this.setState({ draftState: draftStates.changedImage });
}

function set(name, value, itemNames) {
  window.localStorage.setItem(name, value);
  itemNames.push(name);
}

function saveMilestoneDraft(that, itemNames) {
  const { milestone } = that.state;
  const {
    hasReviewer,
    isCapped,
    dacId,
    acceptsSingleToken,
    token,
    selectedFiatType,
    itemizeState,
    maxAmount,
    fiatAmount,
  } = milestone;
  set('milestone.campaignId', that.state.campaignId, itemNames);
  set('milestone.hasReviewer', hasReviewer, itemNames);
  set('milestone.isLPMilestone', milestone instanceof LPMilestone, itemNames);
  set('milestone.acceptsSingleToken', acceptsSingleToken, itemNames);
  set('milestone.isCapped', isCapped, itemNames);
  if (maxAmount) {
    set('milestone.maxAmount', maxAmount.toNumber(), itemNames);
  }
  if (fiatAmount) {
    set('milestone.fiatAmount', fiatAmount.toNumber(), itemNames);
  }
  set('milestone.itemizeState', itemizeState, itemNames);
  if (token) {
    set('milestone.tokenAddress', token.address, itemNames);
  }
  set('milestone.selectedFiatType', selectedFiatType, itemNames);
  set('milestone.dacId', dacId, itemNames);
  if (itemizeState) {
    const items = that.form.current.formsyForm.inputs.filter(input =>
      input.props.name.startsWith('milestoneItem'),
    );
    items.sort((a, b) => {
      if (a.props.item.date > b.props.item.date) {
        return 1;
      }
      if (a.props.item.date < b.props.item.date) {
        return -1;
      }
      return 0;
    });
    items.forEach((item, i) => {
      const id = `milestone.items.${i}`;
      set(`${id}.description`, item.props.item.description, itemNames);
      set(`${id}.date`, item.props.item.date, itemNames);
      set(`${id}.fiatAmount`, item.props.item.fiatAmount, itemNames);
      set(`${id}.selectedFiatType`, item.props.item.selectedFiatType, itemNames);
      set(`${id}.conversionRate`, item.props.item.conversionRate, itemNames);
      set(`${id}.conversionRateTimestamp`, item.props.item.conversionRateTimestamp, itemNames);
      set(`${id}.wei`, item.props.item.wei, itemNames);
      set(`${id}.image`, item.props.item.image, itemNames);
    });
    set('milestone.itemCount', items.length, itemNames);
  }
}

function saveDraft(force = false) {
  if (!this.props.isNew) return [];
  if (this.state.draftState < draftStates.changed && !force) return [];
  if (!this.form.current || !this.form.current.formsyForm) return [];
  const itemNames = [];
  const { draftType, draftState } = this.state;
  const object = this.state[draftType];
  const form = this.form.current.formsyForm.getCurrentValues();
  Object.keys(form).forEach(item => {
    if (item !== 'picture' && !item.startsWith('milestoneItem')) {
      const itemName = `${draftType}.${item}`;
      set(itemName, form[item], itemNames);
    }
  });
  if (draftState === draftStates.changedImage || force) {
    const itemName = `${draftType}.picture`;
    if (object) {
      set(itemName, object.image, itemNames);
    }
  }
  const itemName = `${draftType}.timestamp`;
  set(itemName, Date.now(), itemNames);
  if (draftType === 'milestone') {
    saveMilestoneDraft(this, itemNames);
  }
  this.setState({
    draftState: draftStates.saved,
    draftSaved: Date.now(),
  });
  return itemNames;
}

function setDraftType() {
  this.setState(prevState => ({ draftType: getDraftType(prevState) }));
}

function deleteDraft(itemNames) {
  if (!itemNames) return;
  itemNames.forEach(itemName => {
    window.localStorage.removeItem(itemName);
  });
}

const labels = {
  saved: 'Draft Saved',
  changed: 'Save Draft',
};

class DraftButton extends Component {
  constructor(props) {
    super(props);
    this.state = { hidden: true };
    this.updateWidth = this.updateWidth.bind(this);
  }

  componentDidMount() {
    this.updateWidth();
    window.addEventListener('resize', this.updateWidth);
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps) {
    switch (nextProps.draftState) {
      case draftStates.hidden: {
        this.setState({ hidden: true });
        break;
      }
      case draftStates.saved: {
        this.setState({
          hidden: false,
          disabled: true,
          label: labels.saved,
        });
        break;
      }
      case draftStates.changedImage:
      // eslint-disable-next-line
      case draftStates.changed: {
        this.setState({
          hidden: false,
          disabled: false,
          label: labels.changed,
        });
        break;
      }
      default: {
        break;
      }
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWidth);
  }

  updateWidth() {
    this.setState({ width: window.innerWidth });
  }

  render() {
    return this.state.hidden || this.state.width < 348 ? (
      ''
    ) : (
      <button
        type="button"
        className="btn btn-primary pull-left"
        disabled={this.state.disabled}
        onClick={this.props.onClick}
      >
        <i className="fa fa-save" />
        {this.state.width >= 460 && this.state.label}
      </button>
    );
  }
}

DraftButton.propTypes = {
  draftState: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired,
};

export {
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
};
