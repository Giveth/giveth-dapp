/* eslint-disable jsx-a11y/anchor-is-valid */

import React, { Component } from 'react';
import { Prompt } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Modal } from 'antd';
import BigNumber from 'bignumber.js';

import { Input, Form } from 'formsy-react-components';
import { utils } from 'web3';

import getConversionRatesContext from 'containers/getConversionRatesContext';
import TraceItem from 'models/TraceItem';
import FormsyImageUploader from './FormsyImageUploader';
import RateConverter from './RateConverter';

class AddTraceItemModal extends Component {
  constructor(props) {
    super(props);

    this.form = React.createRef();

    this.state = {
      item: new TraceItem({}),
      formIsValid: false,
    };
    this.setImage = this.setImage.bind(this);
    this.mapInputs = this.mapInputs.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.submit = this.submit.bind(this);
  }

  setImage(image) {
    const { item } = this.state;
    item.image = image;
    this.setState({ item });
  }

  triggerRouteBlocking() {
    const form = this.form.current.formsyForm;
    // we only block routing if the form state is not submitted
    this.setState({
      isBlocking: form && (!form.state.formSubmitted || form.state.isSubmitting),
    });
  }

  mapInputs(inputs) {
    const { item } = this.state;

    // set values on TraceItem
    item.date = inputs.date.format();
    item.description = inputs.description;
    item.selectedFiatType = inputs.fiatType;
    item.fiatAmount = new BigNumber(inputs.fiatAmount);
    item.wei = utils.toWei(inputs.etherAmount);
    item.conversionRate = parseFloat(inputs.conversionRate);
    item.conversionRateTimestamp = inputs.conversionRateTimestamp;

    this.setState({ item });
  }

  closeModal() {
    this.props.onClose();
  }

  submit() {
    // Formsy doesn't like nesting, even when using Portals
    // So we're manually fetching and submitting the model

    // We need to call getModel here to set values on the TraceItem
    this.form.current.formsyForm.getModel();

    // Get TraceItem
    this.props.onAddItem(this.state.item);
  }

  render() {
    const { openModal, token, conversionRateLoading } = this.props;
    const { formIsValid, item, isBlocking } = this.state;

    return (
      <Modal
        visible={openModal}
        onCancel={this.closeModal}
        footer={null}
        destroyOnClose
        centered
        className="pb-0"
      >
        <Form
          id="trace-form"
          ref={this.form}
          mapping={this.mapInputs}
          onValid={() => this.setState({ formIsValid: true })}
          onInvalid={() => this.setState({ formIsValid: false })}
          onChange={e => this.triggerRouteBlocking(e)}
          layout="vertical"
        >
          <Prompt
            when={isBlocking}
            message={() =>
              `You have unsaved changes. Are you sure you want to navigate from this page?`
            }
          />

          <div className="form-group row">
            <div className="col-12">
              <Input
                label="Description"
                name="description"
                type="text"
                value={item.description}
                placeholder="E.g. my receipt"
                validations="minLength:3"
                validationErrors={{
                  minLength: 'Provide description',
                }}
                required
                autoFocus
              />
            </div>
          </div>

          <RateConverter token={token} />

          <FormsyImageUploader
            name="image"
            previewImage={item.image}
            setImage={this.setImage}
            resize={false}
          />

          {/*
          NOTE: Due to a Formsy issue, we're using a 'fake' submit button here
          */}

          <a
            role="button"
            tabIndex="-1"
            className={`btn btn-primary ${!formIsValid || conversionRateLoading ? 'disabled' : ''}`}
            disabled={!formIsValid || conversionRateLoading}
            onClick={() => this.submit()}
            onKeyUp={() => this.submit()}
          >
            Attach
          </a>

          <button type="button" className="btn btn-link" onClick={() => this.closeModal()}>
            Cancel
          </button>
        </Form>
      </Modal>
    );
  }
}

AddTraceItemModal.propTypes = {
  openModal: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAddItem: PropTypes.func.isRequired,
  token: PropTypes.shape({}),
  conversionRateLoading: PropTypes.bool.isRequired,
};

AddTraceItemModal.defaultProps = {
  token: undefined,
};

export default getConversionRatesContext(AddTraceItemModal);
