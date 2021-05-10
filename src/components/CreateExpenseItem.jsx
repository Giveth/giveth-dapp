/* eslint-disable react/prop-types */
import React, { memo, useContext, useEffect, useRef, useState } from 'react';
import { Button } from 'antd';
import Modal from 'antd/lib/modal/Modal';
import BigNumber from 'bignumber.js';
import {
  MilestoneDatePicker,
  MilestoneDescription,
  MilestoneFiatAmountCurrency,
  MilestonePicture,
} from './EditMilestoneCommons';
import { Context as ConversionRateContext } from '../contextProviders/ConversionRateProvider';
import ErrorHandler from '../lib/ErrorHandler';
import { getStartOfDayUTC } from '../lib/helpers';

const WAIT_INTERVAL = 1000;

function CreateExpenseItem({
  item: initialValues,
  updateStateOfItem,
  removeExpense,
  removeAble,
  token = {},
  disabled = false,
}) {
  const {
    actions: { getConversionRates },
  } = useContext(ConversionRateContext);

  const [visibleRemoveModal, setVisibleRemoveModal] = useState(false);
  const [loadingRate, setLoadingRate] = useState(false);
  const [item, setItem] = useState({ ...initialValues });

  const timer = useRef();

  function handleInputChange(event) {
    const { target } = event;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const { name } = target;

    setItem({ ...item, [name]: value });

    updateStateOfItem(name, value, item.key);
  }

  const setLoadingAmount = loading => {
    handleInputChange({ target: { name: 'loadingAmount', value: loading } });
  };

  function handleAmountChange({ value, rate, timestamp }) {
    handleInputChange({ target: { name: 'amount', value } });
    handleInputChange({
      target: { name: 'conversionRate', value: Number(rate) },
    });
    handleInputChange({
      target: { name: 'conversionRateTimestamp', value: timestamp.toString() },
    });
    setLoadingAmount(false);
  }

  // Update item of this item in milestone token
  function updateAmount() {
    if (!token.symbol || !item.currency) return;

    setLoadingAmount(true);

    if (timer.current) {
      clearTimeout(timer.current);
    }

    timer.current = setTimeout(async () => {
      try {
        setLoadingRate(true);
        const res = await getConversionRates(item.date, token.symbol, item.currency);
        const { timestamp, rates } = res;
        const rate = rates[item.currency];
        if (rate) {
          handleAmountChange({
            value: new BigNumber(item.fiatAmount).div(rate),
            rate,
            timestamp,
          });
        } else {
          throw new Error('Rate not found');
        }
      } catch (e) {
        const message = `Sadly we were unable to get the exchange rate. Please try again after refresh.`;

        ErrorHandler(e, message);
        handleAmountChange({
          value: 0,
          rate: 1,
          timestamp: new Date().getDate(),
        });
      } finally {
        setLoadingRate(false);
      }
    }, WAIT_INTERVAL);
  }

  useEffect(() => {
    updateAmount();
  }, [token, item.fiatAmount, item.date, item.currency]);

  function setPicture(address) {
    handleInputChange({ target: { name: 'picture', value: address } });
  }

  function handleSelectCurrency(_, option) {
    handleInputChange({ target: { name: 'currency', value: option.value } });
  }

  function handleDatePicker(dateString) {
    handleInputChange({ target: { name: 'date', value: dateString } });
  }

  function hideRemoveModal() {
    setVisibleRemoveModal(false);
  }

  function showRemoveModal() {
    setVisibleRemoveModal(true);
  }

  function removeExpenseHandler() {
    removeExpense(item.key);
  }

  return (
    <div key={item.key}>
      <MilestoneFiatAmountCurrency
        onCurrencyChange={handleSelectCurrency}
        onAmountChange={handleInputChange}
        currency={item.currency}
        amount={item.fiatAmount}
        id={`fiat-amount-currency-${item.key}`}
        disabled={loadingRate || disabled}
        initialValues={{
          fiatAmount: Number(initialValues.fiatAmount),
          selectedFiatType: initialValues.currency,
        }}
      />

      <MilestoneDatePicker
        value={getStartOfDayUTC(item.date).subtract(1, 'd')}
        onChange={handleDatePicker}
        disabled={loadingRate || disabled}
      />

      <MilestoneDescription
        onChange={handleInputChange}
        value={item.description}
        label="Description of the expense"
        id={`description-${item.key}`}
        initialValue={initialValues.description}
        disabled={disabled}
      />

      <MilestonePicture
        setPicture={setPicture}
        milestoneTitle={item.key}
        picture={item.picture}
        label="Receipt"
        disabled={disabled}
      />

      {removeAble && (
        <Button disabled={disabled} onClick={showRemoveModal} block size="large" danger>
          Remove Expense
        </Button>
      )}
      <Modal
        title="Warning"
        visible={visibleRemoveModal}
        onOk={removeExpenseHandler}
        onCancel={hideRemoveModal}
        okText="Yes"
        cancelText="cancel"
      >
        <p>Are you sure you want to delete this expense?</p>
      </Modal>
      <hr />
    </div>
  );
}
const isEqual = (prevProps, nextProps) =>
  prevProps.removeAble === nextProps.removeAble && prevProps.token === nextProps.token;

export default memo(CreateExpenseItem, isEqual);
