import React from 'react';
import PropTypes from 'prop-types';

/**
 * Show a warning if the user is not connected to the correct network
 */
const NetworkWarning = ({ incorrectNetwork, networkName }) =>
  incorrectNetwork && (
    <div className="alert alert-warning">
      <i className="fa fa-exclamation-triangle" />
      It looks like your Web3 Provider is connected to the wrong network. Please connect to the{' '}
      <strong>{networkName}</strong> network.
    </div>
  );

NetworkWarning.propTypes = {
  incorrectNetwork: PropTypes.bool.isRequired,
  networkName: PropTypes.string.isRequired,
};

export default NetworkWarning;
