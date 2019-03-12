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

function loadDraft() {
  if (this.state.draftLoaded) return;
  if (!this.props.isNew) return;
  this.setState(prevState => ({ draftType: getDraftType(prevState) }));
  const draftType = getDraftType(this.state);
  const { localStorage } = window;
  if (!localStorage.getItem(`${draftType}.timestamp`)) return;
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

function loadMilestoneDraft() {
  if (!this.state.draftLoaded) return;
  if (Date.now() > this.state.draftLoaded + 1000) return;
  const { localStorage } = window;
  const hasReviewer = localStorage.getItem('milestone.hasReviewer');
  if (hasReviewer === 'false') {
    this.hasReviewer(false);
  }
  const acceptsSingleToken = localStorage.getItem('milestone.acceptsSingleToken');
  if (acceptsSingleToken === 'false') {
    this.acceptsSingleToken(false);
  }
  const isCapped = localStorage.getItem('milestone.isCapped');
  if (isCapped === 'false') {
    this.isCapped(false);
  }
  const itemizeState = localStorage.getItem('milestone.itemizeState');
  if (itemizeState === 'true') {
    this.itemizeState(true);
    const itemCount = +localStorage.getItem('milestone.itemCount');
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
      this.addItem(item);
    }
  }
  const isLPMilestone = localStorage.getItem('milestone.isLPMilestone');
  if (isLPMilestone === 'true') {
    this.isLPMilestone(true);
  }
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
  set('milestone.hasReviewer', milestone.hasReviewer, itemNames);
  set('milestone.isLPMilestone', milestone instanceof LPMilestone, itemNames);
  set('milestone.acceptsSingleToken', milestone.acceptsSingleToken, itemNames);
  set('milestone.isCapped', milestone.isCapped, itemNames);
  set('milestone.itemizeState', milestone.itemizeState, itemNames);
  if (milestone.itemizeState) {
    const items = that.form.current.formsyForm.inputs.filter(input =>
      input.props.name.startsWith('milestoneItem'),
    );
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
    set(itemName, object.image, itemNames);
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
  }

  componentWillReceiveProps(nextProps) {
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

  render() {
    return this.state.hidden ? (
      ''
    ) : (
      <button
        type="button"
        className="btn btn-primary pull-right"
        disabled={this.state.disabled}
        onClick={this.props.onClick}
      >
        <i className="fa fa-save" />
        &nbsp;{this.state.label}
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
  onDraftChange,
  onImageChange,
  saveDraft,
  deleteDraft,
  DraftButton,
};
