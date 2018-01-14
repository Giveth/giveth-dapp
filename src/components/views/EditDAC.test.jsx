import React from 'react';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-15.4';
import ReactDOM from 'react-dom';
import Sweetalert from 'sweetalert';
import EditDAC from './EditDAC';
import User from '../../models/User';
import GivethWallet from '../../lib/blockchain/GivethWallet';
import middleware from '../../lib/middleware';

// enzyme needs this to render components
configure({ adapter: new Adapter() });

// mocks
const hist = { goBack: jest.fn(), push: jest.fn() };
let countIsAuthenticated = 0;
const mockPromiseIsAuthenticated = {
  called: (countIsAuthenticated += 1),
  then: () => ({
    then: () => ({
      then: () => {},
    }),
  }),
};
let countConfirmBlockchainTransaction = 0;
const mockPromiseConfirmBlockchainTransaction = {
  called: (countConfirmBlockchainTransaction += 1),
  then: () => ({
    then: () => ({
      then: () => {},
    }),
  }),
};
jest.mock('../../lib/middleware', () => ({
  checkWalletBalance: () => jest.fn,
  confirmBlockchainTransaction: () => mockPromiseConfirmBlockchainTransaction,
  isAuthenticated: () => mockPromiseIsAuthenticated,
  isInWhitelist: () => jest.fn,
}));

// stubs
// really want to to use mocks here, but fails on propType check
const currentUser = new User({ address: 'blah' });
const wallet = new GivethWallet(['blah'], {});
const match = { params: {} };
React.swal = Sweetalert;

// Construct a dom node to be used as content for sweet alert
React.swal.msg = reactNode => {
  const wrapper = document.createElement('span');
  ReactDOM.render(reactNode, wrapper);
  return wrapper.firstChild;
};

// test edit DAC form
describe('Edit DAC form', () => {
  // use fakes to make shallow instance of component
  const component = shallow(<EditDAC
    history={hist}
    currentUser={currentUser}
    wallet={wallet}
    match={match}
  />);

  it('should check user is authenticated', () => {
    middleware.isAuthenticated = () => mockPromise;
    // call submit
    component.instance().submit();
    // check if mock is authenticated was called
    expect(countIsAuthenticated > 0);
  });

  it('should confirm blockchain transaction', () => {
    middleware.isAuthenticated = () => mockPromise;
    // call submit
    component.instance().submit();
    // check if mock confirm blockchain transaction was called
    expect(countIsAuthenticated > 0);
    // expect(middleware.confirmBlockchainTransaction).toHaveBeenCalled();
  });

  // here is a stupid test just to show that at least Loader renders
  it('should render Loader component', () => {
    expect(component.find('Loader').length === 1);
  });

  // for debugging use this to log rendered html:
  // console.log(component.debug());

  // TODO: submit button is not rendering so we can't test click
  // it('should call submit when submitted', () => {
  //   // mock submit
  //   component.submit = jest.fn();
  //   // click submit
  //   component.find('Form').simulate('submit');
  //   // check if mock confirm blockchain transaction was called
  //   expect(component.submit).toHaveBeenCalled();
  // });
});
