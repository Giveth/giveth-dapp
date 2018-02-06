import React from 'react';
import PropTypes from 'prop-types';

import Loader from './Loader';

/**
 * Renders a button with an optional loader
 *
 *  @param className      ClassNames
 *  @param formNoValidate Wether to validate formsy
 *  @param disable        Disables button
 *  @param isLoading      State of button. If true, disables and renders spinner
 *  @param loadingText    Text to show when state is loading
 *  @param children       Elements / text showing when state is not loading
 */
const LoaderButton = ({
  className,
  formNoValidate,
  type,
  disabled,
  isLoading,
  loadingText,
  children,
}) => (
  <button className={className} formNoValidate={formNoValidate} type={type} disabled={disabled}>
    {isLoading && (
      <span>
        <Loader className="small btn-loader" />
        {loadingText}
      </span>
    )}

    {!isLoading && <span>{children}</span>}
  </button>
);

LoaderButton.propTypes = {
  className: PropTypes.string,
  formNoValidate: PropTypes.bool,
  disabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  loadingText: PropTypes.string,
  children: PropTypes.node,
  type: PropTypes.string,
};

LoaderButton.defaultProps = {
  className: '',
  formNoValidate: false,
  disabled: false,
  isLoading: true,
  loadingText: '',
  children: null,
  type: '',
};

export default LoaderButton;
