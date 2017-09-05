import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { Form, Input } from 'formsy-react-components';
import { socket, feathersClient } from './../../lib/feathersClient'
import Loader from './../Loader'
import QuillFormsy from './../QuillFormsy'
import FormsyImageUploader from './../FormsyImageUploader'
import GoBackButton from '../GoBackButton'
import { isOwner } from '../../lib/helpers'
import { isAuthenticated } from '../../lib/middleware'

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
      isLoading: true,
      isSaving: false,
      hasError: false,

      // milestone model
      title: '',
      description: '',
      image: '',
      videoUrl: '',
      ownerAddress: '',
      reviewerAddress: '',
      recipientAddress: '',
      donationsReceived: 0,
      donationsGiven: 0,
      completionDeadline: new Date(),
      completionStatus: 'pending'      
    }

    this.submit = this.submit.bind(this)
    this.setImage = this.setImage.bind(this)
  } 


  componentDidMount() {
    isAuthenticated(this.props.currentUser, this.props.history, this.props.wallet).then(()=> {
      this.setState({ campaignId: this.props.match.params.id })

      // load a single milestones (when editing)
      if(!this.props.isNew) {
        socket.emit('milestones::find', {_id: this.props.match.params.milestoneId}, (error, resp) => {   
          if(resp) { 
            if(!isOwner(resp.data[0].owner.address, this.props.currentUser)) {
              this.props.history.goBack()
            } else {         
              this.setState(Object.assign({}, resp.data[0], {
                id: this.props.match.params.milestoneId,
                isLoading: false,
                hasError: false
              }), this.focusFirstInput()) 
            }
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
    })
  }

  focusFirstInput(){
    setTimeout(() => this.refs.title.element.focus(), 500)
  }

  setImage(image) {
    this.setState({ image: image })
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


  isValid() {
    return true
    return this.state.description.length > 0 && this.state.title.length > 10 && this.state.image.length > 0
  }

  submit(model) {    
    const afterEmit = () => {
      this.setState({ isSaving: false })
      this.props.history.goBack()  
    }

    this.setState({ isSaving: true })

    feathersClient.service('/uploads').create({uri: this.state.image}).then(file => {
      const constructedModel = {
        title: model.title,
        description: model.description,
        reviewerAddress: model.reviewerAddress,
        recipientAddress: model.recipientAddress,
        completionDeadline: model.completionDeadline,
        image: file.url,
        campaignId: this.state.campaignId
      }    

      if(this.props.isNew){
        socket.emit('milestones::create', constructedModel, afterEmit)
      } else {
        socket.emit('milestones::patch', this.state.id, constructedModel, afterEmit)
      }
    })
  } 

  render(){
    const { isNew, history } = this.props
    let { isLoading, isSaving, title, description, image, recipientAddress, reviewerAddress, completionDeadline } = this.state

    return(
        <div id="edit-milestone-view">
          <div className="container-fluid page-layout">
            <div className="row">
              <div className="col-md-8 m-auto">
                { isLoading && 
                  <Loader className="fixed"/>
                }
                
                { !isLoading &&
                  <div>
                    <GoBackButton history={history}/>
                  
                    { isNew &&
                      <h1>Add a new milestone</h1>
                    }

                    { !isNew &&
                      <h1>Edit milestone {title}</h1>
                    }

                    <Form onSubmit={this.submit} mapping={this.mapInputs} onChange={this.change} layout='vertical'>

                      <div className="form-group">
                        <Input
                          name="title"
                          id="title-input"
                          ref="title"
                          type="text"
                          value={title}
                          placeholder="E.g. Climate change."
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

                      <FormsyImageUploader setImage={this.setImage} previewImage={image}/>

                      <Input
                        name="reviewerAddress"
                        id="title-input"
                        label="Reviewer Address"
                        type="text"
                        value={reviewerAddress}
                        placeholder="Who will review this milestone?"
                        help="Enter an Ethereum address."
                        validations="minLength:10"
                        validationErrors={{
                            minLength: 'Please provide at least 10 characters.'
                        }}                    
                        required
                      />    

                      <Input
                        name="recipientAddress"
                        id="title-input"
                        label="Recipient Address"
                        type="text"
                        value={recipientAddress}
                        placeholder="Where will the money go?"
                        help="Enter an Ethereum address."
                        validations="minLength:10"
                        validationErrors={{
                            minLength: 'Please provide at least 10 characters.'
                        }}                    
                        required
                      />   

                      <Input
                        name="completionDeadline"
                        id="title-input"
                        label="Recipient Address"
                        type="text"
                        value={completionDeadline}
                        placeholder="When will the milestone be completed?"
                        help="Enter a date."
                        validations="minLength:10"
                        validationErrors={{
                            minLength: 'Please provide at least 10 characters.'
                        }}                    
                        required
                      />   
                                              
                      <button className="btn btn-success" formNoValidate={true} type="submit" disabled={isSaving || !this.isValid()}>
                        {isSaving ? "Saving..." : "Save milestone"}
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

export default EditMilestone

EditMilestone.propTypes = {
  currentUser: PropTypes.string,
  history: PropTypes.object.isRequired,
  isNew: PropTypes.bool
}