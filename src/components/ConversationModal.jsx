/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/label-has-for */

import React, { Component } from 'react';
import Lottie from 'lottie-react';

import { Button, Form, Modal, Row, Col } from 'antd';
import Editor from './Editor';
import { getHtmlText } from '../lib/helpers';
import AcceptProposedAnimation from '../assets/checkmark.json';

/**
  A promise modal to file proof when taking action on a trace

  STEP 1 - Create a ref
  this.conversationModal = React.createRef();

  STEP 2 - Assign ref
  <ConversationModal
    ref={this.conversationModal}
  />

  STEP 3 - Call it
  this.conversationModal.current.openModal({
    title: 'Do this?',
    description: 'Yes!',
    required: false,
    cta: 'Save'
  })
    .then( proof => console.log("Here's your trace proof: ", proof))
    .catch( () => console.log("canceled!"))
* */

class ConversationModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      modalIsOpen: false,
      formIsValid: false,
      isSaving: false,
      message: '',
      required: false,
      textPlaceholder: '',
    };

    this.promise = {};

    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.onMessageChange = this.onMessageChange.bind(this);
    this.submit = this.submit.bind(this);
  }

  onMessageChange(message) {
    this.setState({ message }, () => this.toggleFormValid());
  }

  openModal({ title, description, cta, required, textPlaceholder, type }) {
    this.setState(
      {
        title,
        description,
        CTA: cta,
        modalIsOpen: true,
        required,
        formIsValid: !required,
        textPlaceholder,
        type,
      },
      this.toggleFormValid,
    );
    // Centering AcceptProposed SVG animation
    const element = document.getElementById('LottieAnimation');
    if (element && type === 'AcceptProposed') {
      element.children[0].setAttribute('viewBox', '150 100 500 400');
    }
    return new Promise((resolve, reject) => {
      this.promise = {
        resolve,
        reject,
      };
    });
  }

  closeModal(reject) {
    if (this.promise) {
      if (reject) {
        this.promise.reject();
      } else {
        this.promise.resolve({
          message: this.state.message,
        });
      }
    }

    this.setState({ modalIsOpen: false, message: '' });
  }

  toggleFormValid() {
    this.setState(prevState => {
      return {
        formIsValid: !prevState.required || getHtmlText(prevState.message).length > 3,
      };
    });
  }

  submit() {
    this.closeModal();
  }

  render() {
    const {
      modalIsOpen,
      message,
      formIsValid,
      isSaving,
      required,
      title,
      description,
      CTA,
      textPlaceholder,
      type,
    } = this.state;

    let LottieAnimation;
    if (type === 'AcceptProposed') {
      LottieAnimation = AcceptProposedAnimation;
    }

    return (
      <Modal
        visible={modalIsOpen}
        destroyOnClose
        onCancel={() => this.closeModal(true)}
        width={1000}
        footer={null}
        className="antModalComment pb-0"
        centered
      >
        <Form id="conversation" preserve={false} onSubmit={this.submit} requiredMark={required}>
          <Row className="justify-content-center">
            <Col className="col m-auto">
              <h3 className="font-weight-bold">{title}</h3>
              <div className="mb-4" style={{ fontSize: '18px', minWidth: '300px' }}>
                {description}
              </div>
            </Col>
            {LottieAnimation && (
              <Col className="text-center">
                <Lottie
                  animationData={LottieAnimation}
                  className="m-auto"
                  id="LottieAnimation"
                  loop={false}
                  style={{ width: '250px' }}
                />
              </Col>
            )}
          </Row>
          <div className="row">
            <div className="col-12">
              <Form.Item
                name="message"
                label="Accompanying message"
                className="custom-form-item"
                extra=""
                rules={[
                  {
                    required,
                    type: 'string',
                    message: 'Message is required',
                  },
                  {
                    validator: async (_, val) => {
                      if (required && val && getHtmlText(val).length <= 3) {
                        throw new Error(
                          'It is really appreciated if you write something meaningful...',
                        );
                      }
                    },
                  },
                ]}
              >
                <Editor
                  name="message"
                  value={message}
                  onChange={this.onMessageChange}
                  placeholder={textPlaceholder}
                />
              </Form.Item>
            </div>
          </div>
        </Form>
        <div className="text-right">
          <Button
            key="back"
            ghost
            onClick={this.closeModal}
            size="large"
            type="primary"
            loading={isSaving}
            className="m-2"
          >
            Cancel
          </Button>
          <Button
            onClick={this.submit}
            size="large"
            key="submit"
            type="primary"
            loading={isSaving}
            className="m-2"
            disabled={!formIsValid}
          >
            {CTA}
          </Button>
        </div>
      </Modal>
    );
  }
}

export default ConversationModal;
