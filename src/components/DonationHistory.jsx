import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import config from 'configuration';
import { Link } from 'react-router-dom';
import Donation from '../models/Donation';
import DonationService from '../services/DonationService';
import { getUserName, convertEthHelper, getTruncatedText } from '../lib/helpers';

class DonationHistory extends Component {
  static createHistoryItem(donation) {
    return {
      id: donation._id,
      status: donation._status,
      amount: donation._amount,
      ownerType: donation._ownerType,
      ownerEntity: donation._ownerEntity,
      delegateType: donation._delegateType,
      delegateEntity: donation._delegateEntity,
      createdAt: donation._createdAt,
      parentIds: donation._parentDonations,
      donatedTo: donation.donatedTo,
      parents: [],
    };
  }

  static generateEntityLink(type, entity) {
    switch (type) {
      case 'giver':
        return (
          <Link to={`/profile/${entity.address}`}>
            <span>{getUserName(entity)}</span>
          </Link>
        );
      case 'campaign':
        return <Link to={`/campaigns/${entity._id}`}>{getTruncatedText(entity.title, 45)}</Link>;
      case 'dac':
        return <Link to={`/dacs/${entity._id}`}>{getTruncatedText(entity.title, 45)}</Link>;
      default:
        return null;
    }
  }

  constructor(props) {
    super(props);

    this.state = {
      parentsLoaded: false,
      parents: undefined,
    };
  }

  componentDidMount() {
    this.loadHistory();
  }

  async loadCommittedParents(historyItem) {
    const parents = await DonationService.getDonationNextCommittedParents(historyItem.parentIds);
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

    if (parents.length > 0) {
      this.props.setItemHasHistory(true);
      if (parents[0].parents.length > 0) {
        this.props.setItemType('delegated');
      } else {
        this.props.setItemType('direct');
      }
    }

    if (donation.status === Donation.COMMITTED) {
      if (parents.length > 0) {
        this.props.setItemHasHistory(true);
        this.props.setItemType('delegated');
      } else {
        this.props.setItemType('direct');
      }
    } else if (parents.length > 0) {
      this.props.setItemHasHistory(true);
      if (parents[0].parents.length > 0) {
        this.props.setItemType('delegated');
      } else {
        this.props.setItemType('direct');
      }
    }

    this.setState({
      parentsLoaded: true,
      parents,
    });
  }

  renderHistory(item) {
    const hasParents = item.parents.length > 0;

    const { donation } = this.props;
    let message;
    const link = item.delegateEntity ? (
      DonationHistory.generateEntityLink(item.delegateType, item.delegateEntity)
    ) : (
      <Link to={item.donatedTo.url}>{item.donatedTo.name}</Link>
    );
    if (hasParents) {
      message = (
        <Fragment>
          <span> delegated to </span>
          {link}
        </Fragment>
      );
    } else {
      message = (
        <Fragment>
          <span> donated to </span>
          {link}
        </Fragment>
      );
    }

    return (
      <li key={item.id}>
        <span>
          {moment(item.createdAt).format('MM/DD/YYYY')}{' '}
          {convertEthHelper(item.amount, item.decimals)}{' '}
          {(donation.token && donation.token.symbol) || config.nativeTokenName}{' '}
        </span>
        {message}
        {hasParents && <ul>{item.parents.map(p => this.renderHistory(p))}</ul>}
      </li>
    );
  }

  render() {
    if (this.state.parentsLoaded) {
      return (
        <ul className="donation-history">{this.state.parents.map(p => this.renderHistory(p))}</ul>
      );
    }
    return (
      <div className="text-center">
        <div className="spinner-grow text-info" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }
}

export default DonationHistory;

DonationHistory.propTypes = {
  donation: PropTypes.instanceOf(Donation).isRequired,
  setItemType: PropTypes.func,
  setItemHasHistory: PropTypes.func,
};

DonationHistory.defaultProps = {
  setItemType: () => {},
  setItemHasHistory: () => {},
};
