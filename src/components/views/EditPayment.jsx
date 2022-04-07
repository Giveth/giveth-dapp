import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { Button, Checkbox, Col, Form, PageHeader, Row } from 'antd';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';

import Web3ConnectWarning from '../Web3ConnectWarning';
import {
  TraceCampaignInfo,
  TraceDatePicker,
  TraceDescription,
  TraceDonateToCommunity,
  TraceFiatAmountCurrency,
  TraceRecipientAddress,
  TraceTitle,
  TraceToken,
} from '../EditTraceCommons';
import { Context as UserContext } from '../../contextProviders/UserProvider';
import { Context as ConversionRateContext } from '../../contextProviders/ConversionRateProvider';
import { Context as Web3Context } from '../../contextProviders/Web3Provider';
import { Context as NotificationContext } from '../../contextProviders/NotificationModalProvider';
import { convertEthHelper, getStartOfDayUTC, history, isOwner } from '../../lib/helpers';
import ErrorHandler from '../../lib/ErrorHandler';
import { authenticateUser } from '../../lib/middleware';
import config from '../../configuration';
import { Trace } from '../../models';
import { TraceService } from '../../services';
import UploadPicture from '../UploadPicture';
import { TraceSave } from '../../lib/traceSave';

const WAIT_INTERVAL = 1000;

function EditPayment(props) {
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

  const { traceId } = props.match.params;

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
  const [initialValues, setInitialValues] = useState(undefined);
  const [trace, setTrace] = useState();
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

  const traceHasFunded = trace && trace.donationCounters && trace.donationCounters.length > 0;

  const isProposed =
    trace && trace.status && [Trace.PROPOSED, Trace.REJECTED].includes(trace.status);

  useEffect(() => {
    if (loadingAmount) {
      setSubmitButtonText('Loading Amount');
    } else {
      setSubmitButtonText('Update Payment');
    }
  }, [loadingAmount, userIsCampaignOwner]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);

  const goBack = () => {
    history.goBack();
  };

  const isEditNotAllowed = ms => {
    return (
      ms.formType !== Trace.PAYMENTTYPE ||
      !(
        isOwner(ms.owner.address, currentUser) ||
        isOwner(ms.campaign.ownerAddress, currentUser) ||
        isOwner(ms.campaign.coownerAddress, currentUser)
      ) ||
      ms.donationCounters.length > 0
    );
  };

  useEffect(() => {
    if (currentUser.address) {
      authenticateUser(currentUser, false, web3).then(auth => {
        if (!auth) history.goBack();
      });
    }

    if (trace) {
      setUserIsOwner(
        [campaign.ownerAddress, campaign.coownerAddress].includes(currentUser.address),
      );
      if (isEditNotAllowed(trace)) {
        ErrorHandler({}, 'You are not allowed to edit.');
        goBack();
      }
    } else if (currentUser.address) {
      TraceService.get(traceId)
        .then(res => {
          if (isEditNotAllowed(res)) {
            ErrorHandler({}, 'You are not allowed to edit.');
            goBack();
          } else {
            const imageUrl = res.image ? res.image.match(/\/ipfs\/.*/)[0] : '';
            const capped = !!res.maxAmount;
            const iValues = {
              title: res.title,
              description: res.description,
              donateToCommunity: !!res.communityId,
              token: res.token,
              fiatAmount: res.fiatAmount ? res.fiatAmount.toNumber() : 0,
              selectedFiatType: res.selectedFiatType,
              recipientAddress: res.recipientAddress,
              notCapped: !capped,
              image: imageUrl,
              date: res.date,
            };
            const _campaign = res.campaign;
            setInitialValues(iValues);
            setPayment(iValues);
            setTrace(res);
            setCampaign(_campaign);
            setUserIsOwner(
              [_campaign.ownerAddress, _campaign.coownerAddress].includes(currentUser.address),
            );
          }
        })
        .catch(err => {
          const message = `Sadly we were unable to load the requested Trace details. Please try again.`;
          ErrorHandler(err, message);
        });
    }
  }, [currentUser.address]);

  // Update item of this item in trace token
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
    const authenticated = await authenticateUser(currentUser, false, web3);

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
        donateToCommunity,
      } = payment;

      const ms = trace;

      ms.parentProjectId = campaign.projectId;
      ms.title = title;
      ms.description = description;
      ms.recipientAddress = recipientAddress;
      ms.image = image;
      ms.token = token;
      ms.communityId = donateToCommunity ? config.defaultCommunityId : 0;

      // TODO: We should have ability to delete fiatAmount for uncapped traces
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

      ms.status = isProposed || trace.status === Trace.REJECTED ? Trace.PROPOSED : trace.status; // make sure not to change status!

      setLoading(true);

      TraceSave({
        trace: ms,
        userIsCampaignOwner,
        campaign,
        minPayoutWarningInCreatEdit,
        web3,
        from: currentUser.address,
        afterSave: () => setLoading(false),
        onError: () => setLoading(false),
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
            {campaign && initialValues !== undefined && (
              <Form
                className="card-form"
                requiredMark
                initialValues={initialValues}
                onFinish={submit}
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
                  disabled={traceHasFunded}
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
                      <TraceFiatAmountCurrency
                        onCurrencyChange={handleSelectCurrency}
                        onAmountChange={handleInputChange}
                        amount={payment.fiatAmount}
                        currency={payment.selectedFiatType}
                        disabled={loadingRate || !isProposed}
                        initialValues={initialValues}
                      />
                      <TraceDatePicker
                        onChange={handleDatePicker}
                        value={payment.date}
                        disabled={loadingRate || !isProposed}
                      />
                    </Fragment>
                  )}

                  <TraceDescription
                    onChange={handleInputChange}
                    value={payment.description}
                    extra="Describe how you are going to execute this trace successfully..."
                    placeholder="e.g. Monthly salary"
                    id="description"
                    disabled={traceHasFunded}
                  />

                  <UploadPicture
                    setPicture={setPicture}
                    picture={payment.image}
                    imgAlt={payment.title}
                  />

                  <TraceDonateToCommunity
                    value={payment.donateToCommunity}
                    onChange={handleInputChange}
                    disabled={!isProposed}
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
                    initialValue={initialValues.token}
                    disabled={!isProposed}
                  />

                  <TraceRecipientAddress
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
      traceId: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

export default EditPayment;
