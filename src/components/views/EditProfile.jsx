import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Form, Input } from 'formsy-react-components';
import { feathersClient } from '../../lib/feathersClient';
import Loader from '../Loader';
import FormsyImageUploader from './../FormsyImageUploader';
import { isAuthenticated, checkWalletBalance } from '../../lib/middleware';
import LoaderButton from '../../components/LoaderButton';
import getNetwork from '../../lib/blockchain/getNetwork';
import User from '../../models/User';
import { displayTransactionError, confirmBlockchainTransaction } from '../../lib/helpers';
import GivethWallet from '../../lib/blockchain/GivethWallet';

/**
 * The edit user profile view mapped to /profile/
 *
 * @param history      Browser history object
 * @param wallet       Wallet object with the balance and all keystores
 * @param currentUser  The current user's address
 */
class EditProfile extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      isSaving: false,

      // user model
      name: props.currentUser.name,
      avatar: props.currentUser.avatar,
      email: props.currentUser.email,
      linkedIn: props.currentUser.linkedIn,
      uploadNewAvatar: false,
      isPristine: true,
    };

    this.submit = this.submit.bind(this);
    this.setImage = this.setImage.bind(this);
    this.togglePristine = this.togglePristine.bind(this);
  }

  componentDidMount() {
    isAuthenticated(this.props.currentUser, this.props.history, this.props.wallet)
      .then(() => checkWalletBalance(this.props.wallet))
      .then(() => this.setState({ isLoading: false }))
      .catch((err) => {
        if (err === 'noBalance') this.props.history.goBack();

        // set giverId to '0'. This way we don't create 2 Givers for the same user
        else {
          this.setState({
            giverId: '0',
            isLoading: false,
          });
        }
      });
  }

  setImage(image) {
    this.setState({ avatar: image, uploadNewAvatar: true });
  }

  submit(model) {
    this.setState({ isSaving: true });


    const updateUser = (file) => {
      const constructedModel = {
        name: model.name,
        email: model.email,
        linkedIn: model.linkedIn,
        avatar: file,
        // If no giverId, set to 0 so we don't add 2 givers for the same user if they update their
        // profile before the AddGiver tx has been mined. 0 is a reserved giverId
        giverId: this.state.giverId || '0',
      };

      // TODO if (giverId > 0), need to send tx if commitTime or name has changed
      // TODO store user profile on ipfs and add Giver in liquidpledging contract
      if (this.state.giverId === undefined) {
        getNetwork()
          .then((network) => {
            const { liquidPledging } = network;

            let txHash;
            liquidPledging.addGiver(model.name, '', 259200, '0x0', { $extraGas: 50000 }) // 3 days commitTime. TODO allow user to set commitTime
              .once('transactionHash', (hash) => {
                txHash = hash;
                feathersClient.service('/users').patch(this.props.currentUser.address, constructedModel)
                  .then((user) => {
                    React.toast.success(<p>Your profile was created!<br /><a href={`${network.etherscan}tx/${txHash}`} target="_blank" rel="noopener noreferrer">View transaction</a></p>);
                    this.setState(Object.assign({}, user, { isSaving: false }));
                  });
              })
              .then(() =>
                React.toast.success(<p>You are now a registered user<br /><a href={`${network.etherscan}tx/${txHash}`} target="_blank" rel="noopener noreferrer">View transaction</a></p>))
              .catch(() => {
                // TODO: Actually inform the user about error
                displayTransactionError(txHash, network.etherscan);
              });
          });
      } else {
        feathersClient.service('/users').patch(this.props.currentUser.address, constructedModel)
          .then((user) => {
            React.toast.success('Your profile has been updated.');
            this.setState(Object.assign({}, user, { isSaving: false }));
          })
          // TODO: Actually inform the user about error
          .catch(err => console.error('update profile error -> ', err)); // eslint-disable-line no-console
      }
    };

    // Save user profile
    confirmBlockchainTransaction(
      () => {
        if (this.state.uploadNewAvatar) {
          feathersClient.service('/uploads').create({ uri: this.state.avatar }).then((file) => {
            updateUser(file.url);
          });
        } else {
          updateUser();
        }
      },
      () => this.setState({ isSaving: false }),
    );
  }

  togglePristine(currentValues, isChanged) {
    this.setState({ isPristine: !isChanged });
  }

  render() {
    const {
      isLoading, isSaving, name, email, linkedIn, avatar, isPristine,
    } = this.state;

    return (
      <div id="edit-cause-view" className="container-fluid page-layout">
        <div className="row">
          <div className="col-md-8 m-auto">
            {isLoading &&
            <Loader className="fixed" />
            }

            { !isLoading &&
              <div>
                <h3>Edit your profile</h3>
                <p>
                  <i className="fa fa-question-circle" />
                  Trust is important to run successful communities or campaigns.
                  Without trust you will likely not receive donations.
                  Therefore, we strongly recommend that you <strong>fill out your profile</strong>
                  when you want to start communities or campaigns on Giveth.
                </p>

                <Form
                  onSubmit={this.submit}
                  mapping={inputs => ({
                    name: inputs.name,
                    email: inputs.email,
                    linkedIn: inputs.linkedIn,
                  })}
                  onChange={this.togglePristine}
                  layout="vertical"
                >
                  <div className="form-group">
                    <Input
                      name="name"
                      id="name-input"
                      label="Your name"
                      type="text"
                      value={name}
                      placeholder="John Doe."
                      validations="minLength:3"
                      validationErrors={{
                        minLength: 'Please enter your name',
                      }}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <Input
                      name="email"
                      label="Email"
                      value={email}
                      placeholder="email@example.com"
                      validations="isEmail"
                      help="Please enter your email address."
                      validationErrors={{
                        isEmail: "That's not a valid email address.",
                      }}
                      required
                    />
                  </div>

                  <FormsyImageUploader setImage={this.setImage} avatar={avatar} />

                  <div className="form-group">
                    <Input
                      name="linkedIn"
                      label="LinkedIn Profile"
                      type="text"
                      value={linkedIn}
                      placeholder="Your linkedIn profile url"
                      help="Fill this out so that people can check your LinkedIn profile and ask
                        for references."
                      validations="isUrl"
                      validationErrors={{
                        isUrl: 'Please enter your linkedin profile url',
                      }}
                    />
                  </div>

                  <LoaderButton
                    className="btn btn-success"
                    formNoValidate
                    type="submit"
                    disabled={isSaving || isPristine}
                    isLoading={isSaving}
                    loadingText="Saving..."
                  >
                    Save profile
                  </LoaderButton>

                </Form>
              </div>
            }

          </div>
        </div>
      </div>
    );
  }
}

EditProfile.propTypes = {
  wallet: PropTypes.instanceOf(GivethWallet).isRequired,
  currentUser: PropTypes.instanceOf(User),
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
  }).isRequired,
};

EditProfile.defaultProps = {
  currentUser: undefined,
};

export default EditProfile;
