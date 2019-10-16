import React from 'react';
import PropTypes from 'prop-types';
import { goBackOnePath, history } from '../lib/helpers';

const GoBackButton = ({ styleName, title, to, goPreviousPage }) => {
  if (goPreviousPage && history.length <= 1) {
    return null;
  }

  const onPush = () => {
    if (to) {
      history.push(to);
    } else if (goPreviousPage) {
      history.goBack();
    } else {
      goBackOnePath();
    }
  };

  return (
    <div
      onClick={onPush}
      onKeyPress={onPush}
      role="button"
      tabIndex="0"
      className={`go-back-button ${styleName}`}
    >
      <i className="fa fa-long-arrow-left" />
      {title}
    </div>
  );
};

export default GoBackButton;

GoBackButton.propTypes = {
  to: PropTypes.string,
  styleName: PropTypes.string,
  title: PropTypes.string,
  goPreviousPage: PropTypes.bool,
};

GoBackButton.defaultProps = {
  to: undefined,
  styleName: '',
  title: 'Back',
  goPreviousPage: false,
};
