/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { Modal, Form, Input, Radio, Upload, notification } from 'antd';
import IPFSService from '../services/IPFSService';

const VideoPopup = ({ visible, handleClose }) => {
  const [type, setType] = useState(1);
  const [url, setURL] = useState('');
  const [fileList, setFileList] = useState([]);
  const [youTube, setYouTube] = useState('');
  const [form] = Form.useForm();

  const onTypeChange = e => {
    setType(e.target.value);
  };

  const uploadProps = {
    multiple: false,
    maxCount: 1,
    accept: '.mp4',
    fileList,
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
      setFileList(info.fileList);
      if (status === 'uploading') {
        console.log(info.fileList);
      }
      if (status === 'done') {
        console.log('info.fileList :>> ', info.fileList);
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

  return (
    <Modal
      visible={visible}
      title="Attach a video to description"
      okText="Add"
      cancelText="Cancel"
      onCancel={handleClose}
      onOk={() => {
        form
          .validateFields()
          .then(_ => {
            // form.resetFields();
            // onCreate(values);
          })
          .catch(info => {
            console.log('Validate Failed:', info);
          });
      }}
    >
      <Form
        form={form}
        layout="vertical"
        name="form_in_modal"
        initialValues={{
          type: 1,
        }}
      >
        <Form.Item name="type" className="collection-create-form_last-form-item">
          <Radio.Group onChange={onTypeChange} value={type}>
            <Radio value={1}>Link</Radio>
            <Radio value={2}>File</Radio>
            <Radio value={3}>Youtube</Radio>
          </Radio.Group>
        </Form.Item>
        {type === 1 && (
          <Form.Item
            name="URL"
            rules={[
              {
                required: true,
                type: 'string',
                min: 10,
                message: 'Please provide at least 10 characters',
              },
            ]}
          >
            <Input placeholder="Video URL" onChange={e => setURL(e.target.value)} value={url} />
          </Form.Item>
        )}
        {type === 2 && (
          <Form.Item
            name="File"
            rules={[
              {
                required: true,
                message: 'Please upload video.',
              },
              () => ({
                validator(_, value) {
                  if (!value || !value.fileList || !value.fileList[0]) {
                    return Promise.reject(new Error('Something wrong'));
                  }
                  if (value.fileList[0].status === 'uploading') {
                    return Promise.reject(new Error('Please Wait to video upload Completely'));
                  }
                  if (value.fileList[0].status === 'error') {
                    return Promise.reject(new Error('Something wrong'));
                  }
                  if (value.fileList[0].status === 'done' && value.fileList[0].response) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error('The two passwords that you entered do not match!'),
                  );
                },
              }),
            ]}
          >
            <Upload.Dragger {...uploadProps}>
              <img
                src="/img/ipfs-logo1.svg"
                alt="ipfs"
                style={{ width: '100px', padding: '20px' }}
              />
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
            </Upload.Dragger>
          </Form.Item>
        )}
        {type === 3 && (
          <Form.Item
            name="youtube"
            rules={[
              {
                required: true,
                message: 'Please enter a youtube address.',
              },
              () => ({
                validator(_, value) {
                  const match =
                    value.match(
                      /^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtube\.com\/watch.*v=([a-zA-Z0-9_-]+)/,
                    ) ||
                    value.match(/^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtu\.be\/([a-zA-Z0-9_-]+)/) ||
                    value.match(/^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#&?]*).*/);
                  if (match && match[2].length === 11) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Please enter a valid youtube address.'));
                },
              }),
            ]}
          >
            <Input
              placeholder="YouTube URL"
              onChange={e => setYouTube(e.target.value)}
              value={youTube}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default VideoPopup;
