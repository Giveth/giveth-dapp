import React, { Component } from 'react'
import { Form, Input, File } from 'formsy-react-components';
import { socket } from '../lib/feathersClient'
import Loader from './Loader'
import QuillFormsy from './QuillFormsy'


/**
 * Create or edit a milestone
 *
 *  @props
 *    isNew (bool):  
 *      If set, component will load an empty model.
 *      If not set, component expects an id param and will load a milestone object from backend
 *    
 *  @params
 *    id (string): an id of a milestone object
 */

class EditMilestone extends Component {
  constructor() {
    super()

    this.state = {
      id: Math.random().toString(36).substr(2, 10),
      isLoading: true,
      isSaving: false,
      title: '',
      description: '',
      image: '',
      videoUrl: '',
      ownerAddress: null,
      reviewerAddress: null,      
      recipientAddress: null,
      donationsReceived: 0,
      donationsGiven: 0,      
      completionDeadline: new Date(),
      completionStatus: 'pending',

      hasError: false
    }

    this.submit = this.submit.bind(this)
  } 


  componentDidMount() {
    // load a single milestones (when editing)
    if(!this.props.isNew) {
      socket.emit('milestones::find', {_id: this.props.match.params.id}, (error, resp) => {   
        console.log(resp) 
        if(resp) {  
          const r = resp.data[0]

          this.setState({
            id: this.props.match.params.id,
            title: r.title,
            description: r.description,
            image: r.image,
            videoUrl: r.videoUrl,
            ownerAddress: r.ownerAddress,
            reviewerAddress: r.reviewerAddress,
            recipientAddress: r.recipientAddress,
            donationsReceived: r.donationsReceived,
            donationsGiven: r.donationsGiven,
            completionDeadline: r.completionDeadline,
            completionStatus: r.completionStatus,
            isLoading: false,
            hasError: false
          }, this.focusFirstInput())  
        } else {
          this.setState( { 
            isLoading: false,
            hasError: true
          })
        }
      })  
    } else {
      this.setState({ isLoading: false })
    }

  }

  focusFirstInput(){
    setTimeout(() => this.refs.title.element.focus(), 500)
  }

  mapInputs(inputs) {
    return {
      'title': inputs.title,
      'description': inputs.description,
      'reviewerAddress': inputs.reviewerAddress,
      'recipientAddress': inputs.recipientAddress,
      'completionDeadline': inputs.completionDeadline
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
      reviewerAddress: model.reviewerAddress,
      recipientAddress: model.recipientAddress,
      completionDeadline: model.completionDeadline,
      image: this.state.image            
    }

    const afterEmit = () => {
      this.setState({ isSaving: false })
      this.props.history.push('/milestones')      
    }

    this.setState({ isSaving: true })

    if(this.props.isNew){
      socket.emit('milestones::create', constructedModel, afterEmit)
    } else {
      socket.emit('milestones::update', this.state.id, constructedModel, afterEmit)
    }
  } 

  addMilestone(){
    let milestones = this.state.milestones
    milestones.push(this.milestone)
    console.log('milestones', milestones)
    this.setState({ milestones: milestones }) 
  }

  removeMilestone(milestone){
    this.setState({ milestones: this.state.milestones.filter((m) => {
        return m !== milestone
      })
    })
  }

  goBack(){
    this.props.history.push('/milestones')
  }

  render(){
    const { isNew } = this.props
    let { id, isLoading, isSaving, title, description, image } = this.state

    return(
      <div className="card">
        { isLoading && 
          <Loader className="fixed"/>
        }
        
        { !isLoading &&
          <div>
            <div className="card-header">
              <a data-toggle="collapse" href={"#" + id} aria-expanded="true" aria-controls="collapse-area">
                { isNew &&
                  <h5 className="card-title">Add a new milestone!</h5>
                }

                { !isNew &&
                  <h5 className="card-title">Edit milestone {title}</h5>
                }
              </a>
            </div>

            <div id={id} className="collapse show" role="tabpanel" aria-labelledby="headingOne" data-parent={'#' + id}>
              <div className="card-body">            
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
                      help="Describe your milestone in 1 scentence."
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
                      placeholder="Describe your milestone..."
                      validations="minLength:10"  
                      help="Describe your milestone."   
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
                    {isSaving ? "Saving..." : "Save milestone"}
                  </button>
                                 
                </Form>
              </div>
            </div>
          </div>
        }
      </div>
    )
  }
}

export default EditMilestone