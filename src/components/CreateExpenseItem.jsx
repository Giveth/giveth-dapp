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

const WAIT_INTERVAL = 1000;

function CreateExpenseItem({
  item: initialValue,
  updateStateOfItem,
  removeExpense,
  removeAble,
  token = {},
}) {
  const {
    actions: { getConversionRates },
  } = useContext(ConversionRateContext);

  const [visibleRemoveModal, setVisibleRemoveModal] = useState(false);
  const [item, setItem] = useState({ ...initialValue });

  const timer = useRef();

  function handleInputChange(event) {
    const { target } = event;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const { name } = target;

    setItem({ ...item, [name]: value });

    updateStateOfItem(name, value, item.key);
  }

  function handleAmountChange(value) {
    handleInputChange({ target: { name: 'amount', value } });
  }

  // Update item of this item in milestone token
  function updateAmount() {
    if (!token.symbol || !item.currency) return;
    if (timer.current) {
      clearTimeout(timer.current);
    }

    timer.current = setTimeout(async () => {
      try {
        const res = await getConversionRates(item.date, token.symbol, item.currency);
        const rate = res.rates[item.currency];
        if (rate) {
          handleAmountChange(new BigNumber(item.fiatAmount).div(rate).toFixed());
        } else {
          throw new Error('Rate not found');
        }
      } catch (e) {
        const message = `Sadly we were unable to get the exchange rate. Please try again after refresh.`;

        ErrorHandler(e, message);
        handleAmountChange(0);
      }
    }, WAIT_INTERVAL);
  }

  useEffect(() => {
    updateAmount();
  }, [token, item.fiatAmount, item.date, item.currency]);

  function setPicture(address) {
    handleInputChange({ target: { name: 'picture', value: address } });
  }

  function handleFiatAmountChange(value) {
    handleInputChange({ target: { name: 'fiatAmount', value } });
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
        onAmountChange={handleFiatAmountChange}
        currency={item.currency}
        amount={item.fiatAmount}
        id={`fiat-amount-currency-${item.key}`}
      />

      <MilestoneDatePicker onChange={handleDatePicker} />

      <MilestoneDescription
        onChange={handleInputChange}
        value={item.description}
        label="Description of the expense"
      />

      <MilestonePicture
        setPicture={setPicture}
        milestoneTitle={item.key}
        picture={item.picture}
        label="Receipt"
      />

      {removeAble && (
        <Button onClick={showRemoveModal} className="remove-expense-button">
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
