import React, { Component } from 'react'
import PropTypes from 'prop-types';
import LPPCampaign from 'lpp-campaign';

import { Form, Input } from 'formsy-react-components';
import { feathersClient } from '../../lib/feathersClient'
import Loader from '../Loader'
import QuillFormsy from '../QuillFormsy'
// import Milestone from '../Milestone'
// import EditMilestone from '../EditMilestone'
import FormsyImageUploader from './../FormsyImageUploader'
import GoBackButton from '../GoBackButton'
import { isOwner } from '../../lib/helpers'
import { isAuthenticated, checkWalletBalance, isInWhitelist } from '../../lib/middleware'
import getNetwork from "../../lib/blockchain/getNetwork";
import getWeb3 from "../../lib/blockchain/getWeb3";
import { getTruncatedText } from '../../lib/helpers'
import LoaderButton from "../../components/LoaderButton"

import InputToken from "react-input-token";
import "react-input-token/lib/style.css";
import currentUserModel from '../../models/currentUserModel'
import { displayTransactionError, getRandomWhitelistAddress } from '../../lib/helpers'

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
      formIsValid: false,      
      dacsOptions: [],

      // campaign model
      title: '',
      description: '',
      summary: '',
      image: '',
      videoUrl: '',
      communityUrl: '',      
      ownerAddress: null,
      reviewerAddress: getRandomWhitelistAddress(React.whitelist.reviewerWhitelist),
      tokenName: '',
      tokenSymbol: '',
      projectId: 0,
      milestones: [],
      dacs: [],
      uploadNewImage: false,
      isLoadingTokens: false,      
    }

    this.submit = this.submit.bind(this)
    this.setImage = this.setImage.bind(this)  
  }


  componentDidMount() {
    isAuthenticated(this.props.currentUser, this.props.history, this.props.wallet)
      .then(() => isInWhitelist(this.props.currentUser, React.whitelist.projectOwnerWhitelist, this.props.history))
      .then(() => checkWalletBalance(this.props.wallet, this.props.history))      
      .then(() => {
        Promise.all([
          // load a single campaigns (when editing)
          new Promise((resolve, reject) => {
            if(!this.props.isNew) {
              feathersClient.service('campaigns').find({query: {_id: this.props.match.params.id}})
                .then((resp) => {
                  if(!isOwner(resp.data[0].owner.address, this.props.currentUser)) {
                    this.props.history.goBack()
                  } else {  
                    this.setState(Object.assign({}, resp.data[0], {
                      id: this.props.match.params.id,
                    }), resolve())  
                  }})
                .catch(() => reject())
            } else {
              resolve()
            }
          })
        ,
          // load all dacs. that aren't pending
          // TO DO: this needs to be replaced by something like http://react-autosuggest.js.org/
          new Promise((resolve, reject) => {
            feathersClient.service('dacs').find({query: {  $select: [ 'title', '_id' ] }})
              .then((resp) => 
                this.setState({
                  //TODO should we filter the available cuases to those that have been mined? It is possible that a createCause tx will fail and the dac will not be available
                  dacsOptions: resp.data.map((c) =>  { return { name: c.title, id: c._id, element: <span>{c.title}</span> } }),
                  // dacsOptions: resp.data.filter((c) => (c.delegateId && c.delegateId > 0)).map((c) =>  { return { label: c.title, value: c._id} }),
                  hasError: false
                }, resolve())
              )
              .catch(() => reject())
          })

        ]).then(() => this.setState({ isLoading: false, hasError: false }), this.focusFirstInput())
          .catch((e) => {
            console.log('error loading', e)
            this.setState({ isLoading: false, hasError: true })        
          })
      })
  }

  focusFirstInput(){
    setTimeout(() => this.refs.title.element.focus(), 500)
  }

  mapInputs(inputs) {
    return {
      'title': inputs.title,
      'description': inputs.description,
      'communityUrl': inputs.communityUrl,
      'reviewerAddress': inputs.reviewerAddress,
      'tokenName': inputs.tokenName,
      'tokenSymbol': inputs.tokenSymbol,
    }
  }  

  setImage(image) {
    this.setState({ image: image, uploadNewImage: true })
  }

  submit(model) {    
    this.setState({ isSaving: true })

    const afterEmit = () => {
      this.setState({ isSaving: false })
      React.toast.success("Your Campaign has been updated!")      
      this.props.history.push('/campaigns')      
    }

    const updateCampaign = (file) => {
      const constructedModel = {
        title: model.title,
        description: model.description,
        communityUrl: model.communityUrl,
        summary: getTruncatedText(this.state.summary, 100),
        image: file,
        projectId: this.state.projectId,
        dacs: this.state.dacs,
        reviewerAddress: model.reviewerAddress      
      }  

      if(this.props.isNew){
        const createCampaign = (txHash) => {
          feathersClient.service('campaigns').create(Object.assign({}, constructedModel, {
            txHash,
            pluginAddress: '0x0000000000000000000000000000000000000000',
            totalDonated: 0,
            donationCount: 0,
            status: 'pending'
          }))
            .then(() => this.props.history.push('/my-campaigns'));
        };

        let txHash;
        let etherScanUrl;
        Promise.all([ getNetwork(), getWeb3() ])
          .then(([ network, web3 ]) => {
            const { liquidPledging } = network;
            etherScanUrl = network.txHash;

            let txHash;
            // web3, lp address, name, parentProject, reviewer, tokenName, tokenSymbol
            LPPCampaign.new(web3, liquidPledging.$address, model.title, '', 0, model.reviewerAddress, model.tokenName, model.tokenSymbol)
              .once('transactionHash', hash => {
                txHash = hash;
                createCampaign(txHash);
                React.toast.info(<p>Your campaign is pending....<br/><a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">View transaction</a></p>)
              })
              .then(() => {
                React.toast.success(<p>Your campaign was created!<br/><a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">View transaction</a></p>)
              })
          })
          .catch(err => {
            console.log('New Campaign transaction failed:', err);
            displayTransactionError(txHash, etherScanUrl)
          });
      } else {
        feathersClient.service('campaigns').patch(this.state.id, constructedModel)
          .then(()=> afterEmit())        
      }
    }

    if(this.state.uploadNewImage) {
      feathersClient.service('/uploads').create({uri: this.state.image}).then(file => updateCampaign(file.url))
    } else {
      updateCampaign()
    }
  } 

  toggleFormValid(state) {
    this.setState({ formIsValid: state })
  }    

  goBack(){
    this.props.history.push('/campaigns')
  }

  constructSummary(text){
    this.setState({ summary: text})
  }

  selectDACs = ({ target: { value: selectedDacs } }) => {
    this.setState({ dacs: selectedDacs })
  }  

  render(){
    const { isNew, history } = this.props
    let { isLoading, isSaving, title, description, image, dacs, dacsOptions, communityUrl, formIsValid, reviewerAddress, tokenName, tokenSymbol } = this.state;

    return(
        <div id="edit-campaign-view">
          <div className="container-fluid page-layout edit-view">
            <div className="row">
              <div className="col-md-8 m-auto">
                { isLoading && 
                  <Loader className="fixed"/>
                }
                
                { !isLoading &&
                  <div>
                    <GoBackButton history={history}/>
                  
                    <div className="form-header">   
                      { isNew &&
                        <h3>Start a new campaign!</h3>
                      }

                      { !isNew &&
                        <h3>Edit campaign {title}</h3>
                      }
                      <p>
                        <i className="fa fa-question-circle"></i>
                        A campaign solves a specific cause by executing a project via its milestones.
                        Funds raised by a campaign need to be delegated to its milestones in order to be paid out.
                      </p>
                    </div>


                    <Form onSubmit={this.submit} mapping={this.mapInputs} onValid={()=>this.toggleFormValid(true)} onInvalid={()=>this.toggleFormValid(false)} layout='vertical'>
                      <Input
                        name="title"
                        id="title-input"
                        label="What are you working on?"
                        ref="title"
                        type="text"
                        value={title}
                        placeholder="E.g. Installing 1000 solar panels."
                        help="Describe your campaign in 1 sentence."
                        validations="minLength:3"
                        validationErrors={{
                            minLength: 'Please provide at least 3 characters.'
                        }}
                        required
                      />

                      <QuillFormsy 
                        name="description"
                        label="Explain how you are going to do this successfully."
                        helpText="Make it as extensive as necessary. Your goal is to build trust, so that people donate Ether to your campaign."                          
                        value={description}
                        placeholder="Describe how you're going to execute your campaign successfully..."
                        onTextChanged={(content)=>this.constructSummary(content)}
                        validations="minLength:20"  
                        help="Describe your campaign."   
                        validationErrors={{
                            minLength: 'Please provide at least 10 characters.'
                        }}                    
                        required                                        
                      />

                      <FormsyImageUploader setImage={this.setImage} previewImage={image} isRequired={isNew}/>

                      <div className="form-group">
                        <label>Relate your campaign to a community</label>
                        <small className="form-text">By relating your campaign to a community, Ether from that community can be delegated to your campaign. This increases your chances of successfully funding your campaign.</small> 
                        <InputToken
                          name="dac"
                          placeholder="Select one or more communities (DACs)"
                          value={dacs}
                          options={dacsOptions}
                          onSelect={this.selectDACs}/>

                      </div>

                      <div className="form-group">
                        <Input
                          name="communityUrl"
                          id="community-url"
                          ref="communityUrl"
                          label="Url to join your community"
                          type="text"
                          value={communityUrl}
                          placeholder="https://slack.giveth.com"
                          help="Where can people join your community? Giveth redirect people there."
                          validations="isUrl"
                          validationErrors={{
                            isUrl: 'Please provide a url.'
                          }}
                        />
                      </div>

                      <div className="form-group">
                        <Input
                          name="tokenName"
                          id="token-name-input"
                          label="Token Name"
                          ref="tokenName"
                          type="text"
                          value={tokenName}
                          placeholder={title}
                          help="The name of the token that givers will receive when they donate to this campaign."
                          validations="minLength:3"
                          validationErrors={{
                            minLength: 'Please provide at least 3 characters.'
                          }}
                          required
                          disabled={!isNew}
                        />
                      </div>

                      <div className="form-group">
                        <Input
                          name="tokenSymbol"
                          id="token-symbol-input"
                          label="Token Symbol"
                          ref="tokenSymbol"
                          type="text"
                          value={tokenSymbol}
                          help="The symbol of the token that givers will receive when they donate to this campaign."
                          validations="minLength:2"
                          validationErrors={{
                            minLength: 'Please provide at least 2 characters.'
                          }}
                          required
                          disabled={!isNew}
                        />
                      </div>

                      <Input
                        name="reviewerAddress"
                        id="title-input"
                        label="Reviewer Address"
                        type="text"
                        value={reviewerAddress}
                        placeholder="0x0000000000000000000000000000000000000000"
                        help="This person or smart contract will be reviewing your campaign to increase trust for donators. It has been automatically assigned."
                        validations="isEtherAddress"
                        validationErrors={{
                            isEtherAddress: 'Please enter a valid Ethereum address.'
                        }}                    
                        required
                        disabled={true}
                      />                                           

                      <LoaderButton
                        className="btn btn-success" 
                        formNoValidate={true} 
                        type="submit" 
                        disabled={isSaving || !formIsValid}
                        isLoading={isSaving}
                        loadingText="Saving...">
                        Create Campaign
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

export default EditCampaign

EditCampaign.propTypes = {
  currentUser: currentUserModel,
  history: PropTypes.object.isRequired,
  isNew: PropTypes.bool
}
