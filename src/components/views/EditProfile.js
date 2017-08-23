import React, { Component } from 'react'
import { Form, Input } from 'formsy-react-components';
import { socket, feathersClient } from '../../lib/feathersClient'
import Loader from '../Loader'
import QuillFormsy from '../QuillFormsy';
import FormsyImageUploader from './../FormsyImageUploader'
import GoBackButton from '../GoBackButton'
import { isOwner } from '../../lib/helpers'

/**
 * Create or edit a user profile
 *
 *  @props
 *    isNew (bool):  
 *      If set, component will load an empty model.
 *      If not set, component expects an id param and will load a user object from backend
 *    
 *  @params
 *    address (string): an id of a user object
 */

class EditProfile extends Component {
  constructor() {
    super()

    this.state = {
      isLoading: true,
      isSaving: false,

      // user model
      name: '',
      avatar: '',
      email: '',
      linkedIn: '' 
    }

    this.submit = this.submit.bind(this)
    this.setImage = this.setImage.bind(this)        
  }  

  componentDidMount() {
    console.log('cu', this.props.currentUser)

    new Promise((resolve, reject) => {
      socket.emit('users::find', {address: this.props.currentUser}, (error, resp) => { 
        console.log('find user: ', error, resp)   
        if(resp) {
          this.setState(Object.assign({}, resp.data[0], {
            isLoading: false
          }, resolve()))
        } else {
          this.setState( { 
            isLoading: false,
            hasError: true
          }, resolve())          
        }
      })  
    }).then(() => this.setState({ isLoading: false }, this.focusFirstInput()))
  }

  focusFirstInput(){
    setTimeout(() => this.refs.name.element.focus(), 0)
  }

  mapInputs(inputs) {
    return {
      'name': inputs.name,
      'email': inputs.email,
      'linkedIn': inputs.linkedIn
    }
  }

  setImage(image) {
    this.setState({ avatar: image })
  }

  isValid() {
    return true
    return this.state.name.length > 0 && this.state.email.length > 10 && this.state.avatar.length > 0
  }

  submit(model) {    
    const constructedModel = {
      name: model.name,
      email: model.email,
      linkedIn: model.linkedIn,
      avatar: this.state.avatar,
    }

    this.setState({ isSaving: true })

    console.log('cuc', this.props.currentUser, constructedModel)

    feathersClient.service('/users').update(this.props.currentUser, 
      constructedModel
    , {
      nedb: { upsert: true }
    }).then(user => {
      console.log('upserted user', user)
      this.setState({ isSaving: false })
    })

    // socket.emit('users::update', 
    //   this.props.currentUser, 
    //   constructedModel, 
    //   this.setState({ isSaving: false }))
  } 

  goBack(){
    this.props.history.push('/causes')
  }

  render(){
    let { isLoading, isSaving, name, email, linkedIn, avatar } = this.state

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
                    <h1>Edit your profile</h1>

                    <Form onSubmit={this.submit} mapping={this.mapInputs} layout='vertical'>
                      <div className="form-group">
                        <Input
                          name="name"
                          id="name-input"
                          label="Your name"
                          ref="name"
                          type="text"
                          value={name}
                          placeholder="John Doe."
                          validations="minLength:3"
                          validationErrors={{
                              minLength: 'Please enter your name'
                          }}                    
                          required
                        />
                      </div>

                      <div className="form-group">
                        <Input 
                          name="email"
                          label="Email"
                          value={email}
                          placeholder="email@example.com"
                          validations="minLength:10"  
                          help="Please enter your email address."   
                          validationErrors={{
                              minLength: 'Please provide at least 10 characters.'
                          }}                    
                          required                                        
                        />
                      </div>

                      <FormsyImageUploader setImage={this.setImage} previewImage={avatar}/>

                      <div className="form-group">
                        <Input
                          name="linkedIn"
                          label="LinkedIn Profile"
                          ref="linkedIn"
                          type="text"
                          value={linkedIn}
                          placeholder="Your linkedIn profile url"
                          validations="minLength:3"
                          validationErrors={{
                              minLength: 'Please enter your linkedin profile url'
                          }}                    
                        />
                      </div>                      

                      <button className="btn btn-success" formNoValidate={true} type="submit" disabled={isSaving || !this.isValid()}>
                        {isSaving ? "Saving..." : "Save profile"}
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

export default EditProfile