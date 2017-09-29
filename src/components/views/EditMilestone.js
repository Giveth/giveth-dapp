import React, { Component } from 'react'
import PropTypes from 'prop-types'
import LPPMilestone from 'lpp-milestone';

import { Form, Input } from 'formsy-react-components';
import { feathersClient } from './../../lib/feathersClient'
import Loader from './../Loader'
import QuillFormsy from './../QuillFormsy'
import FormsyImageUploader from './../FormsyImageUploader'
import GoBackButton from '../GoBackButton'
import { isOwner } from '../../lib/helpers'
import { isAuthenticated } from '../../lib/middleware'
import { getTruncatedText } from '../../lib/helpers'
import getNetwork from "../../lib/blockchain/getNetwork";
import getWeb3 from "../../lib/blockchain/getWeb3";
import LoaderButton from "../../components/LoaderButton"
import DatePickerFormsy from './../DatePickerFormsy'

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
      formIsValid: false,      

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
      completionStatus: 'pending',
      uploadNewImage: false         
    }

    this.submit = this.submit.bind(this)
    this.setImage = this.setImage.bind(this)
  } 


  componentDidMount() {
    isAuthenticated(this.props.currentUser, this.props.history, this.props.wallet).then(()=> {
      this.setState({ campaignId: this.props.match.params.id })

      // load a single milestones (when editing)
      if(!this.props.isNew) {
        feathersClient.service('milestones').find({query: {_id: this.props.match.params.milestoneId}})
          .then((resp) => {
            console.log("resp", resp)
            if(!isOwner(resp.data[0].owner.address, this.props.currentUser)) {
              this.props.history.goBack()
            } else {         
              this.setState(Object.assign({}, resp.data[0], {
                id: this.props.match.params.milestoneId,
                isLoading: false,
                hasError: false
              }), this.focusFirstInput()) 
            }
          })
          .catch(()=>
            this.setState( { 
              isLoading: false,
              hasError: true
            }))
      } else {
        feathersClient.service('campaigns').get(this.props.match.params.id)
          .then(campaign => {
            if (!campaign.projectId) {
              this.props.history.goBack();
            } else {
              this.setState({
                campaignProjectId: campaign.projectId,
                isLoading: false,
              });
            }
          });
      }
    })
  }

  focusFirstInput(){
    setTimeout(() => this.refs.title.element.focus(), 500)
  }

  setImage(image) {
    this.setState({ image: image,  uploadNewImage: true })
  }

  changeDate(moment) {
    console.log('change date', moment.format('YYYY/MM/DD'))
    this.setState({ completionDeadline: moment.format('YYYY/MM/DD') })
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

  submit(model) {  
    this.setState({ isSaving: true })

    const afterEmit = () => {
      this.setState({ isSaving: false })
      this.props.history.goBack()  
    }

    const updateMilestone = (file) => {
      const constructedModel = {
        title: model.title,
        description: model.description,
        summary: getTruncatedText(this.state.summary, 200),        
        reviewerAddress: model.reviewerAddress,
        recipientAddress: model.recipientAddress,
        completionDeadline: this.state.completionDeadline,
        image: file,
        campaignId: this.state.campaignId,
        status: 'unstarted'
      };

      if(this.props.isNew){
        const createMilestone = () => {
          constructedModel.txHash = txHash;
          constructedModel.pluginAddress = '0x0000000000000000000000000000000000000000';
          feathersClient.service('milestones').create(constructedModel)
            .then(() => afterEmit(true))
        };

        let txHash;
        let etherScanUrl;
        Promise.all([ getNetwork(), getWeb3() ])
          .then(([ network, web3 ]) => {
            const { liquidPledging } = network;
            etherScanUrl = network.txHash;

            //TODO set this in form
            const maxAmount = web3.utils.toWei(100000000); // 100 million ether

            // web3, lp address, name, parentProject, recipient, maxAmount, reviewer
            LPPMilestone.new(web3, liquidPledging.$address, model.title, this.state.campaignProjectId, model.recipientAddress, maxAmount, model.reviewerAddress)
              .on('transactionHash', (hash) => {
                txHash = hash;
                createMilestone(txHash);
                React.toast.info(`Your milestone is pending. ${network.etherscan}tx/${txHash}`)
              })
              .then(() => {
                React.toast.success(`Milestone successfully created. ${network.etherscan}tx/${txHash}`);
              })
          })
          .catch(err => {
            console.log('New milestone transaction failed:', err);
            let msg;
            if (txHash) {
              msg = `Something went wrong with the transaction. ${etherScanUrl}tx/${txHash}`;
              //TODO update or remove from feathers? maybe don't remove, so we can inform the user that the tx failed and retry
            } else {
              msg = "Something went wrong creating the milestone. Is your wallet unlocked?";
            }
            React.toast.error(msg);
          });


      } else {
        feathersClient.service('milestones').patch(this.state.id, constructedModel)
          .then(()=> afterEmit())        
      }         

    }

    if(this.state.uploadNewImage) {
      feathersClient.service('/uploads').create({uri: this.state.image}).then(file => updateMilestone(file.url))
    } else {
      updateMilestone()
    }
  } 

  toggleFormValid(state) {
    this.setState({ formIsValid: state })
  }    

  constructSummary(text){
    this.setState({ summary: text})
  }    

  render(){
    const { isNew, history } = this.props
    let { isLoading, isSaving, title, description, image, recipientAddress, reviewerAddress, completionDeadline, formIsValid } = this.state

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

                    <Form onSubmit={this.submit} mapping={this.mapInputs} onValid={()=>this.toggleFormValid(true)} onInvalid={()=>this.toggleFormValid(false)} layout='vertical'>

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
                          onTextChanged={(content)=>this.constructSummary(content)}                                                    
                          validations="minLength:10"  
                          help="Describe your milestone."   
                          validationErrors={{
                              minLength: 'Please provide at least 10 characters.'
                          }}                    
                          required                                        
                        />
                      </div>

                      <FormsyImageUploader setImage={this.setImage} previewImage={image} required={isNew}/>

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

                      <DatePickerFormsy
                        name="completionDeadline"
                        label="Completion date"
                        type="text"
                        value={completionDeadline}
                        changeDate={(date)=>this.changeDate(date)}
                        placeholder="When will the milestone be completed?"
                        help="Enter a date."
                        validations="minLength:10"
                        validationErrors={{
                            minLength: 'Please provide a date.'
                        }}                    
                        required
                      />   
                                              
                      <LoaderButton
                        className="btn btn-success" 
                        formNoValidate={true} 
                        type="submit" 
                        disabled={isSaving || !formIsValid}
                        isLoading={isSaving}
                        loadingText="Saving...">
                        Save Milestone
                      </LoaderButton>         

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