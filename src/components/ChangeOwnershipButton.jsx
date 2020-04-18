/* eslint-disable no-restricted-globals */
import React, { Component, Fragment } from 'react';
import Modal from 'react-modal';
import BigNumber from 'bignumber.js';
import { Form } from 'formsy-react-components';
import PropTypes from 'prop-types';
import 'react-rangeslider/lib/index.css';

import Campaign from 'models/Campaign';
import Milestone from 'models/Milestone';
import User from 'models/User';
import { ZERO_ADDRESS } from '../lib/helpers';
import { isLoggedIn, checkBalance, sleep } from '../lib/middleware';
import Loader from './Loader';
import config from '../configuration';
import SelectFormsy from './SelectFormsy';
import ActionNetworkWarning from './ActionNetworkWarning';

import CampaignService from '../services/CampaignService';
import { Consumer as Web3Consumer } from '../contextProviders/Web3Provider';
import { Consumer as WhiteListConsumer } from '../contextProviders/WhiteListProvider';

BigNumber.config({ DECIMAL_PLACES: 18 });
Modal.setAppElement('#root');

const modalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-20%',
    transform: 'translate(-50%, -50%)',
    boxShadow: '0 0 40px #ccc',
    overflowY: 'scroll',
  },
};

/**
 * Retrieves the oldest 100 donations that the user can delegate
 *
 * @prop {BN}           balance     Current user's balance
 * @prop {User}         currentUser Current user of the Dapp
 * @prop {Campaign}     campaign    If the delegation is towards campaign, this contains the campaign
 * @prop {Object}       milestone   It the delegation is towards campaign, this contains the milestone
 * @prop {Object}       style       Styles added to the button
 */
class ChangeOwnershipButton extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isSaving: false,
      modalVisible: false,
      campaign: this.props.campaign,
    };

    this.form = React.createRef();
    this.submit = this.submit.bind(this);
  }

  componentDidMount() {}

  openDialog() {
    isLoggedIn(this.props.currentUser)
      .then(() => checkBalance(this.props.balance))
      .then(() => this.setState({ modalVisible: true }));
  }

  submit() {
    const { currentUser } = this.props;
    const { campaign } = this.state;

    this.setState({ isSaving: true });

    const afterCreate = async () => {
      const msg = <p>The owner has been updated!</p>;
      React.toast.success(msg);
      this.setState({ isSaving: false, modalVisible: false });
      await sleep(2000);
      window.location.reload();
    };

    const afterMined = () => {
      // const msg = <p>The owner has been updated!</p>;
      // React.toast.success(msg);
    };

    CampaignService.changeOwnership(
      campaign,
      currentUser.address,
      campaign.ownerAddress,
      campaign.coownerAddress,
      afterCreate,
      afterMined,
    );
  }

  render() {
    const style = {
      display: 'inline-block',
      paddingRight: '10px',
      ...this.props.style,
    };
    const { isSaving, isLoading, campaign } = this.state;
    const { milestone, validProvider, isCorrectNetwork, campaignManagers } = this.props;

    return (
      <span style={style}>
        <button type="button" className="btn btn-danger" onClick={() => this.openDialog()}>
          Change ownership
        </button>

        <Modal
          isOpen={this.state.modalVisible}
          style={modalStyles}
          onRequestClose={() => {
            this.setState({ modalVisible: false });
          }}
        >
          {!validProvider && (
            <div className="alert alert-warning">
              <i className="fa fa-exclamation-triangle" />
              You should install <a href="https://metamask.io/">MetaMask</a> to take action.
            </div>
          )}
          {validProvider && (
            <ActionNetworkWarning
              incorrectNetwork={!isCorrectNetwork}
              networkName={config.foreignNetworkName}
            />
          )}
          {isCorrectNetwork && (
            <Fragment>
              <p>
                Changing ownership for
                {!milestone && <strong> {campaign.title}</strong>}
                {milestone && <strong> {milestone.title}</strong>}
              </p>
              {isLoading && <Loader className="small btn-loader" />}
              {!isLoading && (
                <Form
                  onSubmit={this.submit}
                  layout="vertical"
                  ref={this.form}
                  mapping={inputs => {
                    campaign.ownerAddress = inputs.ownerAddress || ZERO_ADDRESS;
                    campaign.coownerAddress = inputs.coownerAddress || ZERO_ADDRESS;
                  }}
                >
                  <div>
                    <SelectFormsy
                      name="ownerAddress"
                      id="owner-select"
                      label="Select a new owner"
                      helpText="This person or smart contract will be owning your Campaign from now on."
                      value={campaign.ownerAddress}
                      options={campaignManagers}
                      validations="isEtherAddress"
                      validationErrors={{
                        isEtherAddress: 'Please select an owner.',
                      }}
                      required
                    />

                    <SelectFormsy
                      name="coownerAddress"
                      id="co-owner-select"
                      label="Select a new co-owner"
                      helpText="This person or smart contract will be co-owning your Campaign from now on."
                      value={campaign.coownerAddress}
                      cta="------ Select a co-owner ------"
                      options={campaignManagers}
                      validations="isEtherAddress"
                      validationErrors={{
                        isEtherAddress: 'Please select a co-owner.',
                      }}
                      required
                    />
                    <button
                      className="btn btn-success"
                      formNoValidate
                      type="submit"
                      disabled={isSaving || !isCorrectNetwork}
                    >
                      {isSaving ? 'Changing...' : 'Change ownership'}
                    </button>
                    <button
                      className="btn btn-light float-right"
                      type="button"
                      onClick={() => {
                        this.setState({ modalVisible: false });
                      }}
                    >
                      Close
                    </button>
                  </div>
                </Form>
              )}
            </Fragment>
          )}
        </Modal>
      </span>
    );
  }
}

ChangeOwnershipButton.propTypes = {
  balance: PropTypes.instanceOf(BigNumber).isRequired,
  currentUser: PropTypes.instanceOf(User).isRequired,
  campaign: PropTypes.instanceOf(Campaign),
  milestone: PropTypes.instanceOf(Milestone),
  style: PropTypes.shape(),
  validProvider: PropTypes.bool.isRequired,
  isCorrectNetwork: PropTypes.bool.isRequired,
  campaignManagers: PropTypes.arrayOf(PropTypes.shape()).isRequired,
};

ChangeOwnershipButton.defaultProps = {
  campaign: undefined,
  milestone: undefined,
  style: {},
};

export default props => (
  <WhiteListConsumer>
    {({ state: { tokenWhitelist, campaignManagers } }) => (
      <Web3Consumer>
        {({ state: { isForeignNetwork, validProvider } }) => (
          <ChangeOwnershipButton
            validProvider={validProvider}
            isCorrectNetwork={isForeignNetwork}
            tokenWhitelist={tokenWhitelist} // FIXME: tokenWhiteList is not used in ChangeOwnershipButtons node
            campaignManagers={campaignManagers}
            {...props}
          />
        )}
      </Web3Consumer>
    )}
  </WhiteListConsumer>
);
