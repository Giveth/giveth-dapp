import React from 'react';
import ErrorPopup from '../components/ErrorPopup';

export default (err, message, forcePopup = false, onCancel = () => {}, onError = () => {}) => {
  if (!err || (err && err.message && err.message.includes('unknown transaction'))) return;

  if (forcePopup) ErrorPopup(message);
  else if (err.code === 4001) {
    React.toast.warning(<p>User denied transaction signature</p>);
    onCancel();
  } else {
    React.toast.warning(message);
    onError();
  }
};
