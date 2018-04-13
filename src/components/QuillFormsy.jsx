import React from 'react';
import PropTypes from 'prop-types';
import { withFormsy } from 'formsy-react';
import ReactQuill from 'react-quill';

const QuillFormsy = props => {
  // Set a specific className based on the validation
  // state of this component. showRequired() is true
  // when the value is empty and the required prop is
  // passed to the input. showError() is true when the
  // value typed is invalid
  let errorClass = '';
  if (!props.isPristine()) {
    if (props.isValid()) errorClass = 'is-valid';
    else errorClass = 'has-error';
  }

  // An error message is returned ONLY if the component is invalid
  // or the server has returned an error message
  const errorMessage = props.getErrorMessage();

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
      <span className="label">
        {props.label} {props.isRequired() ? '*' : null}
      </span>

      <small className="form-text">{props.helpText}</small>
      <ReactQuill
        height="200px"
        modules={modules}
        formats={formats}
        value={props.getValue()}
        name="description"
        placeholder={props.placeholder}
        onChange={props.setValue}
      />
      <span className="help-block validation-message">{errorMessage}</span>
    </div>
  );
};

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
