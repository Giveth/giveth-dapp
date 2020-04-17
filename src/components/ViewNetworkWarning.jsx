import React from 'react';
import PropTypes from 'prop-types';
import NetworkChangeGuide from './NetworkChangeGuide';

/**
 * Show a warning if the user is not connected to the correct network
 */

function ViewNetworkWarning(props) {
  const { incorrectNetwork, networkName } = props;
  return (
    incorrectNetwork && (
      <div>
        <div className="alert alert-warning">
          <i className="fa fa-exclamation-triangle" />
          To enable all actions, please connect Metamask to <strong>{networkName}</strong> network.
          <button
            type="button"
            data-toggle="modal"
            data-target="#networkChangeModal"
            className="btn btn-outline-info btn-sm ml-1"
          >
            <em>show guide</em>
          </button>
        </div>
        <div
          className="modal fade"
          id="networkChangeModal"
          tabIndex="-1"
          role="dialog"
          aria-labelledby="networkChangeModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="networkChangeModalLabel">
                  Change Metamask Network
                </h5>
              </div>
              <div className="modal-body">{NetworkChangeGuide}</div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" data-dismiss="modal">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );
}

ViewNetworkWarning.propTypes = {
  incorrectNetwork: PropTypes.bool.isRequired,
  networkName: PropTypes.string.isRequired,
};

export default ViewNetworkWarning;
