import React, { Component } from 'react'
import { Form, Input, File } from 'formsy-react-components';
import { socket } from '../../lib/feathersClient'
import Loader from '../Loader'
import QuillFormsy from '../QuillFormsy';

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
      ownerAddress: null      
    }

    this.submit = this.submit.bind(this)
  }  

  componentDidMount() {
    if(!this.props.isNew) {
      socket.emit('causes::find', {_id: this.props.match.params.id}, (error, resp) => {      
        this.setState({
          id: this.props.match.params.id,
          title: resp.data[0].title,
          description: resp.data[0].description,
          image: resp.data[0].image,
          videoUrl: resp.data[0].videoUrl,
          ownerAddress: resp.data[0].ownerAddress,          
          isLoading: false
        }, this.focusFirstInput())  
      })  
    } else {
      this.setState({
        isLoading: false
      }, this.focusFirstInput())
    }
  }

  focusFirstInput(){
    setTimeout(() => this.refs.title.element.focus(), 0)
  }

  mapInputs(inputs) {
    return {
      'title': inputs.title,
      'description': inputs.description
    }
  }  

  loadAndPreviewImage() {
    const reader = new FileReader()  

    reader.onload = (e) => this.setState({ image: e.target.result })

    reader.readAsDataURL(this.refs.imagePreview.element.files[0])
  }

  isValid() {
    return true
    return this.state.description.length > 0 && this.state.title.length > 10 && this.state.image.length > 0
  }

  submit(model) {    
    const constructedModel = {
      title: model.title,
      description: model.description,
      image: this.state.image      
    }

    const afterEmit = () => {
      this.setState({ isSaving: false })
      this.props.history.push('/dacs')      
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
    const { isNew } = this.props
    let { isLoading, isSaving, title, description, image } = this.state

    return(
        <div id="edit-cause-view">
          <div className="container-fluid page-layout">
            <div className="row">
              <div className="col-md-8 m-auto">
                { isLoading && 
                  <Loader className="fixed"/>
                }
                
                { !isLoading &&
                  <div>
                    { isNew &&
                      <h1>Start a new cause!</h1>
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
                        <QuillFormsy 
                          name="description"
                          label="Description"
                          value={description}
                          placeholder="Describe your cause..."
                          validations="minLength:10"  
                          help="Describe your cause."   
                          validationErrors={{
                              minLength: 'Please provide at least 10 characters.'
                          }}                    
                          required                                        
                        />
                      </div>

                      <div id="image-preview">
                        <img src={image} width="500px" alt=""/>
                      </div>

                      <div className="form-group">
                        <label>Add a picture</label>
                        <File
                          name="picture"
                          onChange={()=>this.loadAndPreviewImage()}
                          ref="imagePreview"
                          required
                        />
                      </div>

                      <button className="btn btn-success" formNoValidate={true} type="submit" disabled={isSaving || !this.isValid()}>
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