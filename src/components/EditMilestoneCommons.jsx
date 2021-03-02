import React, { Fragment } from 'react';
import { Checkbox, Form, Input, notification, Select, Upload } from 'antd';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';
import { DeleteTwoTone } from '@ant-design/icons';
import ImgCrop from 'antd-img-crop';
import config from '../configuration';
import { IPFSService } from '../services';
import useReviewers from '../hooks/useReviewers';

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

const MilestoneDescription = ({ extra, onChange, placeholder, value }) => (
  <Form.Item
    name="milestoneDesc"
    label="Description"
    className="custom-form-item"
    extra={extra}
    rules={[
      {
        required: true,
        type: 'string',
        min: 10,
        message: 'Please provide at least 10 characters and do not edit the template keywords.',
      },
    ]}
  >
    <Input.TextArea
      style={{ resize: 'none' }}
      value={value}
      name="description"
      placeholder={placeholder}
      onChange={onChange}
      rows={9}
    />
  </Form.Item>
);
MilestoneDescription.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  extra: PropTypes.string,
  placeholder: PropTypes.string,
};

MilestoneDescription.defaultProps = {
  extra: '',
  placeholder: '',
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
            name="reviewerAddress"
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

// eslint-disable-next-line import/prefer-default-export
export {
  MilestoneTitle,
  MilestoneDescription,
  MilestonePicture,
  MilestoneDonateToDac,
  MilestoneReviewer,
};
