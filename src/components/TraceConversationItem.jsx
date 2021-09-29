import Avatar from 'react-avatar';
import moment from 'moment';
import ReactHtmlParser from 'react-html-parser';
import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { utils } from 'web3';
import { Link } from 'react-router-dom';
import TraceConversationAction from './TraceConversationAction';
import { convertEthHelper, getUserAvatar, getUserName } from '../lib/helpers';
import Trace from '../models/Trace';
import config from '../configuration';
import BridgedTrace from '../models/BridgedTrace';
import LPPCappedTrace from '../models/LPPCappedTrace';
import LPTrace from '../models/LPTrace';

const getPaymentsStr = payments => {
  let phrase = '';

  const getSinglePaymentStr = ({ amount, tokenDecimals, symbol }) => {
    const amountStr = convertEthHelper(utils.fromWei(amount), tokenDecimals);
    return `${amountStr} ${symbol}`;
  };

  if (payments) {
    const paymentsStr = payments.map(getSinglePaymentStr);
    phrase =
      paymentsStr.length === 1
        ? paymentsStr[0]
        : `${paymentsStr.slice(0, -1).join(', ')} and ${paymentsStr[paymentsStr.length - 1]}`;
  }
  return phrase;
};

const getReadableMessageContext = conversation => {
  const { messageContext, ownerAddress, recipientAddress } = conversation;
  let { owner, recipient } = conversation;
  owner = owner || { address: ownerAddress };
  recipient = recipient || { address: recipientAddress };
  const userName = getUserName(owner);
  const userLink = <Link to={`/profile/${owner.address}`}>{userName}</Link>;

  if (messageContext === 'proposed') return <Fragment>{userLink} proposed Trace</Fragment>;
  if (messageContext === 'rejected') return <Fragment>{userLink} rejected completion</Fragment>;
  if (messageContext === 'NeedsReview') return <Fragment>{userLink} requested review</Fragment>;
  if (messageContext === 'Completed') return <Fragment>{userLink} accepted completion</Fragment>;
  if (messageContext === 'Canceled') return <Fragment>{userLink} canceled Trace</Fragment>;
  if (messageContext === 'proposedRejected')
    return <Fragment>{userLink} rejected proposed Trace</Fragment>;
  if (messageContext === 'proposedAccepted')
    return <Fragment>{userLink} accepted proposed Trace</Fragment>;
  if (messageContext === 'archived') return <Fragment>{userLink} archived Trace</Fragment>;
  if (messageContext === 'rePropose') return <Fragment>{userLink} re-proposed Trace</Fragment>;
  if (messageContext === 'comment') return <Fragment>{userLink} wrote:</Fragment>;
  if (messageContext === 'payment') {
    const { payments } = conversation;
    if (payments) {
      const phrase = getPaymentsStr(payments);
      if (owner && recipient && owner.address === recipient.address) {
        return (
          <Fragment>
            {userLink} collected {phrase}
          </Fragment>
        );
      }
      // else
      return (
        <Fragment>
          {userLink} disbursed {phrase} to{' '}
          <Link to={`/profile/${recipient.address}`}>{getUserName(recipient)}</Link>
        </Fragment>
      );
    }
  }
  if (messageContext === 'donated') {
    const { donorType, donorId, donorTitle, payments } = conversation;
    if (donorType === 'giver' && payments && payments.length > 0) {
      const paymentsStr = getPaymentsStr(payments);
      return (
        <Fragment>
          <Link to={`/profile/${donorId}`}>{donorTitle || 'Anonymous'}</Link>
          {` donated ${paymentsStr}`}
        </Fragment>
      );
    }
  }
  if (messageContext === 'payout') {
    const { payments } = conversation;
    const paymentsStr = getPaymentsStr(payments);
    return (
      <Fragment>
        {/* <Link to={`/profile/${donorId}`}>{donorTitle || 'Anonymous'}</Link> */}
        {`${paymentsStr} has been sent to recipient's wallet`}
      </Fragment>
    );
  }
  if (messageContext === 'recipientChanged') {
    const recipientLink = (
      <Link to={`/profile/${recipient.address}`}>{recipient.name || recipient.address}</Link>
    );
    return (
      <Fragment>
        {/* <Link to={`/profile/${donorId}`}>{donorTitle || 'Anonymous'}</Link> */}
        {userLink} has changed recipient to {recipientLink}
      </Fragment>
    );
  }
  if (messageContext === 'delegated') {
    const { donorType, donorId, donorTitle, payments } = conversation;
    if (payments && payments.length > 0) {
      const paymentsStr = getPaymentsStr(payments);

      if (donorType === 'campaign') {
        return (
          <React.Fragment>
            <Link to={`/campaigns/${donorId}`}>{donorTitle || 'Unknown'}</Link>
            {` Campaign delegated ${paymentsStr}`}
          </React.Fragment>
        );
      }
      if (donorType === 'community') {
        return (
          <React.Fragment>
            <Link to={`/communities/${donorId}`}>{donorTitle || 'Unknown'}</Link>
            {` Community delegated ${paymentsStr}`}
          </React.Fragment>
        );
      }
      if (donorType === 'giver') {
        return (
          <React.Fragment>
            <Link to={`/profile/${donorId}`}>{donorTitle || 'Anonymous'}</Link>
            {` delegated ${paymentsStr}`}
          </React.Fragment>
        );
      }
    }
  }
  return 'unknown';
};

const getEtherScanUrl = ({ messageContext }) =>
  messageContext === 'donated' || messageContext === 'payout'
    ? config.homeEtherscan
    : config.etherscan;

function TraceConversationItem({
  conversation,
  trace,
  isAmountEnoughForWithdraw,
  withdrawalTokens,
}) {
  if (!conversation) return null;
  const { txHash, messageContext, message, performedByRole, createdAt, owner } = conversation;

  return (
    <div>
      <Avatar size={30} src={getUserAvatar(owner)} round />
      <div className="content-wrapper">
        <div className="c-timestamp">
          {moment(createdAt).format('Do MMM YYYY - HH:mm a')}

          {txHash && (
            <a
              className="c-tx-hash"
              href={`${getEtherScanUrl(conversation)}tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View transaction
            </a>
          )}
        </div>

        <p className="badge badge-secondary">{performedByRole}</p>

        <p className={`owner-name ${messageContext.toLowerCase()}`}>
          {getReadableMessageContext(conversation)}
          {/* <span className={`badge ${c.messageContext.toLowerCase()}`}>{c.messageContext}</span> */}
        </p>
        <div className="c-message">{ReactHtmlParser(message)}</div>

        {/* ---- action buttons ---- */}
        <div className="c-action-footer">
          <TraceConversationAction
            messageContext={messageContext}
            trace={trace}
            isAmountEnoughForWithdraw={isAmountEnoughForWithdraw}
            withdrawalTokens={withdrawalTokens}
          />
        </div>

        <div className="c-divider" />
      </div>
    </div>
  );
}

TraceConversationItem.propTypes = {
  trace: PropTypes.oneOfType(
    [Trace, BridgedTrace, LPPCappedTrace, LPTrace].map(PropTypes.instanceOf),
  ).isRequired,
  conversation: PropTypes.instanceOf(Object).isRequired,
  isAmountEnoughForWithdraw: PropTypes.bool.isRequired,
  withdrawalTokens: PropTypes.arrayOf(PropTypes.shape({})),
};

TraceConversationItem.defaultProps = {
  withdrawalTokens: [],
};

export default React.memo(TraceConversationItem);
