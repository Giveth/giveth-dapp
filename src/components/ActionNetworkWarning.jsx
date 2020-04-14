import React from 'react';
import PropTypes from 'prop-types';
import NetworkChangeGuide from './NetworkChangeGuide';

/**
 * Show a warning if the user is not connected to the correct network
 */

function ActionNetworkWarning(props) {
  const { incorrectNetwork, networkName } = props;
  return (
    incorrectNetwork && (
      <div>
        <div className="alert alert-warning">
          <i className="fa fa-exclamation-triangle" />
          You need to connect metamask to <strong>{networkName}</strong> network. Then try again.
        </div>
        {NetworkChangeGuide}
      </div>
    )
  );
}

ActionNetworkWarning.propTypes = {
  incorrectNetwork: PropTypes.bool.isRequired,
  networkName: PropTypes.string.isRequired,
};

export default ActionNetworkWarning;
