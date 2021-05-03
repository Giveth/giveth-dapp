import { notification } from 'antd';
import ErrorPopup from '../components/ErrorPopup';

export default (err, message, forcePopup = false, onCancel = () => {}, onError = () => {}) => {
  if (!err || (err && err.message && err.message.includes('unknown transaction'))) return;

  if (forcePopup) {
    ErrorPopup(message, err);
  } else if (err.code === 4001) {
    notification.warning({
      message: 'User Denied',
      description: 'User denied transaction signature',
    });
    onCancel();
  } else {
    notification.warning({ message: '', description: message });
    onError();
  }
};
