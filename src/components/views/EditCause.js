import React, { Component } from 'react'
import { Form, Input, File, Textarea } from 'formsy-react-components';
import { feathersClient } from '../../lib/feathersClient'


class EditCause extends Component {
  constructor() {
    super()

    this.state = {
      image: '',
      videoUrl: '',
      canSubmit: false
    }
  }

  componentDidMount() {
    this.refs.title.element.focus()
  }

  mapInputs(inputs) {
    return {
      'title': inputs.title,
      'description': inputs.description
    }
  }  

  loadAndPreviewImage() {
    const reader = new FileReader()  
    const self = this

    reader.onload = (e) => {
      self.setState({ image: e.target.result }) 
    }

    reader.readAsDataURL(this.refs.imagePreview.element.files[0])
  }

  submit(model) {    
    const causes = feathersClient.service('/causes')
    causes.create({
      title: model.title,
      description: model.description,
      image: this.state.image
    })
  }  

  render(){

    const { isNew, cause } = this.props

    return(
        <div id="edit-cause-view">
          <div className="container-fluid page-layout">
            <div className="row">
              <div className="col-md-8 offset-md-2">
                { isNew &&
                  <h1>Create a new cause</h1>
                }

                { !isNew &&
                  <h1>Edit cause {cause.title}</h1>
                }

                <Form onSubmit={this.submit.bind(this)} mapping={this.mapInputs} layout='vertical'>
                  <div className="form-group">
                    <Input
                      name="title"
                      id="title-input"
                      label="Title"
                      ref="title"
                      type="text"
                      placeholder="E.g. Climate change."
                      help="Describe your cause in 1 scentence."
                      validations="minLength:10"
                      validationErrors={{
                          minLength: 'Please provide at least 10 characters.'
                      }}                    
                      required
                    />
                  </div>

                  <div className="form-group">
                    <Textarea
                      rows={10}
                      cols={40}
                      name="description"
                      label="Description"
                      placeholder="This field requires 10 characters."
                      help="Make this cause appealing to support."
                      validations="minLength:10"
                      validationErrors={{
                          minLength: 'Please provide at least 10 characters.'
                      }}
                      required
                    />     
                  </div>

                  <div id="image-preview">
                    <img src={this.state.image} width="500px" />
                  </div>

                  <div className="form-group">
                    <File
                      name="picture"
                      label="Add a picture"
                      onChange={()=>this.loadAndPreviewImage()}
                      ref="imagePreview"
                      required
                    />
                  </div>

                  <input className="btn btn-success" formNoValidate={true} type="submit" defaultValue="Create Cause" />
                                 
                </Form>
              </div>
            </div>
          </div>
      </div>
    )
  }
}

export default EditCause