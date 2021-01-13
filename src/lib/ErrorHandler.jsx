import React from 'react';
import ErrorPopup from '../components/ErrorPopup';

export default (err, message, forcePopup = false) => {
  if (!err) return;

  if (forcePopup) ErrorPopup(message);
  else if (err.code === 4001) React.toast.warning(<p>User denied transaction signature.</p>);
  else React.toast.warning(message);
};
