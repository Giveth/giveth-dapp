import React, { Component } from 'react';
import PropTypes from 'prop-types';

function loadDraft() {
  this.setState({
    draftChanged: false,
    imageChanged: false,
  });
}

function onDraftChange(img) {
  this.setState({ draftChanged: true });
  if (img) {
    this.setState({ imageChanged: true });
  }
}

function saveDraft() {
  if (this.state.draftChanged) {
    const id = this.props.match.params.milestoneId;
    const form = this.form.current.formsyForm.getCurrentValues();
    Object.keys(form).forEach(field => {
      if (field !== 'picture') {
        window.localStorage.setItem(`${id}.${field}`, form[field]);
      }
    });
    if (this.state.imageChanged) {
      window.localStorage.setItem(`${id}.picture`, this.state.milestone.image);
      this.setState({ imageChanged: false });
    }
  }
  this.setState({ draftChanged: false });
}

class DraftButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      text: 'Draft Saved',
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ text: nextProps.disabled ? 'Draft Saved' : 'Save Draft' });
  }

  render() {
    return (
      <button
        type="button"
        className="btn btn-primary"
        disabled={this.props.disabled}
        onClick={this.props.onClick}
      >
        <i className="fa fa-save" />
        &nbsp;{this.state.text}
      </button>
    );
  }
}

DraftButton.propTypes = {
  disabled: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

export { loadDraft, onDraftChange, saveDraft, DraftButton };
