import React from 'react';
import PropTypes from 'prop-types';
import { goBackOnePath } from '../lib/helpers';

const GoBackButton = ({ styleName, title }) => (
  <div
    onClick={goBackOnePath}
    onKeyPress={goBackOnePath}
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
  styleName: PropTypes.string,
  title: PropTypes.string,
};

GoBackButton.defaultProps = {
  styleName: '',
  title: 'back',
};
