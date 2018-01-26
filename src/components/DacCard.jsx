import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Avatar from 'react-avatar';

import {
  getTruncatedText,
  getUserAvatar,
  isOwner,
  getUserName,
} from './../lib/helpers';
import CardStats from './CardStats';
import User from './../models/User';
import {
  redirectAfterWalletUnlock,
  checkWalletBalance,
} from './../lib/middleware';
import GivethWallet from '../lib/blockchain/GivethWallet';
import DAC from '../models/DAC';

/**
 * DAC Card visible in the DACs view.
 *
 * @param currentUser  Currently logged in user information
 * @param history      Browser history object
 * @param wallet       Wallet object with the balance and all keystores
 */
class DacCard extends Component {
  constructor(props) {
    super(props);

    this.viewProfile = this.viewProfile.bind(this);
    this.viewDAC = this.viewDAC.bind(this);
    this.editDAC = this.editDAC.bind(this);
  }

  viewProfile(e) {
    e.stopPropagation();
    this.props.history.push(`/profile/${this.props.dac.owner.address}`);
  }

  viewDAC() {
    this.props.history.push(`/dacs/${this.props.dac.id}`);
  }

  editDAC(e) {
    e.stopPropagation();

    checkWalletBalance(this.props.wallet, this.props.history).then(() => {
      React.swal({
        title: 'Edit Community?',
        text:
          'Are you sure you want to edit the description of this Community?',
        icon: 'warning',
        buttons: ['Cancel', 'Yes, edit'],
        dangerMode: true,
      }).then(isConfirmed => {
        if (isConfirmed) {
          redirectAfterWalletUnlock(
            `/dacs/${this.props.dac.id}/edit`,
            this.props.wallet,
            this.props.history,
          );
        }
      });
    });
  }

  render() {
    const { dac, currentUser } = this.props;

    return (
      <div
        className="card overview-card"
        id={dac.id}
        onClick={this.viewDAC}
        onKeyPress={this.viewDAC}
        role="button"
        tabIndex="0"
      >
        <div className="card-body">
          <div
            className="card-avatar"
            onClick={this.viewProfile}
            onKeyPress={this.viewProfile}
            role="button"
            tabIndex="0"
          >
            <Avatar size={30} src={getUserAvatar(dac.owner)} round />
            <span className="owner-name">{getUserName(dac.owner)}</span>

            {isOwner(dac.owner.address, currentUser) && (
              <span className="pull-right">
                <button
                  className="btn btn-link btn-edit"
                  onClick={e => this.editDAC(e)}
                >
                  <i className="fa fa-edit" />
                </button>
              </span>
            )}
          </div>

          <div
            className="card-img"
            style={{ backgroundImage: `url(${dac.image})` }}
          />

          <div className="card-content">
            <h4 className="card-title">{getTruncatedText(dac.title, 30)}</h4>
            <div className="card-text">{dac.summary}</div>
          </div>

          <div className="card-footer">
            <CardStats
              type="dac"
              peopleCount={dac.peopleCount}
              totalDonated={dac.totalDonated}
              campaignsCount={dac.campaignsCount}
            />
          </div>
        </div>
      </div>
    );
  }
}

DacCard.propTypes = {
  dac: PropTypes.instanceOf(DAC).isRequired,
  currentUser: PropTypes.instanceOf(User),
  wallet: PropTypes.instanceOf(GivethWallet),
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
};

DacCard.defaultProps = {
  currentUser: undefined,
  wallet: undefined,
};

export default DacCard;
