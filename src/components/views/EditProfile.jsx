import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import { Form, Input, Select, Row, Col } from 'antd';

import Loader from '../Loader';
import { authenticateUser, checkBalance, checkForeignNetwork } from '../../lib/middleware';
import LoaderButton from '../LoaderButton';
import User from '../../models/User';
import { history } from '../../lib/helpers';
import ErrorPopup from '../ErrorPopup';
import { Consumer as WhiteListConsumer } from '../../contextProviders/WhiteListProvider';
import { Consumer as UserConsumer } from '../../contextProviders/UserProvider';
import { Consumer as Web3Consumer } from '../../contextProviders/Web3Provider';
import Web3ConnectWarning from '../Web3ConnectWarning';
import { sendAnalyticsTracking } from '../../lib/SegmentAnalytics';
import { TracePicture } from '../EditTraceCommons';

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
      user: props.currentUser ? new User(props.currentUser) : new User(),
      oldUserData: props.currentUser ? { ...props.currentUser } : {},
      isPristine: true,
      isValid: true,
    };

    this.submit = this.submit.bind(this);
    this.checkNetwork = this.checkNetwork.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    this.mounted = true;
    this.checkNetwork();
  }

  componentDidUpdate(prevProps) {
    const { currentUser, balance, isForeignNetwork } = this.props;
    if (
      currentUser.address !== prevProps.currentUser.address ||
      isForeignNetwork !== prevProps.isForeignNetwork ||
      balance.toNumber() !== prevProps.balance.toNumber()
    ) {
      this.checkNetwork();
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  handleChange(event) {
    const { name, value } = event.target;
    const { user } = this.state;
    user[name] = value;
    if (name === 'avatar') {
      user.newAvatar = value;
    }
    this.setState({ user, isPristine: false });
  }

  checkNetwork() {
    const {
      currentUser,
      balance,
      isForeignNetwork,
      displayForeignNetRequiredWarning,
      web3,
    } = this.props;
    checkForeignNetwork(isForeignNetwork, displayForeignNetRequiredWarning)
      .then(() =>
        authenticateUser(currentUser, true, web3).then(authenticated => {
          if (!authenticated) return;
          checkBalance(balance)
            .then(() => {
              this.setState({
                isLoading: false,
                user: currentUser,
                oldUserData: { ...currentUser },
              });
            })
            .catch(err => {
              if (err === 'noBalance') {
                ErrorPopup('Something went wrong.', err);
                history.goBack();
              } else {
                this.setState({
                  isLoading: false,
                });
              }
            });
        }),
      )
      .catch(console.log);
  }

  submit() {
    const { web3 } = this.props;
    const { user, oldUserData } = this.state;

    if (!this.state.user.name) return;

    const pushToNetwork =
      user.name !== oldUserData._name ||
      user.avatar !== oldUserData._avatar ||
      user.linkedin !== oldUserData._linkedin ||
      user.email !== oldUserData._email;

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
    const reset = () => this.setState({ isSaving: false, isPristine: false });
    const afterMined = (created, url) => {
      const msg = created ? 'You are now a registered user' : 'Your profile has been updated';
      showToast(msg, url, true);

      if (created) {
        sendAnalyticsTracking('User Created', {
          category: 'User',
          action: 'created',
          userAddress: this.state.user.address,
          txUrl: url,
        });
      } else {
        if (this.mounted) this.setState({ isSaving: false });
        sendAnalyticsTracking('User Updated', {
          category: 'User',
          action: 'updated',
          userAddress: this.state.user.address,
          txUrl: url,
        });
      }
    };
    const afterSave = (created, url) => {
      if (this.mounted) this.setState({ isSaving: false, isPristine: true });
      this.props.updateUserData();

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
        this.state.user.save(afterSave, afterMined, reset, pushToNetwork, web3).finally(() => {
          this.setState({ isSaving: false });
        });
      },
    );
  }

  render() {
    const { isLoading, isSaving, user, isPristine, isValid } = this.state;
    const { currentUser } = this.props;

    return (
      <Fragment>
        <Web3ConnectWarning />
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
                    requiredMark
                    onFinish={this.submit}
                    scrollToFirstError={{
                      block: 'center',
                      behavior: 'smooth',
                    }}
                    initialValues={{
                      name: user.name,
                      email: user.email,
                      currency: user.currency,
                      linkedin: user.linkedin,
                      avatar: user.avatar,
                    }}
                  >
                    <Row>
                      <Col className="pr-sm-2" xs={24} sm={12}>
                        <Form.Item
                          name="name"
                          id="name-input"
                          label="Your name"
                          className="custom-form-item"
                          rules={[
                            {
                              required: true,
                              type: 'string',
                              min: 3,
                              message: 'Please enter your name',
                            },
                          ]}
                        >
                          <Input
                            value={user.name}
                            name="name"
                            placeholder="e.g. John Doe."
                            onChange={this.handleChange}
                            autoFocus
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="email"
                          label="Email"
                          className="custom-form-item"
                          extra="Please enter your email address."
                          id="email-input"
                          rules={[
                            {
                              type: 'email',
                              message: "Oops, that's not a valid email address.",
                            },
                          ]}
                        >
                          <Input
                            value={user.email}
                            name="email"
                            placeholder="e.g. email@example.com"
                            onChange={this.handleChange}
                          />
                        </Form.Item>
                      </Col>
                      <Col className="pr-sm-2" xs={24} sm={12}>
                        <WhiteListConsumer>
                          {({ state: { nativeCurrencyWhitelist } }) => (
                            <Form.Item
                              name="currency"
                              label="Native Currency"
                              className="custom-form-item"
                              extra="Please enter your native currency."
                            >
                              <Select
                                name="currency"
                                value={user.currency}
                                onSelect={e =>
                                  this.handleChange({
                                    target: { value: e, name: 'currency' },
                                  })
                                }
                                style={{ minWidth: '200px' }}
                              >
                                {nativeCurrencyWhitelist.map(item => (
                                  <Select.Option value={item.symbol} key={item.symbol}>
                                    {item.symbol}
                                  </Select.Option>
                                ))}
                              </Select>
                            </Form.Item>
                          )}
                        </WhiteListConsumer>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="linkedin"
                          extra="Provide a link to some more info about you, this will help to build trust. You could add your linkedin profile, Twitter account or a relevant website."
                          label="Your Profile"
                          className="custom-form-item"
                          id="linkedin-input"
                          rules={[
                            {
                              type: 'url',
                              message: 'Please enter a valid url',
                            },
                          ]}
                        >
                          <Input
                            value={user.linkedin}
                            name="linkedin"
                            placeholder="Your profile url"
                            onChange={this.handleChange}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <TracePicture
                      setPicture={address =>
                        this.handleChange({
                          target: {
                            name: 'avatar',
                            value: address,
                          },
                        })
                      }
                      traceTitle={user.name}
                      picture={user.avatar}
                    />

                    <LoaderButton
                      className="btn btn-success"
                      type="submit"
                      network="Foreign"
                      disabled={
                        !isValid ||
                        isSaving ||
                        isPristine ||
                        (currentUser.address && currentUser.giverId === 0)
                      }
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
      </Fragment>
    );
  }
}

EditProfile.propTypes = {
  currentUser: PropTypes.instanceOf(User),
  balance: PropTypes.instanceOf(BigNumber),
  isForeignNetwork: PropTypes.bool.isRequired,
  displayForeignNetRequiredWarning: PropTypes.func.isRequired,
  updateUserData: PropTypes.func,
  web3: PropTypes.instanceOf(Web3).isRequired,
};

EditProfile.defaultProps = {
  currentUser: {},
  updateUserData: () => {},
  balance: new BigNumber(0),
};

export default props => (
  <UserConsumer>
    {({ state: { currentUser }, actions: { updateUserData } }) => (
      <Web3Consumer>
        {({ state: { web3 } }) => (
          <Fragment>
            <EditProfile
              web3={web3}
              currentUser={currentUser}
              updateUserData={updateUserData}
              {...props}
            />
          </Fragment>
        )}
      </Web3Consumer>
    )}
  </UserConsumer>
);
