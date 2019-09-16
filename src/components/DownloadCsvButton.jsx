/* eslint-disable no-restricted-globals */
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import 'react-rangeslider/lib/index.css';

import Campaign from 'models/Campaign';

import CampaignCsvService from '../services/CampaignCsvService';
import { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';
import { Consumer as WhiteListConsumer } from '../contextProviders/WhiteListProvider';
/**
 * Retrieves the oldest 100 donations that the user can delegate
 *
 */

function buildURI(res, filename) {
  const data = new Blob([res], { type: 'text/csv' });
  const csvURL = window.URL.createObjectURL(data);
  const tempLink = document.createElement('a');
  tempLink.href = csvURL;
  tempLink.setAttribute('download', filename);
  tempLink.click();
}
class DownloadCsvButton extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {}

  generateCsv() {
    CampaignCsvService.get(this.props.campaign.id).then(res => {
      buildURI(res, `${this.props.campaign.id}.csv`);
    });
  }

  render() {
    const style = { display: 'inline-block', ...this.props.style };

    return (
      <span style={style}>
        {
          <button type="button" className="btn btn-warning" onClick={() => this.generateCsv()}>
            Download CSV
          </button>
        }
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

export default props => (
  <WhiteListConsumer>
    {() => <Web3Consumer>{() => <DownloadCsvButton {...props} />}</Web3Consumer>}
  </WhiteListConsumer>
);
