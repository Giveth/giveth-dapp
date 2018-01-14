import React from 'react';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-15.4';
import JoinGivethCommunity from './JoinGivethCommunity';
import User from '../models/User';
import middleware from '../lib/middleware';

// enzyme needs this to render components
configure({ adapter: new Adapter() });

// mocks
jest.mock('React', () => ({
  whitelist: jest.fn(),
}));
let countIsInWhitelistCalled = 0;
const mockPromise = {
  called: (countIsInWhitelistCalled += 1),
  then: () => ({
    catch: () => {},
  }),
};
jest.mock('../lib/middleware', () => ({
  isInWhitelist: () => mockPromise,
}));
const hist = { goBack: jest.fn(), push: jest.fn() };

// stubs
// really want to to use mocks here, but fails on propType check
const currentUser = new User({ address: 'blah' });
React.whitelist = { delegateWhitelist: {} };

// test Join Giveth call to action banner
describe('Join Giveth call to action banner', () => {
  // use fakes to make shallow instance of component
  const component = shallow(<JoinGivethCommunity history={hist} currentUser={currentUser} />);

  it('should check if in whitelist when creating DAC', () => {
    // call create DAC
    component.instance().createDAC();
    // check if is whitelist was called
    expect(countIsInWhitelistCalled > 0);
  });

  it('should call create DAC when Create Community button is clicked', () => {
    // mock component method create DAC
    component.instance().createDAC = jest.fn();
    // update shallow component
    component.update();
    // find button within component html and simulate click
    component.findWhere(n => n.type() === 'button' && n.contains('Create a Community'))
      .simulate('click');
    // check if mock create DAC was called
    expect(component.instance().createDAC).toHaveBeenCalled();
  });
});
