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

const getReadableMessageContext = conversation => {
  const { messageContext, owner } = conversation;
  const userName = getUserName(owner);
  const userLink = <Link to={`/profile/${owner.address}`}>{userName}</Link>;

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
      const paymentsStr = payments.map(p => {
        const amountStr = convertEthHelper(utils.fromWei(p.amount), p.tokenDecimals);
        return `${amountStr} ${p.symbol}`;
      });
      const phrase =
        paymentsStr.length === 1
          ? paymentsStr[0]
          : `${paymentsStr.slice(0, -1).join(', ')} and ${paymentsStr[paymentsStr.length - 1]}`;
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
      const payment = payments[0];
      const amountStr = convertEthHelper(utils.fromWei(payment.amount), payment.tokenDecimals);
      const paymentStr = `${amountStr} ${payment.symbol}`;
      return (
        <Fragment>
          <Link to={`/profile/${donorId}`}>{donorTitle || 'Anonymous'}</Link>
          {` donated ${paymentStr}`}
        </Fragment>
      );
    }
  }
  if (messageContext === 'delegated') {
    const { donorType, donorId, donorTitle, payments } = conversation;
    if (payments && payments.length > 0) {
      const payment = payments[0];
      const amountStr = convertEthHelper(utils.fromWei(payment.amount), payment.tokenDecimals);
      const paymentStr = `${amountStr} ${payment.symbol}`;

      if (donorType === 'campaign') {
        return (
          <React.Fragment>
            <Link to={`/campaigns/${donorId}`}>{donorTitle || 'Unknown'}</Link>
            {` Campaign delegated ${paymentStr}`}
          </React.Fragment>
        );
      }
      if (donorType === 'dac') {
        return (
          <React.Fragment>
            <Link to={`/dacs/${donorId}`}>{donorTitle || 'Unknown'}</Link>
            {` DAC delegated ${paymentStr}`}
          </React.Fragment>
        );
      }
      if (donorType === 'giver') {
        return (
          <React.Fragment>
            <Link to={`/profile/${donorId}`}>{donorTitle || 'Anonymous'}</Link>
            {` delegated ${paymentStr}`}
          </React.Fragment>
        );
      }
    }
  }
  return 'unknown';
};

const getEtherScanUrl = ({ messageContext }) =>
  messageContext === 'donated' ? config.homeEtherscan : config.etherscan;

function MilestoneConversationItem({ conversation, milestone }) {
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
          <MilestoneConversationAction messageContext={messageContext} milestone={milestone} />
        </div>

        <div className="c-divider" />
      </div>
    </div>
  );
}

MilestoneConversationItem.propTypes = {
  milestone: PropTypes.instanceOf(Milestone).isRequired,
  conversation: PropTypes.instanceOf(Object).isRequired,
};

export default React.memo(MilestoneConversationItem);
