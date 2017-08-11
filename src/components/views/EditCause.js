import React, { Component } from 'react'
import { Form, Input, File, Textarea } from 'formsy-react-components';
import { socket } from '../../lib/feathersClient'
/**
 * Create or edit a cause
 *
 *  @props
 *    isNew (bool):  
 *      If set, component will load an empty model.
 *      If not set, component expects an id param and will load a cause object from backend
 *    
 *  @params
 *    id (string): an id of a cause object
 */

class EditCause extends Component {
  constructor() {
    super()

    this.state = {
      isLoading: true,
      isSaving: false,
      title: '',
      description: '',
      image: '',
      videoUrl: '',      
    }

    this.submit = this.submit.bind(this)
  }

  componentDidMount() {
    const self = this

    if(!this.props.isNew) {
      socket.emit('causes::find', {_id: this.props.match.params.id}, (error, resp) => {      
        self.setState({
          id: this.props.match.params.id,
          title: resp.data[0].title,
          description: resp.data[0].description,
          image: resp.data[0].image,
          videoUrl: resp.data[0].videoUrl,
          isLoading: false
        }, self.focusFirstInput())  
      })  
    } else {
      this.setState({
        isLoading: false
      }, self.focusFirstInput())
    }
  }

  focusFirstInput(){
    const self = this
    setTimeout(() => self.refs.title.element.focus(), 0)
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
    // const socketMethod = this.props.isNew ? 'causes::create' : 'causes::update'
    const self = this

    // console.log('socketMethod', socketMethod)

    const constructedModel = {
      title: model.title,
      description: model.description,
      image: this.state.image      
    }

    const afterEmit = () => {
      self.setState({ isSaving: false })
      self.props.history.push('/causes')      
    }

    this.setState({ isSaving: true })

    if(this.props.isNew){
      socket.emit('causes::create', constructedModel, afterEmit)
    } else {
      socket.emit('causes::update', this.state.id, constructedModel, afterEmit)
    }
  } 

  goBack(){
    this.props.history.push('/causes')
  }

  render(){

    const { isNew, cause } = this.props
    let { isLoading, isSaving, title, description, image } = this.state

    return(
        <div id="edit-cause-view">
          <div className="container-fluid page-layout">
            <div className="row">
              <div className="col-md-8 offset-md-2">
                { isLoading && 
                  <center>Loading...</center>
                }
                
                { !isLoading &&
                  <div>
                    { isNew &&
                      <h1>Create a new cause</h1>
                    }

                    { !isNew &&
                      <h1>Edit cause {title}</h1>
                    }

                    <Form onSubmit={this.submit} mapping={this.mapInputs} layout='vertical'>
                      <div className="form-group">
                        <Input
                          name="title"
                          id="title-input"
                          label="Title"
                          ref="title"
                          type="text"
                          value={title}
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
                          value={description}                      
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
                        <img src={image} width="500px" />
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

                      <button className="btn btn-success" formNoValidate={true} type="submit" disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save cause"}
                      </button>
                                     
                    </Form>
                  </div>
                }

              </div>
            </div>
          </div>
      </div>
    )
  }
}

export default EditCause