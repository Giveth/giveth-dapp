import { notification } from 'antd';
import ErrorPopup from '../components/ErrorPopup';

export default (err, message, forcePopup = false, onCancel = () => {}, onError = () => {}) => {
  console.error(err);
  let _message = '';
  let _description = '';

  if (forcePopup) {
    return ErrorPopup(message, err);
  }

  if (err && err.code === 4001) {
    _message = 'User Denied';
    _description = 'User denied transaction signature!';
    onCancel();
  } else if (err === 'noBalance') {
    _message = 'No Balance';
    _description = 'There is no balance left on the account!';
  } else if (!message) {
    _description = 'Something went wrong!';
  } else {
    _description = message;
    onError();
  }

  return notification.warning({ message: _message, description: _description });
};
