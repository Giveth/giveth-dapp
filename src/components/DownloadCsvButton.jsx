/* eslint-disable no-restricted-globals */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Campaign from 'models/Campaign';
import config from '../configuration';

class DownloadCsvButton extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    const style = { display: 'inline-block', ...this.props.style };

    return (
      <span style={style}>
        <a
          href={`${config.feathersConnection}/campaigncsv/${this.props.campaign.id}`}
          type="button"
          className="btn btn-warning"
          download={`${this.props.campaign.id}.csv`}
        >
          Download CSV
        </a>
      </span>
    );
  }
}

DownloadCsvButton.propTypes = {
  campaign: PropTypes.instanceOf(Campaign),
  style: PropTypes.shape(),
};

DownloadCsvButton.defaultProps = {
  campaign: undefined,
  style: {},
};

export default DownloadCsvButton;
