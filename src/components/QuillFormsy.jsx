import React from 'react';
import PropTypes from 'prop-types';
import { withFormsy } from 'formsy-react';
import ReactQuill from 'react-quill';

class QuillFormsy extends React.Component {
  constructor(props) {
    super(props);

    this.changeValue = this.changeValue.bind(this);
  }

  changeValue(desc) {
    this.props.setValue(desc);
  }

  render() {
    // Set a specific className based on the validation
    // state of this component. showRequired() is true
    // when the value is empty and the required prop is
    // passed to the input. showError() is true when the
    // value typed is invalid
    let errorClass = '';
    if (!this.props.isPristine()) {
      if (this.props.isValid()) errorClass = 'is-valid';
      else errorClass = 'has-error';
    }

    // An error message is returned ONLY if the component is invalid
    // or the server has returned an error message
    const errorMessage = this.props.getErrorMessage();

    const modules = {
      toolbar: [
        [{ header: [1, 2, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
        ['link', 'image', 'video'],
        ['clean'],
      ],
    };

    const formats = [
      'header',
      'bold',
      'italic',
      'underline',
      'strike',
      'blockquote',
      'list',
      'bullet',
      'indent',
      'link',
      'image',
      'video',
    ];

    return (
      <div className={`form-group ${errorClass}`}>
        <label>
          {this.props.label} {this.props.isRequired() ? '*' : null}
        </label>
        <small className="form-text">{this.props.helpText}</small>
        <ReactQuill
          height="200px"
          modules={modules}
          formats={formats}
          value={this.props.getValue()}
          name="description"
          placeholder={this.props.placeholder}
          onChange={this.changeValue}
        />
        <span className="help-block validation-message">{errorMessage}</span>
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

  helpText: PropTypes.string,
  placeholder: PropTypes.string,
  label: PropTypes.string,
};

QuillFormsy.defaultProps = {
  helpText: '',
  placeholder: '',
  label: '',
};

export default withFormsy(QuillFormsy);
