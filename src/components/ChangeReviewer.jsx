import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import Modal from 'react-modal';

import ChangeReviewerForm from './ChangeReviewerForm';
import { feathersClient } from '../lib/feathersClient';
import ErrorPopup from './ErrorPopup';

const modalStyles = {
  overlay: {
    zIndex: 100,
  },
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

Modal.setAppElement('#root');

class ChangeReviewer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: '',
      loading: false,
      reviewers: [],
    };
    this.submit = this.submit.bind(this);
  }

  componentDidMount() {
    this.getReviewers();
  }

  getReviewers() {
    return feathersClient
      .service('/users')
      .find({
        query: {
          email: { $exists: true },
          $select: ['_id', 'name', 'address'],
        },
      })
      .then(response =>
        this.setState({
          reviewers: response.data.map(reviewer => ({
            value: reviewer.address,
            title: `${reviewer.name ? reviewer.name : 'Anonymous user'} - ${reviewer.address}`,
          })),
        }),
      )
      .catch(error =>
        ErrorPopup(
          'Unable to load campaign reviewers. Please refresh the page and try again',
          error,
        ),
      );
  }

  submit() {
    this.setState({ loading: true });
  }

  render() {
    const { onCloseClicked, isOpen } = this.props;
    const { error, loading, reviewers } = this.state;
    return (
      <Modal isOpen={isOpen} onRequestClose={onCloseClicked} style={modalStyles}>
        <center>
          <h2>Select New Reviewer</h2>
          <ChangeReviewerForm
            submit={this.submit}
            error={error}
            loading={loading}
            reviewers={reviewers}
            buttonText="Change Reviewer"
          />
        </center>
      </Modal>
    );
  }
}

ChangeReviewer.propTypes = {
  onCloseClicked: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
};

export default withRouter(ChangeReviewer);
