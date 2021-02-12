import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import Avatar from 'react-avatar';

import Milestone from 'models/Milestone';
import { getTruncatedText, getUserAvatar, getUserName, history } from '../lib/helpers';
import { checkBalance } from '../lib/middleware';
import CardStats from './CardStats';
import GivethLogo from '../assets/logo.svg';
import ErrorPopup from './ErrorPopup';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';

/**
 * A single milestone
 */
const MilestoneCard = props => {
  const {
    state: { balance },
  } = useContext(Web3Context);
  const {
    state: { currentUser },
  } = useContext(UserContext);

  const viewMilestone = () => {
    history.push(`/milestones/${props.milestone.slug}`);
  };

  const createMilestoneLink = () => {
    return `/milestones/${props.milestone.slug}`;
  };

  const viewProfile = e => {
    e.stopPropagation();
    history.push(`/profile/${props.milestone.ownerAddress}`);
  };

  const editMilestone = e => {
    e.stopPropagation();

    checkBalance(balance)
      .then(() => {
        history.push(
          `/campaigns/${props.milestone.campaign._id}/milestones/${props.milestone._id}/edit`,
        );
      })
      .catch(err => {
        if (err === 'noBalance') {
          ErrorPopup('There is no balance left on the account.', err);
        } else if (err !== undefined) {
          ErrorPopup('Something went wrong.', err);
        }
      });
  };

  const { milestone } = props;
  const colors = ['#76318f', '#50b0cf', '#1a1588', '#2A6813', '#95d114', '#155388', '#604a7d'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  return (
    <div
      className="card milestone-card overview-card"
      onKeyPress={viewMilestone}
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
          <Avatar size={30} src={getUserAvatar(milestone.owner)} round />
          <span className="owner-name">{getUserName(milestone.owner)}</span>

          {milestone && milestone.canUserEdit(currentUser) && (
            <span className="pull-right">
              <button
                type="button"
                className="btn btn-link btn-edit"
                onClick={e => editMilestone(e)}
              >
                <i className="fa fa-edit" />
              </button>
            </span>
          )}
        </div>
      </div>

      <Link className="card-body" to={createMilestoneLink()}>
        <div
          className="card-img"
          style={{
            backgroundColor: milestone.image ? 'white' : color,
            backgroundImage: `url(${milestone.image || GivethLogo})`,
          }}
        />

        <div className="card-content">
          <h4 className="card-title">{getTruncatedText(milestone.title, 40)}</h4>
          <div className="card-text">{getTruncatedText(milestone.description, 100)}</div>
        </div>

        <div className="card-footer">
          <CardStats
            type="milestone"
            peopleCount={milestone.peopleCount}
            totalDonated={milestone.currentBalance}
            maxAmount={milestone.maxAmount}
            milestonesCount={milestone.milestonesCount}
            status={milestone.status}
            token={milestone.token}
          />
        </div>
      </Link>
    </div>
  );
};

MilestoneCard.propTypes = {
  milestone: PropTypes.instanceOf(Milestone).isRequired,
};

export default React.memo(MilestoneCard);
