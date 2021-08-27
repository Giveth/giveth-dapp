import React, { Fragment, useContext, useEffect, useState } from 'react';
import { Form, Input, Select, Row, Col } from 'antd';

import Loader from '../Loader';
import { authenticateUser, checkBalance, checkForeignNetwork } from '../../lib/middleware';
import LoaderButton from '../LoaderButton';
import User from '../../models/User';
import { history } from '../../lib/helpers';
import { Consumer as WhiteListConsumer } from '../../contextProviders/WhiteListProvider';
import { Context as UserContext } from '../../contextProviders/UserProvider';
import { Context as Web3Context } from '../../contextProviders/Web3Provider';
import Web3ConnectWarning from '../Web3ConnectWarning';
import UploadPicture from '../UploadPicture';
import ErrorHandler from '../../lib/ErrorHandler';

/**
 * The edit user profile view mapped to /profile/
 */
const EditProfile = () => {
  const {
    state: { currentUser },
    actions: { updateUserData },
  } = useContext(UserContext);
  const {
    state: { isForeignNetwork, web3, balance },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState(new User(currentUser));
  const [oldUserData, setOldUserData] = useState({ ...currentUser });
  const [isPristine, setIsPristine] = useState(true);
  const [mounted, setMounted] = useState(true);

  const balanceNum = balance && balance.toNumber();
  const isBalance = !!balanceNum;
  const [form] = Form.useForm();

  const handleChange = event => {
    const { name, value } = event.target;
    const _user = new User(user);
    _user[name] = value;
    if (name === 'avatar') {
      _user.newAvatar = value;
    }
    setUser(_user);
    if (isPristine) setIsPristine(false);
  };

  const setPicture = address => {
    handleChange({
      target: {
        name: 'avatar',
        value: address,
      },
    });
  };

  const checkNetwork = () => {
    checkForeignNetwork(isForeignNetwork, displayForeignNetRequiredWarning)
      .then(() =>
        authenticateUser(currentUser, true, web3).then(authenticated => {
          if (!authenticated) return;
          checkBalance(balance)
            .then(() => {
              setUser(currentUser);
              setOldUserData({ ...currentUser });
              setIsLoading(false);
              form.setFieldsValue({
                name: currentUser.name,
                email: currentUser.email,
                currency: currentUser.currency,
                linkedin: currentUser.linkedin,
                avatar: currentUser.avatar,
              });
            })
            .catch(err => {
              ErrorHandler(err, 'Something went wrong on getting user balance.');
              setIsLoading(false);
            });
        }),
      )
      .catch(console.log);
  };

  useEffect(() => {
    if (currentUser.address && balanceNum !== undefined) {
      checkNetwork();
    }
    return setMounted(false);
  }, [currentUser.address, isForeignNetwork, isBalance]);

  const submit = () => {
    if (!user.name) return;

    const created = !oldUserData._giverId;

    const pushToNetwork =
      user.name !== oldUserData._name ||
      user.avatar !== oldUserData._avatar ||
      user.linkedin !== oldUserData._linkedin ||
      user.email !== oldUserData._email;

    const reset = () => {
      setIsSaving(false);
      setIsPristine(false);
    };

    const afterMined = () => {
      if (!created) {
        setOldUserData({ ...user });
        setIsPristine(true);
        if (mounted) setIsSaving(false);
      }
    };

    const afterSave = () => {
      if (mounted) {
        setIsSaving(false);
        setIsPristine(true);
      }
      updateUserData();

      if (created) history.push('/');
    };

    setIsSaving(true);
    user.save(pushToNetwork, web3, afterSave, afterMined, reset).finally(() => {
      setIsSaving(false);
    });
  };

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
                  onFinish={submit}
                  form={form}
                  scrollToFirstError={{
                    block: 'center',
                    behavior: 'smooth',
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
                          value={user.name || ''}
                          name="name"
                          placeholder="e.g. John Doe."
                          onChange={handleChange}
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
                          onChange={handleChange}
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
                                handleChange({
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
                          onChange={handleChange}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <UploadPicture
                    setPicture={setPicture}
                    picture={user.avatar || ''}
                    aspectRatio={1}
                    imgAlt={user.name || ''}
                  />

                  <LoaderButton
                    className="ant-btn-donate ant-btn-lg"
                    onClick={submit}
                    network="Foreign"
                    disabled={
                      isSaving || isPristine || (currentUser.address && currentUser.giverId === 0)
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
};

export default EditProfile;
