import React from 'react';
import PropTypes from 'prop-types';
import { goBackOnePath } from '../lib/helpers';

const GoBackButton = ({ styleName }) => (
  <div
    onClick={() => {
      // the back button will go one lower nested route inside of the DApp
      goBackOnePath();
    }}
    onKeyPress={goBackOnePath}
    role="button"
    tabIndex="0"
    className={`go-back-button ${styleName}`}
  >
    <i className="fa fa-long-arrow-left" />
    back
  </div>
);

export default GoBackButton;

GoBackButton.propTypes = {
  styleName: PropTypes.string,
};

GoBackButton.defaultProps = {
  styleName: '',
};
