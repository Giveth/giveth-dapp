import PropTypes from 'prop-types';

/**
 * Proptype model of the giveth wallet.
 * To be used once custom proptypes validation is allowed
 * see https://github.com/facebook/react/issues/1715
 */
const walletModel = PropTypes.shape({
  keystores: PropTypes.arrayOf(PropTypes.shape({
    address: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    version: PropTypes.number.isRequired,
  })).isRequired,
  getBalance: PropTypes.func,
});

export default walletModel;
