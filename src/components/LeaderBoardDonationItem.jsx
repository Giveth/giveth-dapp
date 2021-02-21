import React, { Fragment } from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import Donation from '../models/Donation';
import { convertEthHelper } from '../lib/helpers';
import config from '../configuration';

function LeaderBoardDonationItem(props) {
  const { showDetails, donation, useAmountRemaining } = props;

  let typeLabel;
  if (!donation.homeTxHash) {
    typeLabel = (
      <span className="badge ">
        <i className="fa fa-random " />
        Delegated
      </span>
    );
  } else {
    typeLabel = (
      <span className="badge ">
        <i className="fa fa-long-arrow-right" />
        Direct
      </span>
    );
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
          <td>{donation.comment}</td>
        </tr>
      )}
    </Fragment>
  );
}

export default LeaderBoardDonationItem;

LeaderBoardDonationItem.propTypes = {
  aggregatedDonation: PropTypes.shape({
    txHash: PropTypes.string,
    homeTxHash: PropTypes.string,
  }).isRequired,
  donation: PropTypes.instanceOf(Donation).isRequired,
  useAmountRemaining: PropTypes.bool.isRequired,
  showDetails: PropTypes.bool.isRequired,
};
