import React from 'react';
import PropTypes from 'prop-types';
import NetworkChangeGuide from './NetworkChangeGuide';

/**
 * It is used to show in modals when user wants to take an action while connected to wrong network.
 */

function ActionNetworkWarning(props) {
  const { incorrectNetwork, networkName } = props;
  return (
    incorrectNetwork && (
      <div>
        <div className="alert alert-warning">
          <i className="fa fa-exclamation-triangle" />
          To take this action you need to connect metamask to <strong>{networkName}</strong>{' '}
          network. Then try again.
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
