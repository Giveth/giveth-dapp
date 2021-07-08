import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { Button, Checkbox, Col, Form, notification, PageHeader, Row } from 'antd';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import useCampaign from '../../hooks/useCampaign';
// import { Context as ConversionRateContext } from '../../contextProviders/ConversionRateProvider';
import { Context as WhiteListContext } from '../../contextProviders/WhiteListProvider';
import Web3ConnectWarning from '../Web3ConnectWarning';
import {
  TraceCampaignInfo,
  TraceDatePicker,
  TraceDescription,
  TraceDonateToCommunity,
  TraceFiatAmountCurrency,
  TracePicture,
  TraceRecipientAddress,
  TraceTitle,
  TraceToken,
} from '../EditTraceCommons';
import { Context as UserContext } from '../../contextProviders/UserProvider';
import { Context as ConversionRateContext } from '../../contextProviders/ConversionRateProvider';
import { Context as Web3Context } from '../../contextProviders/Web3Provider';
import { Context as NotificationContext } from '../../contextProviders/NotificationModalProvider';
import { convertEthHelper, getStartOfDayUTC, history, ZERO_ADDRESS } from '../../lib/helpers';
import ErrorHandler from '../../lib/ErrorHandler';
import { authenticateUser } from '../../lib/middleware';
import BridgedTrace from '../../models/BridgedTrace';
import config from '../../configuration';
import { Trace } from '../../models';
import { TraceService } from '../../services';

const WAIT_INTERVAL = 1000;

function CreatePayment(props) {
  const {
    state: { fiatWhitelist },
  } = useContext(WhiteListContext);

  const {
    state: { currentUser },
  } = useContext(UserContext);

  const {
    actions: { getConversionRates },
  } = useContext(ConversionRateContext);

  const {
    state: { isForeignNetwork, web3 },
    actions: { displayForeignNetRequiredWarning },
  } = useContext(Web3Context);

  const {
    actions: { minPayoutWarningInCreatEdit },
  } = useContext(NotificationContext);

  const [form] = Form.useForm();

  const { id: campaignId, slug: campaignSlug } = props.match.params;
  const campaign = useCampaign(campaignId, campaignSlug);

  const [payment, setPayment] = useState({
    title: '',
    fiatAmount: 0,
    currency: '',
    token: {},
    date: getStartOfDayUTC().subtract(1, 'd'),
    description: '',
    picture: '',
    donateToCommunity: true,
    recipientAddress: '',
    notCapped: false,
    conversionRateTimestamp: undefined,
  });

  const [loading, setLoading] = useState(false);
  const [userIsCampaignOwner, setUserIsOwner] = useState(false);
  const [maxAmount, setMaxAmount] = useState(new BigNumber(0));
  const [loadingRate, setLoadingRate] = useState(false);
  const [loadingAmount, setLoadingAmount] = useState(false);

  const timer = useRef();
  const isMounted = useRef(true);
  const conversionRateTimestamp = useRef();
  const [submitButtonText, setSubmitButtonText] = useState('Propose');

  useEffect(() => {
    if (loadingAmount) {
      setSubmitButtonText('Loading Amount');
    } else {
      setSubmitButtonText(userIsCampaignOwner ? 'Create' : 'Propose');
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

  useEffect(() => {
    if (currentUser.address && !payment.recipientAddress) {
      setPayment({
        ...payment,
        recipientAddress: currentUser.address,
      });
      form.setFieldsValue({ recipientAddress: currentUser.address });
    }
  }, [currentUser]);

  // Update item of this item in trace token
  const updateAmount = () => {
    const { token, currency, date, fiatAmount, notCapped } = payment;
    if (!token.symbol || !currency || notCapped) return;

    setLoadingAmount(true);
    if (timer.current) {
      clearTimeout(timer.current);
    }

    timer.current = setTimeout(async () => {
      try {
        setLoadingRate(true);
        const res = await getConversionRates(date, token.symbol, currency);
        const rate = res.rates[currency];
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
  }, [payment.token, payment.fiatAmount, payment.date, payment.currency]);

  const handleInputChange = event => {
    const { name, value, type, checked } = event.target;
    if (type === 'checkbox') {
      setPayment({ ...payment, [name]: checked });
    } else {
      setPayment({ ...payment, [name]: value });
    }
  };

  const handleSelectCurrency = (_, option) => {
    handleInputChange({ target: { name: 'currency', value: option.value } });
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
    handleInputChange({ target: { name: 'picture', value: address } });
  };

  const goBack = () => {
    props.history.goBack();
  };

  const submit = async () => {
    const authenticated = await authenticateUser(currentUser, false, web3);

    if (authenticated) {
      if (userIsCampaignOwner && !isForeignNetwork) {
        displayForeignNetRequiredWarning();
        return;
      }

      const {
        title,
        description,
        picture,
        recipientAddress,
        notCapped,
        fiatAmount,
        currency,
        token,
        date,
        donateToCommunity,
      } = payment;

      const ms = new BridgedTrace({
        title,
        description,
        recipientAddress,
        token,
        image: picture,
        reviewerAddress: ZERO_ADDRESS,
      });

      ms.ownerAddress = currentUser.address;
      ms.campaignId = campaign._id;
      ms.parentProjectId = campaign.projectId;
      ms.formType = Trace.PAYMENTTYPE;

      if (donateToCommunity) {
        ms.communityId = config.defaultCommunityId;
      }

      if (!notCapped) {
        ms.maxAmount = maxAmount;
        ms.date = date;
        ms.fiatAmount = new BigNumber(fiatAmount);
        ms.selectedFiatType = currency;
        ms.conversionRateTimestamp = conversionRateTimestamp.current;
      }

      if (!userIsCampaignOwner) {
        ms.status = Trace.PROPOSED;
      }

      setLoading(true);

      await TraceService.save({
        trace: ms,
        from: currentUser.address,
        afterSave: (created, txUrl, res) => {
          let notificationDescription;
          const analyticsData = {
            formType: 'payment',
            id: res._id,
            title: ms.title,
            campaignTitle: campaign.title,
          };
          if (created) {
            if (!userIsCampaignOwner) {
              notificationDescription = 'Payment proposed to the Campaign Owner';
              window.analytics.track('Trace Create', {
                action: 'proposed',
                ...analyticsData,
              });
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
            window.analytics.track('Trace Create', {
              action: 'created',
              ...analyticsData,
            });
          } else {
            const notificationError =
              'It seems your Payment has been updated!, this should not be happened';
            notification.error({ description: notificationError });
          }

          if (notificationDescription) {
            notification.info({ description: notificationDescription });
          }
          setLoading(false);
          history.push(`/campaigns/${campaign._id}/traces/${res._id}`);
        },
        afterMined: (created, txUrl) => {
          notification.success({
            description: (
              <p>
                Your Payment has been created!
                <br />
                <a href={txUrl} target="_blank" rel="noopener noreferrer">
                  View transaction
                </a>
              </p>
            ),
          });
        },
        onError(message, err, isLessThanMinPayout) {
          setLoading(false);
          if (isLessThanMinPayout) {
            return minPayoutWarningInCreatEdit();
          }
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
              title="Create New Payment"
              ghost={false}
            />
          </Col>
        </Row>
        <Row>
          <div className="card-form-container">
            <Form
              className="card-form"
              requiredMark
              initialValues={{
                currency: fiatWhitelist[0] || 'USD',
              }}
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

              <TraceCampaignInfo campaign={campaign} />

              <TraceTitle
                value={payment.title}
                onChange={handleInputChange}
                extra="What are you going to accomplish in this Trace?"
              />

              <div className="section">
                <div className="title">Payment details</div>

                <Row>
                  <Form.Item className="custom-form-item">
                    <Checkbox
                      name="notCapped"
                      checked={payment.notCapped}
                      onChange={handleInputChange}
                    >
                      No limits
                    </Checkbox>
                  </Form.Item>
                </Row>

                {!payment.notCapped && (
                  <Fragment>
                    <TraceFiatAmountCurrency
                      onCurrencyChange={handleSelectCurrency}
                      onAmountChange={handleInputChange}
                      amount={payment.fiatAmount}
                      currency={payment.currency}
                      disabled={loadingRate}
                    />
                    <TraceDatePicker
                      onChange={handleDatePicker}
                      value={payment.date}
                      disabled={loadingRate}
                    />
                  </Fragment>
                )}

                <TraceDescription
                  onChange={handleInputChange}
                  value={payment.description}
                  extra="Describe how you are going to execute this trace successfully..."
                  placeholder="e.g. Monthly salary"
                  id="description"
                />

                <TracePicture
                  setPicture={setPicture}
                  traceTitle={payment.title}
                  picture={payment.picture}
                />

                <TraceDonateToCommunity
                  value={payment.donateToCommunity}
                  onChange={handleInputChange}
                />
              </div>

              <div className="section">
                <div className="title">Payment options</div>
                <TraceToken
                  label="Payment currency"
                  onChange={handleSelectToken}
                  includeAnyToken={payment.notCapped}
                  totalAmount={convertEthHelper(maxAmount, payment.token.decimals)}
                  hideTotalAmount={payment.notCapped}
                  value={payment.token}
                />

                <TraceRecipientAddress
                  label="Pay to wallet address"
                  onChange={handleInputChange}
                  value={payment.recipientAddress}
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
          </div>
        </Row>
      </div>
    </Fragment>
  );
}

CreatePayment.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  }).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
      slug: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

export default CreatePayment;
