import React from 'react';
import PropTypes from 'prop-types';

const RiotButton = props => (
  <a className={props.className} href={props.url} target="_blank" rel="noopener noreferrer">
    <i className="fa fa-comments-o" />
    {props.children}
  </a>
);

RiotButton.propTypes = {
  url: PropTypes.string.isRequired,
  className: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
};

RiotButton.defaultProps = {
  className: '',
};

export default RiotButton;
