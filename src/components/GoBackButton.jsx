import React from 'react';
import PropTypes from 'prop-types';

const GoBackButton = ({ history, styleName }) => (
  <div
    onClick={() => {
      // ths back button will go a lower nested route inside of the DApp
      // if the browser history is zero
      //  this should be the default behavior of the back button
      if (history.length < 1) {
        let url = history.location.pathname.split('/');
        url.pop();
        url = url.join('/');
        history.push(url);
      } else {
        history.goBack();
      }
    }}
    onKeyPress={() => {
      // ths back button will go a lower nested route inside of the DApp
      // if the browser history is zero
      // TODO this should be the default behavior of the back button
      if (history.length < 1) {
        let url = history.location.pathname.split('/');
        url.pop();
        url = url.join('/');
        history.push(url);
      } else {
        history.goBack();
      }
    }}
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
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
  }).isRequired,
  styleName: PropTypes.string,
};

GoBackButton.defaultProps = {
  styleName: '',
};
