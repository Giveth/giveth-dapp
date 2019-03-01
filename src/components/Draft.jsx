import React, { Component } from 'react';
import PropTypes from 'prop-types';

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
  return 'TODO';
}

function loadDraft() {
  if (!this.props.isNew) return;
  this.setState(prevState => ({ draftType: getDraftType(prevState) }));
  const { draftType } = this.state;
  const { localStorage } = window;
  this.form.current.formsyForm.inputs.forEach(input => {
    const name = `${draftType}.${input.props.name}`;
    input.setValue(localStorage.getItem(name));
  });
}

function onDraftChange() {
  if (!this.props.isNew) return;
  if (this.state.draftState < draftStates.changed) {
    this.setState({ draftState: draftStates.changed });
  }
}

function onImageChange() {
  if (!this.props.isNew) return;
  this.setState({ draftState: draftStates.changedImage });
}

function saveDraft() {
  if (!this.props.isNew) return;
  if (this.state.draftState >= draftStates.changed) {
    const { draftType, draftState, milestone } = this.state;
    const { localStorage } = window;
    const form = this.form.current.formsyForm.getCurrentValues();
    Object.keys(form).forEach(item => {
      if (item !== 'picture') {
        localStorage.setItem(`${draftType}.${item}`, form[item]);
      }
    });
    if (draftState === draftStates.changedImage) {
      localStorage.setItem(`${draftType}.picture`, milestone.image);
    }
  }
  this.setState({ draftState: draftStates.saved });
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
        className="btn btn-primary"
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

export { draftStates, loadDraft, onDraftChange, onImageChange, saveDraft, DraftButton };
