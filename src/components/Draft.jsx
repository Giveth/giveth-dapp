import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
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
    } else {
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
  }
  const isLPMilestone = localStorage.getItem('milestone.isLPMilestone');
  if (isLPMilestone === 'true') {
    this.isLPMilestone(true);
  }
}

function onDraftChange() {
  if (!this.props.isNew) return;
  const { draftLoaded, draftSaved, draftState } = this.state;
  if (draftLoaded + 1000 > Date.now()) return;
  if (draftSaved && draftSaved + 1000 > Date.now()) return;
  if (draftState < draftStates.changed) {
    this.setState({ draftState: draftStates.changed });
  }
}

function onImageChange() {
  if (!this.props.isNew) return;
  this.setState({ draftState: draftStates.changedImage });
}

function saveMilestoneDraft(that, itemNames) {
  const { localStorage } = window;
  const { milestone } = that.state;
  localStorage.setItem('milestone.hasReviewer', milestone.hasReviewer);
  itemNames.push('milestone.hasReviewer');
  localStorage.setItem('milestone.isLPMilestone', milestone instanceof LPMilestone);
  itemNames.push('milestone.isLPMilestone');
  localStorage.setItem('milestone.acceptsSingleToken', milestone.acceptsSingleToken);
  itemNames.push('milestone.acceptsSingleToken');
  localStorage.setItem('milestone.isCapped', milestone.isCapped);
  itemNames.push('milestone.isCapped');
  localStorage.setItem('milestone.itemizeState', milestone.itemizeState);
  itemNames.push('milestone.itemizeState');
}

function saveDraft(force = false) {
  if (!this.props.isNew) return [];
  if (this.state.draftState < draftStates.changed && !force) return [];
  const itemNames = [];
  const { draftType, draftState } = this.state;
  const object = this.state[draftType];
  const { localStorage } = window;
  const form = this.form.current.formsyForm.getCurrentValues();
  Object.keys(form).forEach(item => {
    if (item !== 'picture') {
      const itemName = `${draftType}.${item}`;
      localStorage.setItem(itemName, form[item]);
      itemNames.push(itemName);
    }
  });
  if (draftState === draftStates.changedImage || force) {
    const itemName = `${draftType}.picture`;
    localStorage.setItem(itemName, object.image);
    itemNames.push(itemName);
  }
  const itemName = `${draftType}.timestamp`;
  localStorage.setItem(itemName, Date.now());
  itemNames.push(itemName);
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
      default: {
        this.setState({
          hidden: false,
          disabled: false,
          label: labels.changed,
        });
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
