import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withFormsy } from 'formsy-react';
import ReactQuill from 'react-quill';
import { resizeFile } from '../lib/helpers';
import IPFSService from '../services/IPFSService';
import config from '../configuration';

import VideoPopup from './VideoPopup';
import Loader from './Loader';
import ErrorHandler from '../lib/ErrorHandler';

class QuillFormsy extends Component {
  constructor(props) {
    super(props);
    this.reactQuillRef = null; // ReactQuill component
    this.imageUploader = null; // Hidden Input component
    this.imageContainer = null; // Hidden Image container
    this.insertToEditor = this.insertToEditor.bind(this);
    this.saveToServer = this.saveToServer.bind(this);
    this.imageHandler = this.imageHandler.bind(this);
    this.templateHandler = this.templateHandler.bind(this);
    this.handleImageUpload = this.handleImageUpload.bind(this);
    this.handleVideoModalCancel = this.handleVideoModalCancel.bind(this);
    this.showVideoModal = this.showVideoModal.bind(this);
    this.videoHandler = this.videoHandler.bind(this);

    this.state = {
      uploading: false,
      isVideoModalVisible: false,
    };
  }

  componentDidMount() {
    const toolbar = this.reactQuillRef.getEditor().getModule('toolbar');
    toolbar.addHandler('image', this.imageHandler);
    toolbar.addHandler('video', this.videoHandler);
    if (this.props.templatesDropdown) {
      const placeholderPickerItems = Array.prototype.slice.call(
        document.querySelectorAll('.ql-template .ql-picker-item'),
      );
      placeholderPickerItems.forEach(item => {
        item.textContent = item.dataset.value;
      });
      placeholderPickerItems.forEach(item =>
        item.addEventListener('click', () => this.templateHandler(item.dataset.value)),
      );
      document.querySelector(
        '.ql-template .ql-picker-label',
      ).innerHTML = `<div class="template-picker-text" style="margin-right: 20px;">Template</div>${
        document.querySelector('.ql-template .ql-picker-label').innerHTML
      }`;
    }
  }

  handleVideoModalCancel() {
    this.setState({ isVideoModalVisible: false });
  }

  async handleImageUpload() {
    const file = this.imageUploader.files[0];
    if (!file) return;

    const reader = new FileReader();

    // file type is only image.
    if (/^image\//.test(file.type)) {
      const compressFile = await resizeFile(file);
      reader.onload = e => {
        const quill = this.reactQuillRef.getEditor();
        const range = quill.getSelection();

        quill.insertEmbed(range.index, 'image', e.target.result);
        quill.setSelection(range.index + 1);
        quill.disable();

        this.saveToServer(e.target.result, range);
        this.imageUploader.value = '';
      };
      reader.readAsDataURL(compressFile);
    }
    // else {
    //   console.warn('You could only upload images.');
    // }
  }

  showVideoModal() {
    this.setState({ isVideoModalVisible: true });
  }

  videoHandler() {
    this.showVideoModal();
  }

  templateHandler(value) {
    this.props.handleTemplateChange(value);
    document.querySelector('.template-picker-text').innerHTML = document.querySelector(
      '.ql-template .ql-picker-label',
    ).dataset.value;
  }

  imageHandler() {
    this.imageUploader.click();
  }

  saveToServer(image, range) {
    this.setState({ uploading: true });
    IPFSService.upload(image)
      .then(hash => this.insertToEditor({ url: config.ipfsGateway + hash.slice(6) }, range))
      .catch(err => {
        ErrorHandler(err, 'Cannot connect to IPFS server! Please try again.');
        const quill = this.reactQuillRef.getEditor();
        quill.deleteText(range.index, 1);
        this.setState({ uploading: false });
        quill.enable();
      });
  }

  insertToEditor(file, range) {
    const image = document.createElement('img');
    image.src = file.url;
    this.imageContainer.appendChild(image);

    image.onload = () => {
      const quill = this.reactQuillRef.getEditor();
      quill.deleteText(range.index, 1);
      // const range = quill.getSelection();
      quill.insertEmbed(range.index, 'image', file.url);
      quill.setSelection(range.index + 1);

      this.setState({ uploading: false });
      quill.enable();
    };

    image.onerror = () => {
      const quill = this.reactQuillRef.getEditor();
      quill.deleteText(range.index, 1);
      this.setState({ uploading: false });
      quill.enable();
    };
  }

  render() {
    const {
      label,
      helpText,
      getValue,
      placeholder,
      setValue,
      isRequired,
      isPristine,
      isValid,
      getErrorMessage,
    } = this.props;

    const { uploading, isVideoModalVisible } = this.state;

    // Set a specific className based on the validation
    // state of this component. showRequired() is true
    // when the value is empty and the required prop is
    // passed to the input. showError() is true when the
    // value typed is invalid
    let errorClass = '';
    if (!isPristine()) {
      if (isValid()) errorClass = 'is-valid';
      else errorClass = 'has-error';
    }

    // An error message is returned ONLY if the component is invalid
    // or the server has returned an error message
    const errorMessage = getErrorMessage();

    let modules = {
      toolbar: [
        [{ header: [1, 2, false] }],
        ['bold', 'italic', 'underline', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image', 'video'],
      ],
    };

    if (this.props.templatesDropdown) {
      modules = {
        toolbar: {
          container: [
            [{ header: [1, 2, false] }],
            ['bold', 'italic', 'underline', 'blockquote'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image', 'video'],
            [
              {
                template: ['None', 'Reward DAO', 'Regular Reward', 'Expenses', 'Bounties'],
              },
            ],
          ],
        },
      };
    }

    const formats = [
      'header',
      'bold',
      'italic',
      'underline',
      'blockquote',
      'list',
      'bullet',
      'link',
      'image',
      'video',
      'template',
    ];

    return (
      <div className={`form-group ${errorClass}`}>
        <div
          style={{ display: 'none' }}
          ref={el => {
            this.imageContainer = el;
          }}
        />
        <input
          style={{ display: 'none' }}
          type="file"
          onChange={this.handleImageUpload}
          ref={e => {
            this.imageUploader = e;
          }}
        />
        <div className="label">
          {label} {isRequired() ? '*' : null}
        </div>
        <small className="form-text">{helpText}</small>
        <div className="quill-wrapper">
          {uploading && (
            <div className="loading-overlay">
              <Loader />
            </div>
          )}
          <ReactQuill
            height="200px"
            ref={el => {
              this.reactQuillRef = el;
            }}
            modules={modules}
            formats={formats}
            value={getValue()}
            name="description"
            placeholder={placeholder}
            onChange={setValue}
            id="quill-formsy"
            scrollingContainer={document.documentElement}
          />
        </div>
        <span className="help-block validation-message">{errorMessage}</span>
        <VideoPopup
          visible={isVideoModalVisible}
          handleClose={this.handleVideoModalCancel}
          reactQuillRef={this.reactQuillRef}
        />
      </div>
    );
  }
}

QuillFormsy.propTypes = {
  // Formsy proptypes
  getValue: PropTypes.func.isRequired,
  setValue: PropTypes.func.isRequired,
  isRequired: PropTypes.func.isRequired,
  isPristine: PropTypes.func.isRequired,
  isValid: PropTypes.func.isRequired,
  getErrorMessage: PropTypes.func.isRequired,
  handleTemplateChange: PropTypes.func,

  helpText: PropTypes.string,
  placeholder: PropTypes.string,
  label: PropTypes.string,

  templatesDropdown: PropTypes.bool,
};

QuillFormsy.defaultProps = {
  helpText: '',
  placeholder: '',
  label: '',
  handleTemplateChange: () => {},
  templatesDropdown: false,
};

export default withFormsy(QuillFormsy);
