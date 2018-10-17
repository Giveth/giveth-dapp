import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import Modal from 'react-modal';

import CampaignService from '../services/CampaignService';

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
      campaign: {},
      reviewers: [],
    };
    this.submit = this.submit.bind(this);
  }

  componentDidMount() {
    const id = this.props.location.pathname.split('/')[2];
    CampaignService.get(id)
      .then(campaign => {
        this.setState({ campaign });
        this.getReviewers();
      })
      .catch(err =>
        ErrorPopup('Something went wrong loading campaign. Please try refresh the page.', err),
      );
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

  submit(newReviewerAddress) {
    this.setState({ loading: true });
    const afterMined = url => {
      if (url) {
        const msg = (
          <p>
            Your Request has been submitted!
            <br />
            <a href={url} target="_blank" rel="noopener noreferrer">
              View transaction
            </a>
          </p>
        );
        React.toast.success(msg);
      } else {
        if (this.mounted) this.setState({ loading: false });
        React.toast.success('Your Request has been submitted!');
      }
    };

    const afterCreate = (url /** id */) => {
      if (this.mounted) this.setState({ loading: false });
      const msg = (
        <p>
          Your Request is pending....
          <br />
          <a href={url} target="_blank" rel="noopener noreferrer">
            View transaction
          </a>
        </p>
      );
      React.toast.info(msg);
    };

    this.setState(
      {
        loading: true,
      },
      () => {
        // Change the reviewer
        this.state.campaign.changeReviewer(newReviewerAddress, afterCreate, afterMined);
      },
    );
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
  location: PropTypes.objectOf.isRequired,
};

export default withRouter(ChangeReviewer);
