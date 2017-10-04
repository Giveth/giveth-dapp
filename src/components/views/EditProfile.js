import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { Form, Input } from 'formsy-react-components';
import { feathersClient } from '../../lib/feathersClient'
import Loader from '../Loader'
import FormsyImageUploader from './../FormsyImageUploader'
import { isAuthenticated } from '../../lib/middleware'
import LoaderButton from "../../components/LoaderButton"
import getNetwork from "../../lib/blockchain/getNetwork";
import currentUserModel from '../../models/currentUserModel'
import { displayTransactionError } from '../../lib/helpers'

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
      uploadNewAvatar: false,
    }

    this.submit = this.submit.bind(this)
    this.setImage = this.setImage.bind(this)
  }

  componentDidMount() {
    isAuthenticated(this.props.currentUser, this.props.history, this.props.wallet)
      .then(() => feathersClient.service('users').find({query: {address: this.props.currentUser.address}}))
      .then((resp) =>
        this.setState(Object.assign({}, resp.data[0],
          { isLoading: false })), this.focusFirstInput()
      )
      .catch(err => {
        console.log(err);

        // set donorId to 0. This way we don't create 2 Donors for the same user
        this.setState({
          donorId: 0,
          isLoading: false,
          hasError: true,
        });
      });
  }

  focusFirstInput(){
    setTimeout(() => this.refs.name.element.focus(), 200)
  }

  mapInputs(inputs) {
    return {
      'name': inputs.name,
      'email': inputs.email,
      'linkedIn': inputs.linkedIn,
    }
  }

  setImage(image) {
    this.setState({ avatar: image, uploadNewAvatar: true })
  }

  submit(model) {
    this.setState({ isSaving: true })


    const updateUser = (file) => {
      const constructedModel = {
        name: model.name,
        email: model.email,
        linkedIn: model.linkedIn,
        avatar: file,
        // if no donorId, set to 0 so we don't add 2 donors for the same user if they update their profile
        // before the AddDonor tx has been mined. 0 is a reserved donorId
        donorId: this.state.donorId || 0,
      };

      // TODO if (donorId > 0), need to send tx if commitTime or name has changed
      // TODO store user profile on ipfs and add Donor in liquidpledging contract
      if (this.state.donorId === undefined) {
        getNetwork()
          .then(network => {
            const { liquidPledging } = network;

            let txHash;
            liquidPledging.addDonor(model.name, 259200, '0x0') // 3 days commitTime. TODO allow user to set commitTime
              .once('transactionHash', hash => {
                txHash = hash;
                feathersClient.service('/users').patch(this.props.currentUser.address, constructedModel)
                  .then((user) => {
                    React.toast.success(<p>Your profile was created!<br/><a href={`${network.etherscan}tx/${txHash}`} target="_blank" rel="noopener noreferrer">View transaction</a></p>)
                    this.setState(Object.assign({}, user, { isSaving: false }));
                  });
              })
              .then(txReceipt => 
                React.toast.success(<p>You are now a registered user<br/><a href={`${network.etherscan}tx/${txHash}`} target="_blank" rel="noopener noreferrer">View transaction</a></p>))
              .catch(err => {
                console.log('AddDonor transaction failed:', err)
                displayTransactionError(txHash, network.etherscan)
              })
          })
      } else {
        feathersClient.service('/users').patch(this.props.currentUser.address, constructedModel)
        .then(user => {
          React.toast.success("Your profile has been updated.");
          this.setState(Object.assign({}, user, { isSaving: false }));
        })
          .catch(err => console.log('update profile error -> ', err));
      }
    };


    if (this.state.uploadNewAvatar) {
      feathersClient.service('/uploads').create({ uri: this.state.avatar }).then(file => {
        updateUser(file.url)
      })
    } else {
      updateUser()
    }

    // // first upload image, then update user
    // feathersClient.service('/uploads').create({uri: this.state.avatar}).then(file => {
    //   feathersClient.service('/users').update(this.props.currentUser.address, {
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

  render() {
    let { isLoading, isSaving, name, email, linkedIn, avatar } = this.state

    return (
      <div id="edit-cause-view" className="container-fluid page-layout">
        <div className="row">
          <div className="col-md-8 m-auto">
            {isLoading &&
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
                    className="btn btn-success" 
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
    keystore: PropTypes.array,
  }),
  currentUser: currentUserModel,
  history: PropTypes.object.isRequired,
};