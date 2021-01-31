import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Milestone from 'models/Milestone';
import User from 'models/User';
import BigNumber from 'bignumber.js';
import MilestoneItemModel from 'models/MilestoneItem';
import Loader from './Loader';
import { feathersClient } from '../lib/feathersClient';
import MilestoneConversationComment from './MilestoneConversationComment';
import MilestoneConversationItem from './MilestoneConversationItem';

/* eslint no-underscore-dangle: 0 */
class MilestoneConversations extends Component {
  constructor() {
    super();

    this.state = {
      conversations: {},
      isLoading: true,
    };
  }

  componentDidMount() {
    this.conversationObserver = feathersClient
      .service('conversations')
      .watch({ listStrategy: 'always' })
      .find({
        query: {
          milestoneId: this.props.milestone.id,
          $sort: { createdAt: -1 },
        },
      })
      .subscribe(resp => {
        this.setState({
          conversations: resp.data.map(conversation => {
            conversation.items = conversation.items.map(i => new MilestoneItemModel(i));
            return conversation;
          }),
          isLoading: false,
        });
      });
  }

  componentWillUnmount() {
    if (this.conversationObserver) this.conversationObserver.unsubscribe();
  }

  render() {
    const { isLoading, conversations } = this.state;
    const { milestone, balance, currentUser } = this.props;

    return (
      <div id="milestone-conversations">
        {isLoading && <Loader className="fixed" />}

        {!isLoading && (
          <div className="card">
            <div className="card-body content">
              {conversations.map(conversation => (
                <MilestoneConversationItem
                  key={conversation._id}
                  conversation={conversation}
                  milestone={milestone}
                  currentUser={currentUser}
                  balance={balance}
                />
              ))}
            </div>
            <MilestoneConversationComment milestone={milestone} currentUser={currentUser} />
          </div>
        )}
      </div>
    );
  }
}

MilestoneConversations.propTypes = {
  milestone: PropTypes.instanceOf(Milestone).isRequired,
  currentUser: PropTypes.instanceOf(User),
  balance: PropTypes.instanceOf(BigNumber).isRequired,
};

MilestoneConversations.defaultProps = {
  currentUser: undefined,
};

export default MilestoneConversations;
