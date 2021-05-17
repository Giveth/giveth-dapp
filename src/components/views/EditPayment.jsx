import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { Button, Checkbox, Col, Form, notification, PageHeader, Row } from 'antd';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';

import Web3ConnectWarning from '../Web3ConnectWarning';
import {
  MilestoneCampaignInfo,
  MilestoneDatePicker,
  MilestoneDescription,
  MilestoneDonateToDac,
  MilestoneFiatAmountCurrency,
  MilestonePicture,
  MilestoneRecipientAddress,
  MilestoneTitle,
  MilestoneToken,
} from '../EditMilestoneCommons';
import { Context as UserContext } from '../../contextProviders/UserProvider';
import { convertEthHelper, getStartOfDayUTC, history, isOwner } from '../../lib/helpers';
import ErrorHandler from '../../lib/ErrorHandler';
import { Context as ConversionRateContext } from '../../contextProviders/ConversionRateProvider';
import { authenticateUser } from '../../lib/middleware';
import config from '../../configuration';
import { Milestone } from '../../models';
import { MilestoneService } from '../../services';
import { Context as Web3Context } from '../../contextProviders/Web3Provider';

const WAIT_INTERVAL = 1000;

function EditPayment(props) {
  const {
    state: { currentUser },
  } = useContext(UserContext);

  const {
    actions: { getConversionRates },
  } = useContext(ConversionRateContext);

  const {
    state: { isForeignNetwork },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const [form] = Form.useForm();

  const { milestoneId } = props.match.params;

  const [payment, setPayment] = useState({
    title: '',
    fiatAmount: 0,
    selectedFiatType: '',
    token: {},
    date: getStartOfDayUTC().subtract(1, 'd'),
    description: '',
    recipientAddress: '',
    conversionRateTimestamp: undefined,
  });

  const [initialValues, setInitialValues] = useState({
    title: '',
    description: '',
    donateToDac: true,
    token: {},
    recipientAddress: '',
  });

  const [milestone, setMilestone] = useState();
  const [campaign, setCampaign] = useState();
  const [loading, setLoading] = useState(false);
  const [userIsCampaignOwner, setUserIsOwner] = useState(false);
  const [maxAmount, setMaxAmount] = useState(new BigNumber(0));
  const [loadingRate, setLoadingRate] = useState(false);
  const [loadingAmount, setLoadingAmount] = useState(false);

  const timer = useRef();
  const isMounted = useRef(true);
  const conversionRateTimestamp = useRef();
  const [submitButtonText, setSubmitButtonText] = useState('Propose');

  const milestoneHasFunded =
    milestone && milestone.donationCounters && milestone.donationCounters.length > 0;

  const isProposed =
    milestone &&
    milestone.status &&
    [Milestone.PROPOSED, Milestone.REJECTED].includes(milestone.status);

  useEffect(() => {
    if (loadingAmount) {
      setSubmitButtonText('Loading Amount');
    } else {
      setSubmitButtonText('Update Payment');
    }
  }, [loadingAmount, userIsCampaignOwner]);

  useEffect(() => {
    setUserIsOwner(
      campaign &&
        currentUser.address &&
        [campaign.ownerAddress, campaign.coownerAddress].includes(currentUser.address),
    );
  }, [campaign, currentUser]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);

  const goBack = () => {
    props.history.goBack();
  };

  const isEditNotAllowed = ms => {
    return (
      ms.formType !== Milestone.PAYMENTTYPE ||
      !(isOwner(ms.owner.address, currentUser) || isOwner(ms.campaign.ownerAddress, currentUser)) ||
      ms.donationCounters.length > 0
    );
  };

  useEffect(() => {
    if (milestone) {
      if (isEditNotAllowed(milestone)) {
        goBack();
      }
    } else if (currentUser.id) {
      MilestoneService.get(milestoneId)
        .then(res => {
          if (isEditNotAllowed(res)) {
            goBack();
          } else {
            const imageUrl = res.image ? res.image.match(/\/ipfs\/.*/)[0] : '';
            const capped = !!res.maxAmount;
            const iValues = {
              title: res.title,
              description: res.description,
              donateToDac: !!res.dacId,
              token: res.token,
              fiatAmount: res.fiatAmount ? res.fiatAmount.toNumber() : 0,
              selectedFiatType: res.selectedFiatType,
              recipientAddress: res.recipientAddress,
              notCapped: !capped,
              image: imageUrl,
              date: res.date,
            };
            setInitialValues(iValues);
            setPayment(iValues);
            setMilestone(res);
            setCampaign(res.campaign);
          }
        })
        .catch(err => {
          const message = `Sadly we were unable to load the requested Milestone details. Please try again.`;
          ErrorHandler(err, message);
        });
    }
  }, [currentUser.id]);

  // Update item of this item in milestone token
  const updateAmount = () => {
    const { token, selectedFiatType, date, fiatAmount } = payment;
    if (!token.symbol || !selectedFiatType || payment.notCapped) return;

    setLoadingAmount(true);
    if (timer.current) {
      clearTimeout(timer.current);
    }

    timer.current = setTimeout(async () => {
      try {
        setLoadingRate(true);
        const res = await getConversionRates(date, token.symbol, selectedFiatType);
        const rate = res.rates[selectedFiatType];
        if (rate && isMounted.current) {
          conversionRateTimestamp.current = res.timestamp;
          setMaxAmount(new BigNumber(fiatAmount).div(rate));
        } else {
          throw new Error('Rate not found');
        }
      } catch (e) {
        const message = `Sadly we were unable to get the exchange rate. Please try again after refresh.`;

        ErrorHandler(e, message);
        setMaxAmount(0);
      } finally {
        setLoadingRate(false);
        setLoadingAmount(false);
      }
    }, WAIT_INTERVAL);
  };

  useEffect(() => {
    updateAmount();
  }, [
    payment.token,
    payment.fiatAmount,
    payment.date,
    payment.selectedFiatType,
    payment.notCapped,
  ]);

  const handleInputChange = event => {
    const { name, value, type, checked } = event.target;
    if (type === 'checkbox') {
      setPayment({ ...payment, [name]: checked });
    } else {
      setPayment({ ...payment, [name]: value });
    }
  };

  const handleSelectCurrency = (_, option) => {
    handleInputChange({
      target: { name: 'selectedFiatType', value: option.value },
    });
  };

  const handleSelectToken = token => {
    handleInputChange({
      target: { name: 'token', value: token },
    });
  };

  const handleDatePicker = dateString => {
    handleInputChange({ target: { name: 'date', value: dateString } });
  };

  const setPicture = address => {
    handleInputChange({ target: { name: 'image', value: address } });
  };

  const submit = async () => {
    const authenticated = await authenticateUser(currentUser, false);

    if (authenticated) {
      if (userIsCampaignOwner && !isForeignNetwork) {
        displayForeignNetRequiredWarning();
        return;
      }

      const {
        title,
        description,
        image,
        recipientAddress,
        notCapped,
        fiatAmount,
        selectedFiatType,
        token,
        date,
        donateToDac,
      } = payment;

      const ms = milestone;

      ms.parentProjectId = campaign.projectId;
      ms.title = title;
      ms.description = description;
      ms.recipientAddress = recipientAddress;
      ms.image = image;
      ms.token = token;
      ms.dacId = donateToDac ? config.defaultDacId : 0;

      // TODO: We should have ability to delete fiatAmount for uncapped milestones
      if (!notCapped) {
        ms.maxAmount = maxAmount;
        ms.date = date;
        ms.fiatAmount = new BigNumber(fiatAmount);
        ms.selectedFiatType = selectedFiatType;
        ms.conversionRateTimestamp = conversionRateTimestamp.current;
      } else {
        ms.maxAmount = undefined;
        ms.fiatAmount = new BigNumber(0);
        ms.selectedFiatType = '';
        ms.conversionRateTimestamp = undefined;
      }

      ms.status =
        isProposed || milestone.status === Milestone.REJECTED
          ? Milestone.PROPOSED
          : milestone.status; // make sure not to change status!

      setLoading(true);

      await MilestoneService.save({
        milestone: ms,
        from: currentUser.address,
        afterSave: (created, txUrl, res) => {
          let notificationDescription;
          if (created) {
            if (!userIsCampaignOwner) {
              notificationDescription = 'Payment proposed to the campaign owner';
            }
          } else if (txUrl) {
            notificationDescription = (
              <p>
                Your Payment is pending....
                <br />
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  View transaction
                </a>
              </p>
            );
          } else {
            notificationDescription = 'Your Payment has been updated!';
          }

          if (notificationDescription) {
            notification.info({ description: notificationDescription });
          }
          setLoading(false);
          history.push(`/campaigns/${campaign._id}/milestones/${res._id}`);
        },
        afterMined: (created, txUrl) => {
          notification.success({
            description: (
              <p>
                Your Payment has been updated!
                <br />
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  View transaction
                </a>
              </p>
            ),
          });
        },
        onError(message, err) {
          setLoading(false);
          return ErrorHandler(err, message);
        },
      });
    }
  };

  return (
    <Fragment>
      <Web3ConnectWarning />
      <div id="create-payment-view">
        <Row>
          <Col span={24}>
            <PageHeader
              className="site-page-header"
              onBack={goBack}
              title="Edit Payment"
              ghost={false}
            />
          </Col>
        </Row>
        <Row>
          <div className="card-form-container">
            {campaign && (
              <Form
                className="card-form"
                requiredMark
                initialValues={initialValues}
                onFinish={submit}
                form={form}
                scrollToFirstError={{
                  block: 'center',
                  behavior: 'smooth',
                }}
              >
                <div className="card-form-header">
                  <img src={`${process.env.PUBLIC_URL}/img/payment.png`} alt="payment-logo" />
                  <div className="title">Payment</div>
                </div>

                <MilestoneCampaignInfo campaign={campaign} />

                <MilestoneTitle
                  value={payment.title}
                  onChange={handleInputChange}
                  extra="What are you going to accomplish in this Milestone?"
                  disabled={milestoneHasFunded}
                />

                <div className="section">
                  <div className="title">Payment details</div>

                  <Row>
                    <Form.Item className="custom-form-item">
                      <Checkbox
                        name="notCapped"
                        checked={payment.notCapped}
                        onChange={handleInputChange}
                        disabled={!isProposed}
                      >
                        No limits
                      </Checkbox>
                    </Form.Item>
                  </Row>

                  {!payment.notCapped && (
                    <Fragment>
                      <MilestoneFiatAmountCurrency
                        onCurrencyChange={handleSelectCurrency}
                        onAmountChange={handleInputChange}
                        amount={payment.fiatAmount}
                        currency={payment.selectedFiatType}
                        disabled={loadingRate || !isProposed}
                        initialValues={initialValues}
                      />
                      <MilestoneDatePicker
                        onChange={handleDatePicker}
                        value={payment.date}
                        disabled={loadingRate || !isProposed}
                      />
                    </Fragment>
                  )}

                  <MilestoneDescription
                    onChange={handleInputChange}
                    value={payment.description}
                    extra="Describe how you are going to execute this milestone successfully..."
                    placeholder="e.g. Monthly salary"
                    id="description"
                    disabled={milestoneHasFunded}
                  />

                  <MilestonePicture
                    setPicture={setPicture}
                    milestoneTitle={payment.title}
                    picture={payment.image}
                  />

                  <MilestoneDonateToDac
                    value={payment.donateToDac}
                    onChange={handleInputChange}
                    disabled={!isProposed}
                  />
                </div>

                <div className="section">
                  <div className="title">Payment options</div>

                  <MilestoneToken
                    label="Payment currency"
                    onChange={handleSelectToken}
                    includeAnyToken={payment.notCapped}
                    totalAmount={convertEthHelper(maxAmount, payment.token.decimals)}
                    hideTotalAmount={payment.notCapped}
                    value={payment.token}
                    initialValue={initialValues.token}
                    disabled={!isProposed}
                  />

                  <MilestoneRecipientAddress
                    label="Pay to wallet address"
                    onChange={handleInputChange}
                    value={payment.recipientAddress}
                    disabled={!isProposed}
                  />
                </div>
                <Form.Item>
                  <Button
                    block
                    size="large"
                    type="primary"
                    htmlType="submit"
                    loading={loading || loadingAmount}
                  >
                    {submitButtonText}
                  </Button>
                </Form.Item>
              </Form>
            )}
          </div>
        </Row>
      </div>
    </Fragment>
  );
}

EditPayment.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  }).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      milestoneId: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

export default EditPayment;
