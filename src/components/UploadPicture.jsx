import React, { Fragment } from 'react';
import { Form, notification, Upload } from 'antd';
import { DeleteTwoTone } from '@ant-design/icons';
import ImgCrop from 'antd-img-crop';
import PropTypes from 'prop-types';

import { IPFSService } from '../services';
import config from '../configuration';

const UploadPicture = ({ picture, setPicture, imgAlt, disabled, aspectRatio, label, required }) => {
  const uploadProps = {
    multiple: false,
    accept: 'image/png, image/jpeg',
    customRequest: options => {
      const { onSuccess, onError, file } = options;
      IPFSService.upload(file)
        .then(onSuccess)
        .catch(err => {
          onError('Failed!', err);
        });
    },
    onChange(info) {
      const { status } = info.file;
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

  let rules;
  if (required) {
    rules = [
      {
        validator: async () => {
          if (!picture) {
            throw new Error('Picture is required');
          }
        },
      },
    ];
  }

  return (
    <Form.Item
      name="picture"
      label={label}
      className="custom-form-item"
      extra="A picture says more than a thousand words. Please select a png or jpg file."
      rules={rules}
    >
      <Fragment>
        {picture ? (
          <div className="picture-upload-preview">
            <img
              src={
                picture.startsWith('/ipfs/') ? `${config.ipfsGateway}${picture.slice(6)}` : picture
              }
              alt={imgAlt}
            />
            {!disabled && <DeleteTwoTone onClick={removePicture} />}
          </div>
        ) : (
          <ImgCrop aspect={aspectRatio}>
            <Upload.Dragger {...uploadProps} style={disabled ? { display: 'none' } : {}}>
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

UploadPicture.propTypes = {
  picture: PropTypes.string.isRequired,
  imgAlt: PropTypes.string.isRequired,
  setPicture: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  aspectRatio: PropTypes.number,
  label: PropTypes.string,
  required: PropTypes.bool,
};

UploadPicture.defaultProps = {
  disabled: false,
  aspectRatio: 16 / 9,
  label: 'Add a picture (optional)',
  required: false,
};

export default UploadPicture;
