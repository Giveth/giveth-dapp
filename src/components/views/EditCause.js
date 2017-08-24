import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { Form, Input } from 'formsy-react-components';
import { socket, feathersClient } from '../../lib/feathersClient'
import Loader from '../Loader'
import QuillFormsy from '../QuillFormsy'
import FormsyImageUploader from './../FormsyImageUploader'
import GoBackButton from '../GoBackButton'
import { isOwner } from '../../lib/helpers'
import { isAuthenticated } from '../../lib/middleware'

/**
 * Create or edit a cause (DAC)
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

      // DAC model
      title: '',
      description: '',
      image: '',
      videoUrl: '',  
      ownerAddress: null      
    }

    this.submit = this.submit.bind(this)
    this.setImage = this.setImage.bind(this)        
  }  

  componentDidMount() {
    isAuthenticated(this.props.currentUser, this.props.history).then(()=> {
      if(!this.props.isNew) {
        socket.emit('causes::find', {_id: this.props.match.params.id}, (error, resp) => {    
          if(resp) {
            if(!isOwner(resp.data[0].owner.address, this.props.currentUser)) {
              this.props.history.goBack()
            } else {
              this.setState(Object.assign({}, resp.data[0], {
                id: this.props.match.params.id,       
                isLoading: false
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
        this.setState({
          isLoading: false
        }, this.focusFirstInput())
      }
    })
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

  setImage(image) {
    this.setState({ image: image })
  }

  isValid() {
    return true
    return this.state.description.length > 0 && this.state.title.length > 10 && this.state.image.length > 0
  }

  submit(model) {    
    const afterEmit = () => {
      this.setState({ isSaving: false })
      this.props.history.push('/dacs')      
    }

    this.setState({ isSaving: true })

    feathersClient.service('/uploads').create({uri: this.state.image}).then(file => {
      const constructedModel = {
        title: model.title,
        description: model.description,
        image: file.url,
      }

      if(this.props.isNew){
        socket.emit('causes::create', constructedModel, afterEmit)
      } else {
        socket.emit('causes::update', this.state.id, constructedModel, afterEmit)
      }
    })
  } 

  goBack(){
    this.props.history.push('/causes')
  }

  render(){
    const { isNew, history } = this.props
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
                    <GoBackButton history={history}/>

                    { isNew &&
                      <h1>Start a Democratic Autonomous Charity!</h1>
                    }

                    { !isNew &&
                      <h1>Edit DAC</h1>
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
                          help="Describe your DAC in 1 scentence."
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
                          label="What cause are you solving?"
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

                      <FormsyImageUploader setImage={this.setImage} previewImage={image}/>

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

EditCause.propTypes = {
  currentUser: PropTypes.string,
  history: PropTypes.object.isRequired,
  isNew: PropTypes.bool
}