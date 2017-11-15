import PropTypes from 'prop-types';

const currentUserModel = PropTypes.shape({
  address: PropTypes.string,
  avatar: PropTypes.string,
  commitTime: PropTypes.string,
  email: PropTypes.string,
  giverId: PropTypes.number,
  linkedin: PropTypes.string,
  name: PropTypes.string,
});

export default currentUserModel;
