import React, { Component, Fragment } from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import DonationService from '../services/DonationService';
import DonationHistory from './DonationHistory';
import Donation from '../models/Donation';
import { convertEthHelper } from '../lib/helpers';
import config from '../configuration';

class DonationItem extends Component {
  constructor(props) {
    super(props);

    this.state = {
      itemType: null, // Delegated ro Directly donated
    };
    this.setItemType = this.setItemType.bind(this);
  }

  componentDidMount() {
    this.loadHistory();
  }

  setItemType(type) {
    this.setState({
      itemType: type,
    });
  }

  async loadCommittedParents(historyItem) {
    const parents = await DonationService.getDonationNextCommittedParents(
      historyItem.parentIds,
      historyItem,
    );
    if (parents.length > 0) {
      historyItem.parents = parents.map(d => DonationHistory.createHistoryItem(d));
      await Promise.all(historyItem.parents.map(item => this.loadCommittedParents(item)));
    }
  }

  async loadHistory() {
    const { donation } = this.props;
    const root = DonationHistory.createHistoryItem(donation);

    await this.loadCommittedParents(root);
    const { parents } = root;

    if (donation.status === Donation.COMMITTED) {
      if (parents.length > 0) {
        this.setItemType('delegated');
      } else {
        this.setItemType('direct');
      }
    } else if (parents.length > 0) {
      if (parents[0].parents.length > 0) {
        this.setItemType('delegated');
      } else {
        this.setItemType('direct');
      }
    }
  }

  render() {
    const { showDetails, donation, useAmountRemaining } = this.props;

    let typeLabel;
    switch (this.state.itemType) {
      case 'delegated':
        typeLabel = (
          <span className="badge ">
            <i className="fa fa-random " />
            Delegated
          </span>
        );
        break;
      case 'direct':
        typeLabel = (
          <span className="badge ">
            <i className="fa fa-long-arrow-right" />
            Direct
          </span>
        );
        break;
      default:
        typeLabel = null;
    }

    return (
      <Fragment>
        {showDetails && (
          <tr key={donation._id} className="donation-item">
            <td>&nbsp;</td>
            <td className="td-date">
              <span>{moment(donation.createdAt).format('MM/DD/YYYY')}</span>
            </td>
            <td className="td-donations-amount">
              <span>
                {donation.isPending && (
                  <span>
                    <i className="fa fa-circle-o-notch fa-spin" />
                    &nbsp;
                  </span>
                )}
                {convertEthHelper(
                  useAmountRemaining ? donation.amountRemaining : donation.amount,
                  donation.token && donation.token.decimals,
                )}{' '}
                {(donation.token && donation.token.symbol) || config.nativeTokenName}
              </span>
            </td>
            <td>${donation.usdValue}</td>
            <td className="td-donation-status">{typeLabel}</td>
            <td />
          </tr>
        )}
      </Fragment>
    );
  }
}
export default DonationItem;

DonationItem.propTypes = {
  aggregatedDonation: PropTypes.shape({
    txHash: PropTypes.string,
    homeTxHash: PropTypes.string,
  }).isRequired,
  donation: PropTypes.instanceOf(Donation).isRequired,
  useAmountRemaining: PropTypes.bool.isRequired,
  showDetails: PropTypes.bool.isRequired,
};
