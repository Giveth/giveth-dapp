import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import Milestone from 'models/Milestone';
import MilestoneItemModel from 'models/MilestoneItem';
import Loader from './Loader';
import { feathersClient } from '../lib/feathersClient';
import MilestoneConversationComment from './MilestoneConversationComment';
import MilestoneConversationItem from './MilestoneConversationItem';

const MilestoneConversations = ({ milestone }) => {
  const [conversations, setConversations] = useState({});
  const [isLoading, setLoading] = useState(true);

  const conversationObserver = useRef();

  useEffect(() => {
    conversationObserver.current = feathersClient
      .service('conversations')
      .watch({ listStrategy: 'always' })
      .find({
        query: {
          milestoneId: milestone.id,
          $sort: { createdAt: -1 },
        },
      })
      .subscribe(resp => {
        setConversations(
          resp.data.map(conversation => {
            conversation.items = conversation.items.map(i => new MilestoneItemModel(i));
            return conversation;
          }),
        );
        setLoading(false);
      });

    return () => {
      if (conversationObserver.current) {
        conversationObserver.current.unsubscribe();
        conversationObserver.current = null;
      }
    };
  }, []);

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
              />
            ))}
          </div>
          <MilestoneConversationComment milestone={milestone} />
        </div>
      )}
    </div>
  );
};

MilestoneConversations.propTypes = {
  milestone: PropTypes.instanceOf(Milestone).isRequired,
};

export default React.memo(MilestoneConversations);
