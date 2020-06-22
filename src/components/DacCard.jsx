import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { getTruncatedText, history } from '../lib/helpers';
import CardStats from './CardStats';
import DAC from '../models/DAC';
import GivethLogo from '../assets/logo.svg';

/**
 * DAC Card visible in the DACs view.
 *
 * @param currentUser  Currently logged in user information
 */
class DacCard extends Component {
  constructor(props) {
    super(props);

    this.viewDAC = this.viewDAC.bind(this);
    this.createDACLink = this.createDACLink.bind(this);
  }

  viewDAC() {
    history.push(`/dacs/${this.props.dac.id}`);
  }

  createDACLink() {
    return `/dacs/${this.props.dac.id}`;
  }

  render() {
    const { dac } = this.props;
    const colors = ['#76318f', '#50b0cf', '#1a1588', '#2A6813', '#95d114', '#155388', '#604a7d'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    return (
      <div
        className="card overview-card"
        id={dac.id}
        onKeyPress={this.viewDAC}
        role="button"
        tabIndex="0"
      >
        <Link className="card-body" to={this.createDACLink()}>
          <div
            className="card-img"
            style={{
              backgroundColor: dac.image ? 'white' : color,
              backgroundImage: `url(${dac.image || GivethLogo})`,
            }}
          />

          <div className="card-content">
            <h4 className="card-title">{getTruncatedText(dac.title, 30)}</h4>
            <div className="card-text">{dac.summary}</div>
          </div>

          <div className="card-footer">
            <CardStats
              type="dac"
              peopleCount={dac.peopleCount}
              totalDonated={dac.totalDonationCount}
              currentBalance={dac.currentBalance}
            />
          </div>
        </Link>
      </div>
    );
  }
}

DacCard.propTypes = {
  dac: PropTypes.instanceOf(DAC).isRequired,
};

DacCard.defaultProps = {};

export default DacCard;
