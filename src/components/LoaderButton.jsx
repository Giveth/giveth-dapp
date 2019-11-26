import React from 'react';
import PropTypes from 'prop-types';

import Loader from './Loader';
import { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';
import config from '../configuration';

// Need to disable the button type because the rule does not allow prop values
/* eslint react/button-has-type: 0 */
/**
 * Renders a button with an optional loader
 *
 *  @param className      ClassNames
 *  @param formNoValidate Wether to validate formsy
 *  @param disable        Disables button
 *  @param isLoading      State of button. If true, disables and renders spinner
 *  @param loadingText    Text to show when state is loading
 *  @param children       Elements / text showing when state is not loading
 *  @param network        The network this button acts on. Can be one of ['Home', 'Foreign', undefined].
 *                        If network !=== undefined, the button will be disabled if the incorrect web3 network
 *                        is choosen
 */
const LoaderButton = ({
  className,
  formNoValidate,
  type,
  onClick,
  disabled,
  isLoading,
  loadingText,
  children,
  network,
  ...props
}) => (
  <Web3Consumer>
    {({ state: { isHomeNetwork, isForeignNetwork } }) => {
      const incorrectNetwork =
        network &&
        ((network === 'Home' && isForeignNetwork) || (network === 'Foreign' && isHomeNetwork));
      return (
        <span>
          <button
            className={className}
            formNoValidate={formNoValidate}
            type={type}
            onClick={onClick}
            disabled={disabled || incorrectNetwork}
            {...props}
          >
            {isLoading && (
              <span>
                <Loader className="small btn-loader" />
                {loadingText}
              </span>
            )}

            {!isLoading && <span>{children}</span>}
          </button>
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
  formNoValidate: PropTypes.bool,
  disabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  loadingText: PropTypes.string,
  children: PropTypes.node,
  type: PropTypes.string,
  onClick: PropTypes.func,
  network: PropTypes.oneOf(['Home', 'Foreign', undefined]),
};

LoaderButton.defaultProps = {
  className: '',
  formNoValidate: false,
  disabled: false,
  isLoading: true,
  loadingText: '',
  children: null,
  type: 'button',
  onClick: undefined,
  network: undefined,
};

export default LoaderButton;
