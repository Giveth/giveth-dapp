import React, { forwardRef, Fragment, useContext } from 'react';
import PropTypes from 'prop-types';

import TraceService from 'services/TraceService';
import Trace from 'models/Trace';
import ErrorPopup from 'components/ErrorPopup';
import confirmationDialog from 'lib/confirmationDialog';

import { actionWithLoggedIn } from '../lib/middleware';
import { Context as UserContext } from '../contextProviders/UserProvider';
import BridgedTrace from '../models/BridgedTrace';
import LPPCappedTrace from '../models/LPPCappedTrace';
import LPTrace from '../models/LPTrace';

const DeleteProposedTraceButton = forwardRef(({ trace }, ref) => {
  const {
    state: { currentUser },
  } = useContext(UserContext);
  const _confirmDeleteTrace = () => {
    TraceService.deleteProposedTrace({
      trace,
      onSuccess: () => React.toast.info(<p>The Trace has been deleted.</p>),
      onError: e => ErrorPopup('Something went wrong with deleting your Trace', e),
    });
  };

  const deleteProposedTrace = () => {
    actionWithLoggedIn(currentUser).then(() =>
      confirmationDialog('trace', trace.title, _confirmDeleteTrace),
    );
  };

  return (
    <Fragment>
      {trace.canUserDelete(currentUser) && (
        <span>
          <button
            ref={ref}
            type="button"
            className="btn btn-danger btn-sm"
            onClick={deleteProposedTrace}
          >
            <i className="fa fa-times-circle-o" />
            &nbsp;Delete
          </button>
        </span>
      )}
    </Fragment>
  );
});

DeleteProposedTraceButton.propTypes = {
  trace: PropTypes.oneOfType(
    [Trace, BridgedTrace, LPPCappedTrace, LPTrace].map(PropTypes.instanceOf),
  ).isRequired,
};

export default React.memo(DeleteProposedTraceButton);
