import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { getTruncatedText, history } from '../lib/helpers';
import CardStats from './CardStats';
import DAC from '../models/DAC';

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

    return (
      <div
        className="card overview-card"
        id={dac.id}
        onKeyPress={this.viewDAC}
        role="button"
        tabIndex="0"
      >
        <a className="card-body" href={this.createDACLink()}>
          <div className="card-img" style={{ backgroundImage: `url(${dac.image})` }} />

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
        </a>
      </div>
    );
  }
}

DacCard.propTypes = {
  dac: PropTypes.instanceOf(DAC).isRequired,
};

DacCard.defaultProps = {};

export default DacCard;
