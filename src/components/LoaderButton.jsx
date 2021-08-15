import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'antd';

import { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';
import config from '../configuration';

// Need to disable the button type because the rule does not allow prop values
/* eslint react/button-has-type: 0 */
/**
 * Renders a button with an optional loader
 *
 *  @param className      ClassNames
 *  @param onClick        onClick
 *  @param disabled       Disables button
 *  @param isLoading      State of button. If true, disables and renders spinner
 *  @param loadingText    Text to show when state is loading
 *  @param children       Elements / text showing when state is not loading
 *  @param network        The network this button acts on. Can be one of ['Home', 'Foreign', undefined].
 *                        If network !=== undefined, the button will be disabled if the incorrect web3 network
 *                        is chosen
 */
const LoaderButton = ({
  className,
  onClick,
  disabled,
  isLoading,
  loadingText,
  children,
  network,
}) => (
  <Web3Consumer>
    {({ state: { isHomeNetwork, isForeignNetwork } }) => {
      const incorrectNetwork =
        network &&
        ((network === 'Home' && isForeignNetwork) || (network === 'Foreign' && isHomeNetwork));

      const buttonText = isLoading && loadingText ? loadingText : children;
      return (
        <span>
          <Button
            className={className}
            onClick={onClick}
            disabled={disabled || incorrectNetwork}
            loading={isLoading}
          >
            <span>{buttonText}</span>
          </Button>
          {incorrectNetwork && (
            <small
              className="form-text loader-button-network-help pull-right"
              style={{ clear: 'right', marginTop: '5px' }}
            >
              Please choose the{' '}
              <strong>
                {network === 'Home' ? config.homeNetworkName : config.foreignNetworkName}
              </strong>{' '}
              network with your Web3 Provider.
            </small>
          )}
        </span>
      );
    }}
  </Web3Consumer>
);

LoaderButton.propTypes = {
  className: PropTypes.string,
  disabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  loadingText: PropTypes.string,
  children: PropTypes.node,
  onClick: PropTypes.func,
  network: PropTypes.oneOf(['Home', 'Foreign', undefined]),
};

LoaderButton.defaultProps = {
  className: '',
  disabled: false,
  isLoading: true,
  loadingText: '',
  children: null,
  onClick: undefined,
  network: undefined,
};

export default LoaderButton;
