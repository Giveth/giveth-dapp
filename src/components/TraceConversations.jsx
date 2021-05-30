import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import Trace from 'models/Trace';
import TraceItemModel from 'models/TraceItem';
import Loader from './Loader';
import { feathersClient } from '../lib/feathersClient';
import TraceConversationComment from './TraceConversationComment';
import TraceConversationItem from './TraceConversationItem';
import LoadMore from './LoadMore';
import BridgedTrace from '../models/BridgedTrace';
import LPPCappedTrace from '../models/LPPCappedTrace';
import LPTrace from '../models/LPTrace';

const TraceConversations = ({ trace, maxHeight, isAmountEnoughForWithdraw }) => {
  const conversationsNumPerLoad = 5;
  const [conversations, setConversations] = useState({});
  const [isLoading, setLoading] = useState(true);
  const [conversationsNum, setConversationsNum] = useState(conversationsNumPerLoad);

  const conversationObserver = useRef();

  useEffect(() => {
    conversationObserver.current = feathersClient
      .service('conversations')
      .watch({ listStrategy: 'always' })
      .find({
        query: {
          traceId: trace.id,
          $sort: { createdAt: -1 },
          $limit: conversationsNum,
        },
      })
      .subscribe(resp => {
        setConversations(
          resp.data.map(conversation => {
            conversation.items = conversation.items.map(i => new TraceItemModel(i));
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
  }, [conversationsNum]);

  const handleLoadMore = () => {
    setConversationsNum(conversationsNum + conversationsNumPerLoad);
  };

  return (
    <div id="trace-conversations" style={{ maxHeight }}>
      {isLoading && <Loader className="fixed" />}

      {!isLoading && (
        <div className="card">
          <div className="card-body content">
            {conversations.map(conversation => (
              <TraceConversationItem
                key={conversation._id}
                conversation={conversation}
                trace={trace}
                isAmountEnoughForWithdraw={isAmountEnoughForWithdraw}
              />
            ))}
          </div>
          {conversations.length >= conversationsNum && (
            <LoadMore onClick={handleLoadMore} disabled={isLoading} className="w-100 btn-sm" />
          )}
          <TraceConversationComment trace={trace} />
        </div>
      )}
    </div>
  );
};

TraceConversations.propTypes = {
  trace: PropTypes.oneOfType(
    [Trace, BridgedTrace, LPPCappedTrace, LPTrace].map(PropTypes.instanceOf),
  ).isRequired,
  maxHeight: PropTypes.string,
  isAmountEnoughForWithdraw: PropTypes.bool.isRequired,
};

TraceConversations.defaultProps = {
  maxHeight: 'unset',
};

export default React.memo(TraceConversations);
