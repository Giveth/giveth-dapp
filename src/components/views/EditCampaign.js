import React, { Component } from 'react'
import { Form, Input, Select } from 'formsy-react-components';
import { socket } from '../../lib/feathersClient'
import Loader from '../Loader'
import QuillFormsy from '../QuillFormsy'
// import Milestone from '../Milestone'
// import EditMilestone from '../EditMilestone'
import FormsyImageUploader from './../FormsyImageUploader'
import GoBackButton from '../GoBackButton'
import { isOwner } from '../../lib/helpers'

/**
 * Create or edit a campaign
 *
 *  @props
 *    isNew (bool):  
 *      If set, component will load an empty model.
 *      If not set, component expects an id param and will load a campaign object from backend
 *    
 *  @params
 *    id (string): an id of a campaign object
 */

class EditCampaign extends Component {
  constructor() {
    super()

    this.state = {
      isLoading: true,
      isSaving: false,
      hasError: false,
      causesOptions: [],

      // campaign model
      title: '',
      description: '',
      image: '',
      videoUrl: '',
      ownerAddress: null,
      milestones: [],
      causes: [],
    }

    this.submit = this.submit.bind(this)
    this.setImage = this.setImage.bind(this)  
  }


  componentDidMount() {
    Promise.all([
      // load a single campaigns (when editing)
      new Promise((resolve, reject) => {
        if(!this.props.isNew) {
          socket.emit('campaigns::find', {_id: this.props.match.params.id}, (error, resp) => {   
            if(resp) {  
              if(!isOwner(resp.data[0].ownerAddress, this.props.currentUser)) {
                this.props.history.goBack()
              } else {                
                this.setState(Object.assign({}, resp.data[0], {
                  id: this.props.match.params.id,
                }), resolve())  
              }
            } else {
              reject()
            }
          })  
        } else {
          resolve()
        }
      })
    ,
      // load all causes. 
      // TO DO: this needs to be replaced by something like http://react-autosuggest.js.org/
      new Promise((resolve, reject) => {
        socket.emit('causes::find', { $select: [ 'title', '_id' ] }, (err, resp) => {    
          if(resp){
            this.setState({ 
              causesOptions: resp.data.map((c) =>  { return { label: c.title, value: c._id } }),
              hasError: false
            }, resolve())
          } else {
            reject()
          }
        })
      })

    ]).then(() => this.setState({ isLoading: false, hasError: false }), this.focusFirstInput())
      .catch((e) => {
        console.log('error loading', e)
        this.setState({ isLoading: false, hasError: true })        
      })
  }

  focusFirstInput(){
    setTimeout(() => this.refs.title.element.focus(), 500)
  }

  mapInputs(inputs) {
    return {
      'title': inputs.title,
      'description': inputs.description,
      'causes': inputs.causes
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
    const constructedModel = {
      title: model.title,
      description: model.description,
      image: this.state.image,
      causes: [ model.causes ],
      ownerAddress: this.props.currentUser            
    }

    const afterEmit = () => {
      this.setState({ isSaving: false })
      this.props.history.push('/campaigns')      
    }

    this.setState({ isSaving: true })

    if(this.props.isNew){
      socket.emit('campaigns::create', constructedModel, afterEmit)
    } else {
      socket.emit('campaigns::update', this.state.id, constructedModel, afterEmit)
    }
  } 

  goBack(){
    this.props.history.push('/campaigns')
  }

  render(){
    const { isNew, history } = this.props
    let { isLoading, isSaving, title, description, image, causes, causesOptions } = this.state

    return(
        <div id="edit-campaign-view">
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
                      <h1>Start a new campaign!</h1>
                    }

                    { !isNew &&
                      <h1>Edit campaign {title}</h1>
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
                          placeholder="Describe your campaign..."
                          validations="minLength:10"  
                          help="Describe your campaign."   
                          validationErrors={{
                              minLength: 'Please provide at least 10 characters.'
                          }}                    
                          required                                        
                        />
                      </div>

                      <FormsyImageUploader setImage={this.setImage} previewImage={image}/>

                      {/* TO DO: This needs to be replaced by something like http://react-autosuggest.js.org/ */}
                      <div className="form-group">
                        <Select
                          name="causes"
                          label="Which cause does this campaign solve?"
                          options={causesOptions}
                          value={causes[0]}
                          required
                        />
                      </div>

                      <button className="btn btn-success" formNoValidate={true} type="submit" disabled={isSaving || !this.isValid()}>
                        {isSaving ? "Saving..." : "Save campaign"}
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

export default EditCampaign