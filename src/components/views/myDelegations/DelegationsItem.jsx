import moment from 'moment';
import { Link } from 'react-router-dom';
import Avatar from 'react-avatar';
import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import Donation from '../../../models/Donation';
import DelegateButton from './DelegateButton';
import config from '../../../configuration';
import { convertEthHelper, getUserAvatar, getUserName } from '../../../lib/helpers';
import { Context as UserContext } from '../../../contextProviders/UserProvider';
import { Context as Web3Provider } from '../../../contextProviders/Web3Provider';
import { Trace } from '../../../models';
import Campaign from '../../../models/Campaign';
import BridgedTrace from '../../../models/BridgedTrace';
import LPPCappedTrace from '../../../models/LPPCappedTrace';
import LPTrace from '../../../models/LPTrace';

function DelegationsItem({ campaigns, donation, traces }) {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { balance, isForeignNetwork, web3 },
  } = useContext(Web3Provider);

  return (
    <tr>
      <td className="td-actions">
        {/* When donated to a community, allow delegation
                                    to campaigns and traces */}
        {(donation.delegateId > 0 ||
          (currentUser.address && donation.ownerTypeId === currentUser.address)) &&
          isForeignNetwork &&
          donation.status === Donation.WAITING &&
          donation.amountRemaining > 0 && (
            <DelegateButton
              web3={web3}
              types={campaigns.concat(traces)}
              donation={donation}
              balance={balance}
              currentUser={currentUser}
              symbol={(donation.token && donation.token.symbol) || config.nativeTokenName}
            />
          )}

        {/* When donated to a campaign, only allow delegation
                                      to traces of that campaign */}
        {donation.ownerType === 'campaign' &&
          isForeignNetwork &&
          donation.status === Donation.COMMITTED &&
          donation.amountRemaining > 0 && (
            <DelegateButton
              web3={web3}
              types={traces.filter(
                m =>
                  m.campaignId === donation.ownerTypeId &&
                  (!m.acceptsSingleToken || m.token.symbol === donation.token.symbol),
              )}
              donation={donation}
              balance={balance}
              currentUser={currentUser}
              traceOnly
            />
          )}
      </td>

      <td className="td-date">{moment(donation.createdAt).format('MM/DD/YYYY')}</td>

      <td className="td-donated-to">
        <Link to={donation.donatedTo.url}>
          {donation.donatedTo.type} <em>{donation.donatedTo.name}</em>
        </Link>
      </td>
      <td className="td-donations-amount">
        {donation.isPending && (
          <span>
            <i className="fa fa-circle-o-notch fa-spin" />
            &nbsp;
          </span>
        )}
        {convertEthHelper(donation.amountRemaining, donation.token && donation.token.decimals)}{' '}
        {(donation.token && donation.token.symbol) || config.nativeTokenName}
      </td>
      <td className="td-user">
        <Link to={`profile/${donation.giverAddress}`}>
          <Avatar size={30} src={getUserAvatar(donation.giver)} round className="mr-2" />
          {getUserName(donation.giver)}
        </Link>
      </td>
      <td className="td-tx-address">{donation.giverAddress}</td>
      <td className="td-status">{donation.statusDescription}</td>
    </tr>
  );
}

DelegationsItem.propTypes = {
  donation: PropTypes.instanceOf(Donation).isRequired,
  traces: PropTypes.arrayOf(
    PropTypes.oneOfType([Trace, BridgedTrace, LPPCappedTrace, LPTrace].map(PropTypes.instanceOf)),
  ).isRequired,
  campaigns: PropTypes.arrayOf(PropTypes.instanceOf(Campaign)).isRequired,
};

export default React.memo(DelegationsItem);
