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
    console.log('root:', root);
    this.setState({
      parentsLoaded: true,
      parents: root.parents,
    });
  }

  renderHistory(item) {
    const hasParents = item.parents.length > 0;

    const { donation } = this.props;
    let message;
    if (item.delegateType !== undefined) {
      message = (
        <Fragment>
          <span> delegated to </span>
          {DonationHistory.generateEntityLink(item.delegateType, item.delegateEntity)}
          <span> by </span>
          {DonationHistory.generateEntityLink(item.ownerType, item.ownerEntity)}
        </Fragment>
      );
    } else if (item.ownerType !== 'milestone') {
      message = (
        <Fragment>
          {DonationHistory.generateEntityLink(item.ownerType, item.ownerEntity)}
          <span> delegated to milestone</span>
        </Fragment>
      );
    } else if (hasParents) {
      message = <span> committed to milestone.</span>;
    } else {
      message = <span> directly donated to milestone.</span>;
    }

    return (
      <li>
        <span>
          {moment(item.createdAt).format('MM/DD/YYYY')} {convertEthHelper(item.amount)}{' '}
          {(donation.token && donation.token.symbol) || config.nativeTokenName}{' '}
        </span>
        {message}
        {hasParents && <ul>{item.parents.map(p => this.renderHistory(p))}</ul>}
      </li>
    );
  }

  render() {
    if (this.state.parentsLoaded) {
      console.log(this.state.parents);
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
};
