import React, { Component } from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';

import { Form, Input } from 'formsy-react-components';
import GA from 'lib/GoogleAnalytics';
import Loader from '../Loader';
import FormsyImageUploader from '../FormsyImageUploader';
import { checkBalance, checkForeignNetwork, isLoggedIn } from '../../lib/middleware';
import LoaderButton from '../LoaderButton';
import User from '../../models/User';
import { history } from '../../lib/helpers';
import ErrorPopup from '../ErrorPopup';

/**
 * The edit user profile view mapped to /profile/
 *
 * @param currentUser  The current user's address
 */
class EditProfile extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      isSaving: false,

      // user model
      user: props.currentUser ? new User(props.currentUser) : new User(),
      isPristine: true,
    };

    this.submit = this.submit.bind(this);
    this.setImage = this.setImage.bind(this);
    this.togglePristine = this.togglePristine.bind(this);
  }

  componentDidMount() {
    this.mounted = true;
    const { currentUser, balance, isForeignNetwork, displayForeignNetRequiredWarning } = this.props;
    checkForeignNetwork(isForeignNetwork, displayForeignNetRequiredWarning)
      .then(() =>
        isLoggedIn(currentUser, true)
          .then(() => checkBalance(balance))
          .then(() => this.setState({ isLoading: false }))
          .catch(err => {
            if (err === 'noBalance') {
              ErrorPopup('Something went wrong.', err);
              history.goBack();
            } else {
              this.setState({
                isLoading: false,
              });
            }
          }),
      )
      .catch(() => {});
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  setImage(image) {
    const { user } = this.state;
    user.newAvatar = image;
    this.setState({ user, isPristine: false });
  }

  submit() {
    // Save user profile
    const showToast = (msg, url, isSuccess = false) => {
      const toast = url ? (
        <p>
          {msg}
          <br />
          <a href={url} target="_blank" rel="noopener noreferrer">
            View transaction
          </a>
        </p>
      ) : (
        msg
      );

      if (isSuccess) React.toast.success(toast);
      else React.toast.info(toast);
    };

    const afterMined = (created, url) => {
      const msg = created ? 'You are now a registered user' : 'Your profile has been updated';
      showToast(msg, url, true);

      if (created) {
        GA.trackEvent({
          category: 'User',
          action: 'created',
          label: this.state.user.address,
        });
      } else {
        if (this.mounted) this.setState({ isSaving: false });
        GA.trackEvent({
          category: 'User',
          action: 'updated',
          label: this.state.user.address,
        });
      }
    };
    const afterSave = (created, url) => {
      if (this.mounted) this.setState({ isSaving: false });

      const msg = created ? 'We are registering you as a user' : 'Your profile is being updated';
      showToast(msg, url);

      if (created) history.push('/');
    };

    this.setState(
      {
        isSaving: true,
      },
      () => {
        // Save the User
        this.state.user.save(afterSave, afterMined);
      },
    );
  }

  togglePristine(currentValues, isChanged) {
    this.setState({ isPristine: !isChanged });
  }

  render() {
    const { isLoading, isSaving, user, isPristine } = this.state;
    const { currentUser } = this.props;

    return (
      <div id="edit-cause-view" className="container-fluid page-layout">
        <div className="row">
          <div className="col-md-8 m-auto">
            {isLoading && <Loader className="fixed" />}

            {!isLoading && (
              <div>
                <h3>Edit your profile</h3>
                <p>
                  <i className="fa fa-question-circle" />
                  Trust is important to run successful Communities or Campaigns. Without trust you
                  will likely not receive donations. Therefore, we strongly recommend that you{' '}
                  <strong>fill out your profile </strong>
                  when you want to start Communities or Campaigns on Giveth.
                </p>
                <div className="alert alert-warning">
                  <i className="fa fa-exclamation-triangle" />
                  Please note that all the information entered will be stored on a publicly
                  accessible permanent storage like blockchain. We are not able to erase or alter
                  any of the information. Do not input anything that you do not have permission to
                  share or you are not comfortable with being forever accessible.
                </div>

                <Form
                  onSubmit={this.submit}
                  mapping={inputs => {
                    user.name = inputs.name;
                    user.email = inputs.email;
                    user.linkedin = inputs.linkedin;
                  }}
                  onChange={this.togglePristine}
                  layout="vertical"
                >
                  <div className="form-group">
                    <Input
                      name="name"
                      autoComplete="name"
                      id="name-input"
                      label="Your name"
                      type="text"
                      value={user.name}
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
                      autoComplete="email"
                      label="Email"
                      value={user.email}
                      placeholder="email@example.com"
                      validations="isEmail"
                      help="Please enter your email address."
                      validationErrors={{
                        isEmail: "Oops, that's not a valid email address.",
                      }}
                    />
                  </div>

                  <FormsyImageUploader
                    setImage={this.setImage}
                    avatar={user.avatar}
                    aspectRatio={1}
                  />

                  <div className="form-group">
                    <Input
                      name="linkedin"
                      label="Your Profile"
                      type="text"
                      value={user.linkedin}
                      placeholder="Your profile url"
                      help="Provide a link to some more info about you, this will help to build trust. You could add your linkedin profile, Twitter account or a relevant website."
                      validations="isUrl"
                      validationErrors={{
                        isUrl: 'Please enter a valid url',
                      }}
                    />
                  </div>

                  <LoaderButton
                    className="btn btn-success"
                    formNoValidate
                    type="submit"
                    network="Foreign"
                    disabled={isSaving || isPristine || (currentUser && currentUser.giverId === 0)}
                    isLoading={isSaving}
                    loadingText="Saving..."
                  >
                    Save profile
                  </LoaderButton>
                </Form>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

EditProfile.propTypes = {
  currentUser: PropTypes.instanceOf(User),
  balance: PropTypes.instanceOf(BigNumber).isRequired,
  isForeignNetwork: PropTypes.bool.isRequired,
  displayForeignNetRequiredWarning: PropTypes.func.isRequired,
};

EditProfile.defaultProps = {
  currentUser: undefined,
};

export default EditProfile;
