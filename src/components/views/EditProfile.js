import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { Form, Input } from 'formsy-react-components';
import { socket, feathersClient } from '../../lib/feathersClient'
import Loader from '../Loader'
import FormsyImageUploader from './../FormsyImageUploader'
import { isAuthenticated } from '../../lib/middleware'
import LoaderButton from "../../components/LoaderButton"

/**
 * Edit a user profile
 *
 *  @props
 *    currentUser (string): The current user's address
 *    wallet (object): The current user's wallet
 *
 */

class EditProfile extends Component {
  constructor() {
    super()

    this.state = {
      isLoading: true,
      isSaving: false,
      formIsValid: false,

      // user model
      name: '',
      avatar: '',
      email: '',
      linkedIn: '',
      uploadNewAvatar: false
    }

    this.submit = this.submit.bind(this)
    this.setImage = this.setImage.bind(this)   
  }  

  componentDidMount() {
    isAuthenticated(this.props.currentUser, this.props.history, this.props.wallet).then(()=>
      new Promise((resolve, reject) => {
        socket.emit('users::find', {address: this.props.currentUser}, (error, resp) => { 
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
    )
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
    this.setState({ avatar: image, uploadNewAvatar: true })
  }

  submit(model) {    
    this.setState({ isSaving: true })

    const updateUser = (file) => {
      feathersClient.service('/users').update(this.props.currentUser, {
        name: model.name,
        email: model.email,
        linkedIn: model.linkedIn,
        avatar: file,
      }).then(user => {
        React.toast.success("Your profile has been updated.")
        this.setState({ isSaving: false })        
      })   
    }


    if(this.state.uploadNewAvatar) {
      feathersClient.service('/uploads').create({uri: this.state.avatar}).then(file => {
        updateUser(file.url)
      })
    } else {
      updateUser()
    }

    // // first upload image, then update user
    // feathersClient.service('/uploads').create({uri: this.state.avatar}).then(file => {
    //   feathersClient.service('/users').update(this.props.currentUser, {
    //     name: model.name,
    //     email: model.email,
    //     linkedIn: model.linkedIn,
    //     avatar: file ? file.url : null,
    //   }).then(user => {
    //     this.setState({ isSaving: false })
    //   })
    // })
  } 

  toggleFormValid(state) {
    this.setState({ formIsValid: state })
  }

  render(){
    let { isLoading, isSaving, name, email, linkedIn, avatar } = this.state

    return(
      <div id="edit-cause-view" className="container-fluid page-layout">
        <div className="row">
          <div className="col-md-8 m-auto">
            { isLoading && 
              <Loader className="fixed"/>
            }
            
            { !isLoading &&
              <div>
                <h1>Edit your profile</h1>

                <Form onSubmit={this.submit} mapping={this.mapInputs} onValid={()=>this.toggleFormValid(true)} onInvalid={()=>this.toggleFormValid(false)} layout='vertical'>
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
                      validations="isEmail"  
                      help="Please enter your email address."   
                      validationErrors={{
                        isEmail: "That's not a valid email address."
                      }}                    
                      required                                        
                    />
                  </div>

                  <FormsyImageUploader setImage={this.setImage} avatar={avatar}/>

                  <div className="form-group">
                    <Input
                      name="linkedIn"
                      label="LinkedIn Profile"
                      ref="linkedIn"
                      type="text"
                      value={linkedIn}
                      placeholder="Your linkedIn profile url"
                      validations="isUrl"
                      validationErrors={{
                        isUrl: 'Please enter your linkedin profile url'
                      }}                    
                    />
                  </div>                      

                  <LoaderButton
                    className="btn btn-success btn-lg" 
                    formNoValidate={true} 
                    type="submit" 
                    disabled={isSaving}
                    isLoading={isSaving}
                    loadingText="Saving...">
                    Save profile
                  </LoaderButton>                      
                                 
                </Form>
              </div>
            }

          </div>
        </div>
      </div>
    )
  }
}

export default EditProfile


EditProfile.propTypes = {
  wallet: PropTypes.shape({
    unlocked: PropTypes.bool,
    keystore: PropTypes.array
  }),
  currentUser: PropTypes.string,
  history: PropTypes.object.isRequired
}