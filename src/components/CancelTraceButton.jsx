import React, { Fragment, useContext, useRef } from 'react';
import PropTypes from 'prop-types';

import TraceService from 'services/TraceService';
import Trace from 'models/Trace';
import ErrorPopup from 'components/ErrorPopup';
import ConversationModal from 'components/ConversationModal';
import { authenticateUser, checkBalance } from 'lib/middleware';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { Context as UserContext } from '../contextProviders/UserProvider';
import BridgedTrace from '../models/BridgedTrace';
import LPPCappedTrace from '../models/LPPCappedTrace';
import LPTrace from '../models/LPTrace';
import { sendAnalyticsTracking } from '../lib/SegmentAnalytics';
import { txNotification } from '../lib/helpers';
import ErrorHandler from '../lib/ErrorHandler';

const CancelTraceButton = ({ trace, className }) => {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork, balance, web3 },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const conversationModal = useRef();

  const openDialog = () => {
    if (!isForeignNetwork) {
      return displayForeignNetRequiredWarning();
    }
    return authenticateUser(currentUser, false, web3).then(authenticated => {
      if (!authenticated) return;
      checkBalance(balance)
        .then(() =>
          conversationModal.current
            .openModal({
              title: 'Cancel Trace',
              description:
                'Explain why you cancel this Trace. Compliments are appreciated! This information will be publicly visible and emailed to the Trace owner.',
              textPlaceholder: 'Explain why you cancel this Trace...',
              required: true,
              cta: 'Cancel Trace',
              enableAttachProof: false,
            })
            .then(proof =>
              TraceService.cancelTrace({
                trace,
                from: currentUser.address,
                proof,
                onTxHash: txUrl => {
                  sendAnalyticsTracking('Trace Cancelled', {
                    category: 'Trace',
                    action: 'cancel',
                    traceId: trace.id,
                    title: trace.title,
                    traceOwnerAddress: trace.ownerAddress,
                    traceType: trace.formType,
                    slug: trace.slug,
                    traceRecipientAddress: trace.recipientAddress,
                    parentCampaignId: trace.campaign._id,
                    parentCampaignAddress: trace.campaign.ownerAddress,
                    parentCampaignTitle: trace.campaign.title,
                    reviewerAddress: trace.reviewerAddress,
                    userAddress: currentUser.address,
                    txUrl,
                  });

                  txNotification('Canceling this Trace is pending...', txUrl, true);
                },
                onConfirmation: txUrl => txNotification('The Trace has been cancelled!', txUrl),
                onError: (err, txUrl) => {
                  if (err === 'patch-error') {
                    ErrorPopup('Something went wrong with canceling your Trace', err);
                  } else {
                    ErrorPopup(
                      'Something went wrong with the transaction.',
                      `${txUrl} => ${JSON.stringify(err, null, 2)}`,
                    );
                  }
                },
                web3,
              }),
            ),
        )
        .catch(err => ErrorHandler(err, 'Something went wrong on getting user balance.'));
    });
  };

  return (
    <Fragment>
      {trace.canUserCancel(currentUser) && (
        <button type="button" className={`btn btn-danger btn-sm ${className}`} onClick={openDialog}>
          <i className="fa fa-times" />
          &nbsp;Cancel
        </button>
      )}

      <ConversationModal ref={conversationModal} />
    </Fragment>
  );
};

CancelTraceButton.propTypes = {
  trace: PropTypes.oneOfType(
    [Trace, BridgedTrace, LPPCappedTrace, LPTrace].map(PropTypes.instanceOf),
  ).isRequired,
  className: PropTypes.string,
};

CancelTraceButton.defaultProps = {
  className: '',
};

export default React.memo(CancelTraceButton);
