/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/label-has-for */

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Milestone from 'models/Milestone';
import MilestoneProof from 'components/MilestoneProof';
import { Button, Form, Modal } from 'antd';
import Editor from './Editor';
import { getHtmlText } from '../lib/helpers';

/**
  A promise modal to file proof when taking action on a milestone

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
    .then( proof => console.log("Here's your milestone proof: ", proof))
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
      items: [],
      required: false,
      enableAttachProof: false,
      textPlaceholder: '',
    };

    this.promise = {};

    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.onItemsChanged = this.onItemsChanged.bind(this);
    this.onMessageChange = this.onMessageChange.bind(this);
    this.submit = this.submit.bind(this);
  }

  onItemsChanged(items) {
    this.setState({ items });
    this.triggerRouteBlocking();
  }

  onMessageChange(message) {
    this.setState({ message }, () => this.toggleFormValid());
  }

  openModal({ title, description, cta, required, textPlaceholder }) {
    this.setState(
      {
        items: [],
        title,
        description,
        CTA: cta,
        modalIsOpen: true,
        required,
        formIsValid: !required,
        textPlaceholder,
      },
      this.toggleFormValid,
    );

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
          items: this.state.items,
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
      items,
      enableAttachProof,
      textPlaceholder,
    } = this.state;

    const { milestone } = this.props;

    return (
      <Modal
        wrapClassName="vertical-center-modal"
        visible={modalIsOpen}
        destroyOnClose
        onCancel={() => this.closeModal(true)}
        title={title}
        width={1000}
        footer={[
          <Button key="back" onClick={() => this.closeModal(true)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={isSaving}
            onClick={this.submit}
            disabled={!formIsValid}
          >
            {CTA}
          </Button>,
        ]}
      >
        <Form id="conversation" preserve={false} onSubmit={this.submit} requiredMark={required}>
          <p className="mb-4">{description}</p>
          <div className="row">
            <div className={enableAttachProof ? 'col-md-6' : 'col-12'}>
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

            {enableAttachProof && (
              <div className="col-md-6">
                <span className="label">Attachments</span>
                <MilestoneProof
                  isEditMode
                  refreshList={items}
                  onItemsChanged={returnedItems => this.onItemsChanged(returnedItems)}
                  milestoneStatus={milestone.status}
                  token={milestone.token}
                />
              </div>
            )}
          </div>
        </Form>
      </Modal>
    );
  }
}

ConversationModal.propTypes = {
  milestone: PropTypes.instanceOf(Milestone).isRequired,
};

export default ConversationModal;
