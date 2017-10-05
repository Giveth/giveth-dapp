import PropTypes from 'prop-types'

const currentUserModel = PropTypes.shape({
  avatar: PropTypes.string,
  name: PropTypes.string,
  address: PropTypes.string,
  commitTime: PropTypes.string,
  giverId: PropTypes.string,
  email: PropTypes.string,
  linkedin: PropTypes.string
})

export default currentUserModel