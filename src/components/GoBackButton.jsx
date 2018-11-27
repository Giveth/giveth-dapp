import React from 'react';
import PropTypes from 'prop-types';
import { goBackOnePath, history } from '../lib/helpers';

const GoBackButton = ({ styleName, title, to }) => (
  <div
    onClick={() => (to ? history.push(to) : goBackOnePath())}
    onKeyPress={() => (to ? history.push(to) : goBackOnePath())}
    role="button"
    tabIndex="0"
    className={`go-back-button ${styleName}`}
  >
    <i className="fa fa-long-arrow-left" />
    {title}
  </div>
);

export default GoBackButton;

GoBackButton.propTypes = {
  to: PropTypes.string,
  styleName: PropTypes.string,
  title: PropTypes.string,
};

GoBackButton.defaultProps = {
  to: undefined,
  styleName: '',
  title: 'back',
};
