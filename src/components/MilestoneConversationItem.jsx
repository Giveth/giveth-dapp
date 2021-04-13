import Avatar from 'react-avatar';
import moment from 'moment';
import ReactHtmlParser from 'react-html-parser';
import { Form } from 'formsy-react-components';
import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { utils } from 'web3';
import { Link } from 'react-router-dom';
import MilestoneProof from './MilestoneProof';
import MilestoneConversationAction from './MilestoneConversationAction';
import { convertEthHelper, getUserAvatar, getUserName } from '../lib/helpers';
import Milestone from '../models/Milestone';
import config from '../configuration';

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
  const { messageContext, ownerAddress } = conversation;
  let { owner } = conversation;
  owner = owner || { address: ownerAddress };
  const userName = getUserName(owner);
  const userLink = owner && <Link to={`/profile/${owner.address}`}>{userName}</Link>;

  if (messageContext === 'proposed') return <Fragment>{userLink} proposed Milestone</Fragment>;
  if (messageContext === 'rejected') return <Fragment>{userLink} rejected completion</Fragment>;
  if (messageContext === 'NeedsReview') return <Fragment>{userLink} requested review</Fragment>;
  if (messageContext === 'Completed') return <Fragment>{userLink} accepted completion</Fragment>;
  if (messageContext === 'Canceled') return <Fragment>{userLink} canceled Milestone</Fragment>;
  if (messageContext === 'proposedRejected')
    return <Fragment>{userLink} rejected proposed Milestone</Fragment>;
  if (messageContext === 'proposedAccepted')
    return <Fragment>{userLink} accepted proposed Milestone</Fragment>;
  if (messageContext === 'archived') return <Fragment>{userLink} archived Milestone</Fragment>;
  if (messageContext === 'rePropose') return <Fragment>{userLink} re-proposed Milestone</Fragment>;
  if (messageContext === 'comment') return <Fragment>{userLink} wrote:</Fragment>;
  if (messageContext === 'payment') {
    const { recipient, payments } = conversation;
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
      if (donorType === 'dac') {
        return (
          <React.Fragment>
            <Link to={`/dacs/${donorId}`}>{donorTitle || 'Unknown'}</Link>
            {` DAC delegated ${paymentsStr}`}
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

function MilestoneConversationItem({ conversation, milestone, isAmountEnoughForWithdraw }) {
  if (!conversation) return null;
  const {
    txHash,
    messageContext,
    message,
    performedByRole,
    createdAt,
    items,
    owner,
  } = conversation;

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

        {items && items.length > 0 && (
          <Form className="items-form">
            <strong>Attachments</strong>
            <MilestoneProof
              refreshList={items}
              token={milestone.token}
              isEditMode={false}
              milestoneStatus={milestone.status}
            />
          </Form>
        )}

        {/* ---- action buttons ---- */}
        <div className="c-action-footer">
          <MilestoneConversationAction
            messageContext={messageContext}
            milestone={milestone}
            isAmountEnoughForWithdraw={isAmountEnoughForWithdraw}
          />
        </div>

        <div className="c-divider" />
      </div>
    </div>
  );
}

MilestoneConversationItem.propTypes = {
  milestone: PropTypes.instanceOf(Milestone).isRequired,
  conversation: PropTypes.instanceOf(Object).isRequired,
  isAmountEnoughForWithdraw: PropTypes.bool.isRequired,
};

export default React.memo(MilestoneConversationItem);
