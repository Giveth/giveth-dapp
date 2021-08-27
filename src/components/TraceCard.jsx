import React, { useCallback, useContext } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import Avatar from 'react-avatar';

import Trace from 'models/Trace';
import { getTruncatedText, getUserAvatar, getUserName, history } from '../lib/helpers';
import { checkBalance } from '../lib/middleware';
import CardStats from './CardStats';
import GivethLogo from '../assets/logo.svg';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';
import BridgedTrace from '../models/BridgedTrace';
import LPPCappedTrace from '../models/LPPCappedTrace';
import LPTrace from '../models/LPTrace';
import ErrorHandler from '../lib/ErrorHandler';

/**
 * A single trace
 */
const TraceCard = ({ trace }) => {
  const {
    state: { balance },
  } = useContext(Web3Context);
  const {
    state: { currentUser },
  } = useContext(UserContext);

  const viewTrace = () => {
    history.push(`/trace/${trace.slug}`);
  };

  const createTraceLink = () => {
    return `/trace/${trace.slug}`;
  };

  const viewProfile = e => {
    e.stopPropagation();
    history.push(`/profile/${trace.ownerAddress}`);
  };

  const editTrace = useCallback(
    e => {
      e.stopPropagation();

      checkBalance(balance)
        .then(() => {
          const { formType } = trace;
          if (
            [Trace.BOUNTYTYPE, Trace.EXPENSETYPE, Trace.PAYMENTTYPE, Trace.MILESTONETYPE].includes(
              formType,
            )
          ) {
            const newTraceEditUrl = `/${formType}/${trace._id}/edit`;
            history.push(newTraceEditUrl);
          } else {
            history.push(`/campaigns/${trace.campaignId}/traces/${trace._id}/edit`);
          }
        })
        .catch(err => ErrorHandler(err, 'Something went wrong on getting user balance.'));
    },
    [balance, trace],
  );

  const colors = ['#76318f', '#50b0cf', '#1a1588', '#2A6813', '#95d114', '#155388', '#604a7d'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  return (
    <div
      className="card trace-card overview-card"
      onKeyPress={viewTrace}
      role="button"
      tabIndex="0"
    >
      <div className="card-body">
        <div
          className="card-avatar"
          onClick={viewProfile}
          onKeyPress={viewProfile}
          role="button"
          tabIndex="0"
        >
          <Avatar size={30} src={getUserAvatar(trace.owner)} round />
          <span className="owner-name">{getUserName(trace.owner)}</span>

          {trace && trace.canUserEdit(currentUser) && (
            <span className="pull-right">
              <button type="button" className="btn btn-link btn-edit" onClick={e => editTrace(e)}>
                <i className="fa fa-edit" />
              </button>
            </span>
          )}
        </div>
      </div>

      <Link className="card-body" to={createTraceLink()}>
        <div
          className="card-img"
          style={{
            backgroundColor: trace.image ? 'white' : color,
            backgroundImage: `url(${trace.image || GivethLogo})`,
          }}
        />

        <div className="card-content">
          <h4 className="card-title">{getTruncatedText(trace.title, 40)}</h4>
          <div className="card-text">{getTruncatedText(trace.description, 100)}</div>
        </div>

        <div className="card-footer">
          <CardStats
            type="trace"
            peopleCount={trace.peopleCount}
            totalDonated={trace.currentBalance}
            maxAmount={trace.maxAmount}
            tracesCount={trace.tracesCount}
            status={trace.status}
            token={trace.token}
          />
        </div>
      </Link>
    </div>
  );
};

TraceCard.propTypes = {
  trace: PropTypes.oneOfType(
    [Trace, BridgedTrace, LPPCappedTrace, LPTrace].map(PropTypes.instanceOf),
  ).isRequired,
};

export default React.memo(TraceCard);
