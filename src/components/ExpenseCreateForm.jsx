/* eslint-disable react/prop-types */
import React, { useContext } from 'react';
import ImgCrop from 'antd-img-crop';
import { Col, Form, Input, Row, Select, Upload } from 'antd';
import { Context as WhiteListContext } from '../contextProviders/WhiteListProvider';
import { MilestoneDatePicker } from './EditMilestoneCommons';

function ExpenseCreateForm({ expense, updateStateOfexpenses }) {
  const {
    state: { fiatWhitelist },
  } = useContext(WhiteListContext);

  function handleInputChange(event, expKey) {
    const { target } = event;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const { name } = target;

    updateStateOfexpenses(name, value, expKey);
  }

  function handleSelectCurrency(_, option, expKey) {
    updateStateOfexpenses('currency', option.value, expKey);
  }

  function handleDatePicker(dateString, expKey) {
    console.log(dateString, expKey);
    updateStateOfexpenses('date', dateString, expKey);
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
              onChange={event => handleInputChange(event, expense.key)}
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
      <MilestoneDatePicker onChange={dateString => handleDatePicker(dateString, expense.key)} />
      <Form.Item label="Description of the expense" className="custom-form-item">
        <Input.TextArea
          value={expense.description}
          name="description"
          placeholder="e.g. Lunch"
          onChange={event => handleInputChange(event, expense.key)}
          required
        />
      </Form.Item>
      <Form.Item
        name="picture"
        label="Add a picture (optional)"
        className="custom-form-item"
        extra="A picture says more than a thousand words. Select a png or jpg file in a 1:1 aspect ratio."
      >
        <ImgCrop>
          <Upload.Dragger
            multiple={false}
            accept="image/png, image/jpeg"
            fileList={[]}
            customRequest={options => {
              const { onSuccess, onError, file, onProgress } = options;
              console.log(file);
              onProgress(0);
              if (true) {
                // upload to ipfs
                onSuccess('ipfs Address');
                onProgress(100);
              } else {
                onError('Failed!');
              }
            }}
            onChange={info => {
              console.log('info', info);
              const { status } = info.file;
              if (status !== 'uploading') {
                console.log(info.file, info.fileList);
              }
              if (status === 'done') {
                console.log(`${info.file.name} file uploaded successfully.`);

                updateStateOfexpenses('picture', info.file.response, expense.key);
              } else if (status === 'error') {
                console.log(`${info.file.name} file upload failed.`);
              }
            }}
          >
            <p className="ant-upload-text">
              Drag and Drop JPEG, PNG here or <span>Attach a file.</span>
            </p>
          </Upload.Dragger>
        </ImgCrop>
      </Form.Item>
      <hr />
    </div>
  );
}

export default ExpenseCreateForm;
