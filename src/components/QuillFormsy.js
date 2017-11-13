import React from 'react'
import createReactClass from 'create-react-class'
import Formsy from 'formsy-react';
import ReactQuill from 'react-quill'


const QuillFormsy = createReactClass({
  mixins: [Formsy.Mixin],

  changeValue(value, delta, source, editor) {
    this.setValue(value);
    this.props.onTextChanged(editor.getText())
  },

  render() {
    // Set a specific className based on the validation
    // state of this component. showRequired() is true
    // when the value is empty and the required prop is
    // passed to the input. showError() is true when the
    // value typed is invalid
    const errorClass = this.isPristine() ? '' : this.isValid() ? 'is-valid' : 'has-error'

    // An error message is returned ONLY if the component is invalid
    // or the server has returned an error message
    const errorMessage = this.getErrorMessage();

    const modules = {
      toolbar: [
        [{ 'header': [1, 2, false] }],
        ['bold', 'italic', 'underline','strike', 'blockquote'],
        [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
        ['link', 'image', 'video'],
        ['clean']
      ],
    }

    const formats = [
      'header',
      'bold', 'italic', 'underline', 'strike', 'blockquote',
      'list', 'bullet', 'indent',
      'link', 'image', 'video'
    ]     


    return (
      <div className={`form-group ${errorClass}`}>
        <label>{this.props.label} {this.isRequired() ? '*' : null}</label>
        <small className="form-text">{this.props.helpText}</small>
        <ReactQuill 
          height="200px"
          modules={modules}
          formats={formats}
          value={this.getValue()}
          name="description"
          tabIndex={2}
          placeholder={this.props.placeholder}
          onChange={this.changeValue} 
          />  
        <span className="help-block validation-message">{errorMessage}</span>
      </div>
    );
  }  
})

export default QuillFormsy