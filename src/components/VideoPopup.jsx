/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { Modal, Form, Input, Radio, Upload, notification, Row, Col } from 'antd';
import IPFSService from '../services/IPFSService';
import config from '../configuration';

const VideoPopup = ({ visible, handleClose, reactQuillRef }) => {
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
        .then(hash => {
          if (visible) {
            onSuccess(config.ipfsGateway + hash.slice(6));
            onProgress(100);
          }
        })
        .catch(err => {
          onError('Failed!', err);
        });
    },
    onChange(info) {
      const { status } = info.file;
      console.log('status :>> ', status);
      if (visible) {
        setFileList(info.fileList);
      }
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

  function clearStates() {
    setFileList([]);
    form.resetFields();
  }

  function closeModal() {
    clearStates();
    handleClose();
  }

  function insertToEditor(videURL) {
    // TODO: Remove This if after edit milestone convert to FC;
    let quill;
    if (reactQuillRef.current) {
      quill = reactQuillRef.current.getEditor();
    } else {
      quill = reactQuillRef.getEditor();
    }
    quill.focus();
    const range = quill.getSelection();
    quill.insertEmbed(range.index, 'video', videURL);
  }

  function getVideoUrl(tempUrl) {
    if (!tempUrl) return null;
    const match =
      tempUrl.match(/^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtube\.com\/watch.*v=([a-zA-Z0-9_-]+)/) ||
      tempUrl.match(/^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtu\.be\/([a-zA-Z0-9_-]+)/) ||
      tempUrl.match(/^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#&?]*).*/);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?showinfo=0`;
    }
    return null;
  }

  return (
    <Modal
      visible={visible}
      title="Attach a video to description"
      okText="Add"
      cancelText="Cancel"
      onCancel={closeModal}
      onOk={() => {
        form
          .validateFields()
          .then(_ => {
            let tempURL;
            switch (type) {
              case 1:
                insertToEditor(url);
                closeModal();
                break;
              case 2:
                insertToEditor(fileList[0].response);
                closeModal();
                break;
              case 3:
                tempURL = getVideoUrl(youTube);
                if (tempURL) {
                  insertToEditor(tempURL);
                  closeModal();
                }
                break;
              default:
                break;
            }
            // onCreate(values);
          })
          .catch(info => {
            console.log('Validate Failed:', info);
          });
      }}
    >
      <Row style={{ marginBottom: '32px' }}>
        <Col span="24">
          <Radio.Group onChange={onTypeChange} value={type}>
            <Radio value={1}>Link</Radio>
            <Radio value={2}>File</Radio>
            <Radio value={3}>Youtube</Radio>
          </Radio.Group>
        </Col>
      </Row>
      <Row>
        <Col span="24">
          {visible && (
            <Form
              form={form}
              layout="vertical"
              name="form_in_modal"
              initialValues={{
                type: 1,
                url: '',
                file: [],
                youTube: '',
              }}
            >
              <Form.Item
                name="url"
                style={{ display: type === 1 ? 'flex' : 'none' }}
                rules={[
                  () => ({
                    validator(_, value) {
                      if (type !== 1) return Promise.resolve();
                      if (!value || value.length < 10) {
                        return Promise.reject(new Error('Please provide at least 10 characters'));
                      }
                      if (/^https?:\/\//.test(value)) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Please provide a valid URL'));
                    },
                  }),
                ]}
              >
                <Input placeholder="Video URL" onChange={e => setURL(e.target.value)} value={url} />
              </Form.Item>
              <Form.Item
                name="file"
                disabled
                style={{ display: type === 2 ? 'flex' : 'none' }}
                rules={[
                  () => ({
                    validator(_, value) {
                      if (type !== 2) return Promise.resolve();
                      if (!value || !value.fileList || !value.fileList[0]) {
                        return Promise.reject(new Error('Please upload a video'));
                      }
                      if (value.fileList[0].status === 'uploading') {
                        return Promise.reject(new Error('Please Wait to video upload Completely.'));
                      }
                      if (value.fileList[0].status === 'error') {
                        return Promise.reject(new Error('upload fails.'));
                      }
                      if (value.fileList[0].status === 'done' && value.fileList[0].response) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Something wrong.'));
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
              <Form.Item
                name="youtube"
                style={{ display: type === 3 ? 'flex' : 'none' }}
                rules={[
                  () => ({
                    validator(_, value) {
                      if (type !== 3) return Promise.resolve();
                      const finalURL = getVideoUrl(value);
                      if (finalURL) {
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
            </Form>
          )}
        </Col>
      </Row>
    </Modal>
  );
};

export default VideoPopup;
