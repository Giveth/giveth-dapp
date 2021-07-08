import React, { Fragment, useContext } from 'react';
import PropTypes from 'prop-types';

import TraceService from 'services/TraceService';
import Trace from 'models/Trace';
import ErrorPopup from 'components/ErrorPopup';
import { Context as Web3Context } from '../contextProviders/Web3Provider';
import { authenticateUser } from '../lib/middleware';
import { Context as UserContext } from '../contextProviders/UserProvider';
import BridgedTrace from '../models/BridgedTrace';
import LPPCappedTrace from '../models/LPPCappedTrace';
import LPTrace from '../models/LPTrace';
import { sendAnalyticsTracking } from '../lib/SegmentAnalytics';

function ReproposeRejectedTraceButton({ trace }) {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const repropose = () => {
    authenticateUser(currentUser, false).then(() =>
      React.swal({
        title: 'Re-propose Trace?',
        text: 'Are you sure you want to re-propose this Trace?',
        icon: 'warning',
        dangerMode: true,
        buttons: ['Cancel', 'Yes'],
        content: {
          element: 'input',
          attributes: {
            placeholder: 'Add a reason why you re-propose this rejected Trace...',
          },
        },
      }).then(reason => {
        // if null, then "Cancel" was pressed
        if (reason === null) return;

        TraceService.reproposeRejectedTrace({
          trace,
          reason,
          onSuccess: () => {
            sendAnalyticsTracking('Rejected Trace Reproposed', {
              category: 'Trace',
              action: 'reproposed rejected trace',
              id: trace._id,
              title: trace.title,
              userAddress: currentUser.address,
            });
            React.toast.info(<p>The Trace has been re-proposed.</p>);
          },
          onError: e => ErrorPopup('Something went wrong with re-proposing your Trace', e),
        });
      }),
    );
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
