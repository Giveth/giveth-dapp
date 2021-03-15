import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import Milestone from 'models/Milestone';
import MilestoneItemModel from 'models/MilestoneItem';
import Loader from './Loader';
import { feathersClient } from '../lib/feathersClient';
import MilestoneConversationComment from './MilestoneConversationComment';
import MilestoneConversationItem from './MilestoneConversationItem';
import LoadMore from './LoadMore';

const MilestoneConversations = ({ milestone, maxHeight }) => {
  const [conversations, setConversations] = useState({});
  const [isLoading, setLoading] = useState(true);
  const [conversationsNum, setConversationsNum] = useState(5);

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

  const handleLoadMore = () => {
    setConversationsNum(conversationsNum + 5);
  };

  return (
    <div id="milestone-conversations" style={{ maxHeight }}>
      {isLoading && <Loader className="fixed" />}

      {!isLoading && (
        <div className="card" style={{ maxHeight: 'inherit' }}>
          <div style={{ maxHeight: 'inherit', overflow: 'auto' }} className="card-body content">
            {conversations.slice(0, conversationsNum).map(conversation => (
              <MilestoneConversationItem
                key={conversation._id}
                conversation={conversation}
                milestone={milestone}
              />
            ))}
          </div>
          {conversations.length > conversationsNum && (
            <LoadMore onClick={handleLoadMore} disabled={isLoading} isFullWidth isSmall />
          )}
          <MilestoneConversationComment milestone={milestone} />
        </div>
      )}
    </div>
  );
};

MilestoneConversations.propTypes = {
  milestone: PropTypes.instanceOf(Milestone).isRequired,
  maxHeight: PropTypes.number.isRequired,
};

export default React.memo(MilestoneConversations);
