import React, { Fragment, useCallback, useContext, useEffect } from 'react';
import {
  Checkbox,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  notification,
  Row,
  Select,
  Typography,
  Upload,
} from 'antd';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';
import { DeleteTwoTone } from '@ant-design/icons';
import ImgCrop from 'antd-img-crop';
import moment from 'moment';
import Web3 from 'web3';
import config from '../configuration';
import { IPFSService } from '../services';
import useReviewers from '../hooks/useReviewers';
import { getStartOfDayUTC, getHtmlText, ANY_TOKEN } from '../lib/helpers';
import Editor from './Editor';
import { Context as WhiteListContext } from '../contextProviders/WhiteListProvider';

const MilestoneTitle = ({ extra, onChange, value }) => (
  <Form.Item
    name="title"
    label="Title"
    className="custom-form-item"
    extra={extra}
    rules={[
      {
        required: true,
        type: 'string',
        min: 3,
        message: 'Please provide at least 3 characters',
      },
    ]}
  >
    <Input
      value={value}
      name="title"
      placeholder="e.g. Support continued Development"
      onChange={onChange}
    />
  </Form.Item>
);

MilestoneTitle.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  extra: PropTypes.string,
};

MilestoneTitle.defaultProps = {
  value: '',
  extra: '',
};

const MilestoneDescription = ({ extra, onChange, placeholder, value, label }) => {
  const onDescriptionChange = useCallback(
    description => {
      onChange({ target: { name: 'description', value: description } });
    },
    [onChange],
  );
  return (
    <Form.Item
      name="Description"
      label={label}
      className="custom-form-item"
      extra={extra}
      rules={[
        {
          required: true,
          type: 'string',
        },
        () => ({
          validator(_, val) {
            if (!val || getHtmlText(value).length > 10) {
              return Promise.resolve();
            }
            return Promise.reject(
              new Error(
                'Please provide at least 10 characters and do not edit the template keywords.',
              ),
            );
          },
        }),
      ]}
    >
      <Editor
        name="description"
        onChange={onDescriptionChange}
        value={value}
        placeholder={placeholder}
      />
    </Form.Item>
  );
};
MilestoneDescription.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  extra: PropTypes.string,
  placeholder: PropTypes.string,
  label: PropTypes.string,
};

MilestoneDescription.defaultProps = {
  extra: '',
  placeholder: '',
  label: 'Description',
};

const MilestonePicture = ({ picture, setPicture, milestoneTitle }) => {
  const uploadProps = {
    multiple: false,
    accept: 'image/png, image/jpeg',
    fileList: [],
    customRequest: options => {
      const { onSuccess, onError, file, onProgress } = options;
      onProgress(0);
      IPFSService.upload(file)
        .then(address => {
          onSuccess(address);
          onProgress(100);
        })
        .catch(err => {
          onError('Failed!', err);
        });
    },
    onChange(info) {
      const { status } = info.file;
      if (status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (status === 'done') {
        console.log('file uploaded successfully.', info.file.response);
        setPicture(info.file.response);
      } else if (status === 'error') {
        console.log(`${info.file.name} file upload failed.`);
        const args = {
          message: 'Error',
          description: 'Cannot upload picture to IPFS',
        };
        notification.error(args);
      }
    },
  };

  function removePicture() {
    setPicture('');
  }

  return (
    <Form.Item
      name="picture"
      label="Add a picture (optional)"
      className="custom-form-item"
      extra="A picture says more than a thousand words. Select a png or jpg file in a 1:1
                    aspect ratio."
    >
      <Fragment>
        {picture ? (
          <div className="picture-upload-preview">
            <img src={`${config.ipfsGateway}${picture.slice(6)}`} alt={milestoneTitle} />
            <DeleteTwoTone onClick={removePicture} />
          </div>
        ) : (
          <ImgCrop>
            <Upload.Dragger {...uploadProps}>
              <p className="ant-upload-text">
                Drag and Drop JPEG, PNG here or <span>Attach a file.</span>
              </p>
            </Upload.Dragger>
          </ImgCrop>
        )}
      </Fragment>
    </Form.Item>
  );
};

MilestonePicture.propTypes = {
  picture: PropTypes.string.isRequired,
  milestoneTitle: PropTypes.string.isRequired,
  setPicture: PropTypes.func.isRequired,
};

const MilestoneDonateToDac = ({ onChange, value }) => (
  <Form.Item
    className="custom-form-item milestone-donate-dac"
    valuePropName="checked"
    extra={
      <div>
        Your help keeps Giveth alive.
        <span role="img" aria-label="heart">
          {' '}
          ❤️
        </span>
      </div>
    }
  >
    <Checkbox onChange={onChange} name="donateToDac" checked={value}>
      Donate 3% to Giveth
    </Checkbox>
  </Form.Item>
);

MilestoneDonateToDac.propTypes = {
  value: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
};

const MilestoneReviewer = ({
  milestoneType,
  hasReviewer,
  milestoneReviewerAddress,
  setReviewer,
  toggleHasReviewer,
}) => {
  const reviewers = useReviewers();
  return (
    <Fragment>
      <Form.Item className="custom-form-item milestone-reviewer" valuePropName="checked">
        {toggleHasReviewer && (
          <Checkbox
            className="milestone-reviewer-checkbox"
            name="hasReviewer"
            checked={hasReviewer}
            onChange={toggleHasReviewer}
          />
        )}
        <span>{`${milestoneType} reviewer`}</span>
      </Form.Item>
      {hasReviewer && (
        <Fragment>
          <Form.Item
            name="Reviewer Address"
            rules={[{ required: true }]}
            extra={`The reviewer verifies that the ${milestoneType} is completed successfully.`}
          >
            <Select
              showSearch
              placeholder="Select a reviewer"
              optionFilterProp="children"
              name="reviewerAddress"
              onSelect={setReviewer}
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              value={milestoneReviewerAddress}
            >
              {reviewers.map(({ name, address }) => (
                <Select.Option
                  key={address}
                  value={address}
                >{`${name} - ${address}`}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Fragment>
      )}
    </Fragment>
  );
};

MilestoneReviewer.propTypes = {
  milestoneType: PropTypes.string,
  hasReviewer: PropTypes.bool.isRequired,
  toggleHasReviewer: PropTypes.func,
  setReviewer: PropTypes.func.isRequired,
  milestoneReviewerAddress: PropTypes.string,
};

MilestoneReviewer.defaultProps = {
  milestoneType: 'Milestone',
  milestoneReviewerAddress: '',
  toggleHasReviewer: null,
};

const MilestoneDatePicker = ({ onChange, value }) => {
  const maxValue = getStartOfDayUTC().subtract(1, 'd');

  useEffect(() => {
    onChange(maxValue);
  }, []);
  return (
    <Row gutter={16}>
      <Col className="gutter-row" span={10}>
        <Form.Item label="Date" className="custom-form-item">
          <DatePicker
            disabledDate={current => {
              return current && current > moment().startOf('day');
            }}
            rules={[
              {
                required: true,
              },
            ]}
            defaultValue={value || maxValue}
            onChange={(_, dateString) => onChange(getStartOfDayUTC(dateString))}
          />
        </Form.Item>
      </Col>
    </Row>
  );
};

MilestoneDatePicker.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(moment)]),
};

MilestoneDatePicker.defaultProps = {
  value: undefined,
};

const MilestoneCampaignInfo = ({ campaign }) => (
  <div className="campaign-info">
    <div className="lable">Campaign</div>
    <div className="content">{campaign && campaign.title}</div>
  </div>
);
MilestoneCampaignInfo.propTypes = {
  campaign: PropTypes.shape({
    title: PropTypes.string,
  }),
};
MilestoneCampaignInfo.defaultProps = {
  campaign: {},
};

const MilestoneToken = ({
  label,
  onChange,
  value,
  totalAmount,
  includeAnyToken,
  hideTotalAmount,
}) => {
  const {
    state: { activeTokenWhitelist },
  } = useContext(WhiteListContext);

  const handleSelectToken = (_, { value: symbol }) => {
    onChange(
      symbol === ANY_TOKEN.symbol ? ANY_TOKEN : activeTokenWhitelist.find(t => t.symbol === symbol),
    );
  };

  return (
    <Form.Item
      name="Token"
      label={label}
      className="custom-form-item"
      extra="Select the token you want to be reimbursed in."
    >
      <Row gutter={16} align="middle">
        <Col className="gutter-row" span={12}>
          <Select
            showSearch
            placeholder="Select a Currency"
            optionFilterProp="children"
            name="token"
            onSelect={handleSelectToken}
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            value={value && value.symbol}
            required
            rules={[{ required: true, message: 'Payment currency is required' }]}
          >
            {includeAnyToken && (
              <Select.Option key={ANY_TOKEN.name} value={ANY_TOKEN.name}>
                Any Token
              </Select.Option>
            )}
            {activeTokenWhitelist.map(token => (
              <Select.Option key={token.name} value={token.symbol}>
                {token.name}
              </Select.Option>
            ))}
          </Select>
        </Col>
        {!hideTotalAmount && (
          <Col className="gutter-row" span={12}>
            <Typography.Text className="ant-form-text" type="secondary">
              ≈ {totalAmount}
            </Typography.Text>
          </Col>
        )}
      </Row>
    </Form.Item>
  );
};

MilestoneToken.propTypes = {
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.shape({
    symbol: PropTypes.string,
    name: PropTypes.string,
  }),
  totalAmount: PropTypes.string,
  includeAnyToken: PropTypes.bool,
  hideTotalAmount: PropTypes.bool,
};

MilestoneToken.defaultProps = {
  value: {},
  totalAmount: '0',
  includeAnyToken: false,
  hideTotalAmount: false,
};

const MilestoneRecipientAddress = ({ label, onChange, value }) => (
  <Form.Item
    name="recipientAddress"
    label={label}
    className="custom-form-item"
    extra="If you don’t change this field the address associated with your account will be
              used."
    rules={[
      {
        validator: async (_, inputValue) => {
          if (inputValue && !Web3.utils.isAddress(inputValue)) {
            throw new Error('Please insert a valid Ethereum address.');
          }
        },
      },
    ]}
  >
    <Input value={value} name="recipientAddress" placeholder="0x" onChange={onChange} required />
  </Form.Item>
);

MilestoneRecipientAddress.propTypes = {
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};
MilestoneRecipientAddress.defaultProps = {
  value: '',
};

const MilestoneFiatAmountCurrency = ({
  onAmountChange,
  onCurrencyChange,
  amount,
  currency,
  id,
}) => {
  const {
    state: { fiatWhitelist },
  } = useContext(WhiteListContext);

  return (
    <Row gutter={16}>
      <Col className="gutter-row" span={10}>
        <Form.Item
          label="Amount"
          className="custom-form-item"
          extra="The amount should be the same as on the receipt."
        >
          <InputNumber
            name="fiatAmount"
            value={amount}
            min={0}
            defaultValue={0}
            decimalSeparator="."
            placeholder="Enter Amount"
            onChange={onAmountChange}
            required
          />
        </Form.Item>
      </Col>
      <Col className="gutter-row" span={10}>
        <Form.Item
          name={id}
          label="Currency"
          className="custom-form-item"
          extra="Select the currency of this expense."
        >
          <Select
            showSearch
            placeholder="Select a Currency"
            optionFilterProp="children"
            name="currency"
            onSelect={onCurrencyChange}
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            value={currency}
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
  );
};

MilestoneFiatAmountCurrency.propTypes = {
  onAmountChange: PropTypes.func.isRequired,
  onCurrencyChange: PropTypes.func.isRequired,
  amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  currency: PropTypes.string,
  id: PropTypes.string,
};
MilestoneFiatAmountCurrency.defaultProps = {
  amount: 0,
  currency: '',
  id: '',
};
// eslint-disable-next-line import/prefer-default-export
export {
  MilestoneTitle,
  MilestoneDescription,
  MilestonePicture,
  MilestoneDonateToDac,
  MilestoneReviewer,
  MilestoneDatePicker,
  MilestoneCampaignInfo,
  MilestoneToken,
  MilestoneRecipientAddress,
  MilestoneFiatAmountCurrency,
};
