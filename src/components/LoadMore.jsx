import React from 'react';
import PropTypes from 'prop-types';

const LoadMore = props => (
  <div className="text-center">
    <button
      type="button"
      className={`btn btn-info mt-2${props.isSmall ? ' btn-sm' : ''}${
        props.isFullWidth ? ' w-100' : ''
      }`}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {props.disabled && (
        <span>
          <i className="fa fa-circle-o-notch fa-spin" /> Loading
        </span>
      )}
      {!props.disabled && <span>Load More</span>}
    </button>
  </div>
);

LoadMore.propTypes = {
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
  isSmall: PropTypes.bool.isRequired,
  isFullWidth: PropTypes.bool.isRequired,
};

export default LoadMore;
