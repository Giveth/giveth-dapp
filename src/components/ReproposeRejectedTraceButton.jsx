import React, { Fragment, useContext, useRef } from 'react';
import PropTypes from 'prop-types';

import TraceService from 'services/TraceService';
import Trace from 'models/Trace';
import { Input, Modal } from 'antd';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { authenticateUser } from '../lib/middleware';
import { Context as UserContext } from '../contextProviders/UserProvider';
import BridgedTrace from '../models/BridgedTrace';
import LPPCappedTrace from '../models/LPPCappedTrace';
import LPTrace from '../models/LPTrace';
import { sendAnalyticsTracking } from '../lib/SegmentAnalytics';
import ErrorHandler from '../lib/ErrorHandler';

function ReproposeRejectedTraceButton({ trace }) {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork, web3 },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const reason = useRef('');

  const onInputChange = input => {
    reason.current = input.target.value;
  };

  const repropose = () => {
    authenticateUser(currentUser, false, web3).then(authenticated => {
      if (!authenticated) return;
      Modal.confirm({
        title: 'Re-propose Trace?',
        content: (
          <Fragment>
            <p>Are you sure you want to re-propose this Trace?</p>
            <Input
              onChange={onInputChange}
              placeholder="Add a reason why you re-propose this rejected Trace..."
            />
          </Fragment>
        ),
        cancelText: 'Cancel',
        okText: 'Yes',
        centered: true,
        width: 500,
        onOk: () => {
          if (reason.current === '') return;
          TraceService.reproposeRejectedTrace({
            trace,
            reason: reason.current,
            onSuccess: () => {
              sendAnalyticsTracking('Rejected Trace Reproposed', {
                category: 'Trace',
                action: 'reproposed rejected trace',
                id: trace._id,
                traceId: trace._id,
                title: trace.title,
                ownerId: trace.ownerAddress,
                traceType: trace.formType,
                traceRecipientAddress: trace.recipientAddress,
                parentCampaignId: trace.campaign.id,
                parentCampaignTitle: trace.campaign.title,
                reviewerAddress: trace.reviewerAddress,
                userAddress: currentUser.address,
              });
              React.toast.info(<p>The Trace has been re-proposed.</p>);
            },
            onError: e => ErrorHandler(e, 'Something went wrong with re-proposing your Trace'),
          });
        },
      });
    });
  };

  return (
    <Fragment>
      {trace.canUserRepropose(currentUser) && (
        <button
          type="button"
          className="btn btn-success btn-sm"
          onClick={() => (isForeignNetwork ? repropose() : displayForeignNetRequiredWarning())}
        >
          <i className="fa fa-times-square-o" />
          &nbsp;Re-propose
        </button>
      )}
    </Fragment>
  );
}

ReproposeRejectedTraceButton.propTypes = {
  trace: PropTypes.oneOfType(
    [Trace, BridgedTrace, LPPCappedTrace, LPTrace].map(PropTypes.instanceOf),
  ).isRequired,
};

export default React.memo(ReproposeRejectedTraceButton);
