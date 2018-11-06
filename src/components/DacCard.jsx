import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { utils } from 'web3';

import { getTruncatedText } from '../lib/helpers';
import CardStats from './CardStats';
import { checkBalance } from '../lib/middleware';
import DAC from '../models/DAC';

/**
 * DAC Card visible in the DACs view.
 *
 * @param currentUser  Currently logged in user information
 * @param history      Browser history object
 * @param balance      User's current balance
 */
class DacCard extends Component {
  constructor(props) {
    super(props);

    this.viewDAC = this.viewDAC.bind(this);
    this.editDAC = this.editDAC.bind(this);
  }

  viewDAC() {
    this.props.history.push(`/dacs/${this.props.dac.id}`);
  }

  editDAC(e) {
    e.stopPropagation();

    checkBalance(this.props.balance)
      .then(() => {
        React.swal({
          title: 'Edit Community?',
          text: 'Are you sure you want to edit the description of this Community?',
          icon: 'warning',
          buttons: ['Cancel', 'Yes, edit'],
          dangerMode: true,
        }).then(isConfirmed => {
          if (isConfirmed) {
            this.props.history.push(`/dacs/${this.props.dac.id}/edit`);
          }
        });
      })
      .catch(err => {
        if (err === 'noBalance') {
          // handle no balance error
        }
      });
  }

  render() {
    const { dac } = this.props;

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
          <div className="card-img" style={{ backgroundImage: `url(${dac.image})` }} />

          <div className="card-content">
            <h4 className="card-title">{getTruncatedText(dac.title, 30)}</h4>
            <div className="card-text">{dac.summary}</div>
          </div>

          <div className="card-footer">
            <CardStats
              type="dac"
              peopleCount={dac.peopleCount}
              totalDonated={dac.totalDonated}
              currentBalance={dac.currentBalance}
            />
          </div>
        </div>
      </div>
    );
  }
}

DacCard.propTypes = {
  dac: PropTypes.instanceOf(DAC).isRequired,
  balance: PropTypes.objectOf(utils.BN).isRequired,
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
};

DacCard.defaultProps = {};

export default DacCard;
