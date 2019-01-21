import React from 'react';
import PropTypes from 'prop-types';

/**
 * Loader shows a loader. Add className="fixed" as prop to make a fixed loader
 */
const Loader = ({ className }) => (
  <div className={`spinner ${className}`}>
    <div className="double-bounce1" />
    <div className="double-bounce2" />
  </div>
);

Loader.propTypes = {
  className: PropTypes.string,
};
Loader.defaultProps = {
  className: '',
};

export default Loader;
