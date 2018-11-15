const { REACT_APP_ENVIRONMENT = 'localhost' } = process.env;
// need to supply extraGas b/c https://github.com/trufflesuite/ganache-core/issues/26
export default () => (REACT_APP_ENVIRONMENT !== 'localhost' ? 0 : 1000000);
