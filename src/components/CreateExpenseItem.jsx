/* eslint-disable react/prop-types */
import React, { useContext, useState } from 'react';
import { Button, Col, Form, Input, Row, Select } from 'antd';
import Modal from 'antd/lib/modal/Modal';
import { Context as WhiteListContext } from '../contextProviders/WhiteListProvider';
import {
  MilestoneDatePicker,
  MilestoneDescription,
  MilestonePicture,
} from './EditMilestoneCommons';

function CreateExpenseItem({ expense, updateStateOfexpenses, removeExpense, removeAble }) {
  const {
    state: { fiatWhitelist },
  } = useContext(WhiteListContext);

  const [visibleRemoveModal, setVisibleRemoveModal] = useState(false);

  function handleInputChange(event) {
    const { target } = event;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const { name } = target;

    updateStateOfexpenses(name, value, expense.key);
  }

  function setPicture(address) {
    handleInputChange({ target: { name: 'picture', value: address } });
  }

  function handleSelectCurrency(_, option, expKey) {
    updateStateOfexpenses('currency', option.value, expKey);
  }

  function handleDatePicker(dateString) {
    updateStateOfexpenses('date', dateString, expense.key);
  }

  function hideRemoveModal() {
    setVisibleRemoveModal(false);
  }

  function showRemoveModal() {
    setVisibleRemoveModal(true);
  }

  function removeExpenseHandler() {
    removeExpense(expense.key);
  }

  return (
    <div key={expense.key}>
      <Row gutter={16}>
        <Col className="gutter-row" span={10}>
          <Form.Item
            label="Amount"
            className="custom-form-item"
            extra="The amount should be the same as on the receipt."
          >
            <Input
              name="amount"
              value={expense.amount}
              type="number"
              placeholder="Enter Amount"
              onChange={handleInputChange}
              required
            />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={10}>
          <Form.Item
            label="Currency"
            className="custom-form-item"
            extra="Select the currency of this expense."
          >
            <Select
              showSearch
              placeholder="Select a Currency"
              optionFilterProp="children"
              name="currency"
              onSelect={(_, option) => handleSelectCurrency(_, option, expense.key)}
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              value={expense.currency}
              required
            >
              {fiatWhitelist.map(cur => (
                <Select.Option key={cur} value={cur}>
                  {cur}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <MilestoneDatePicker onChange={handleDatePicker} />

      <MilestoneDescription
        onChange={handleInputChange}
        value={expense.description}
        label="Description of the expense"
      />

      <MilestonePicture
        setPicture={setPicture}
        milestoneTitle={expense.key}
        picture={expense.picture}
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

export default CreateExpenseItem;
