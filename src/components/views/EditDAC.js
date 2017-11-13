import React, { Component } from 'react'
import PropTypes from 'prop-types'
import LPPDac from 'lpp-dac';

import { Form, Input } from 'formsy-react-components';
import { feathersClient } from '../../lib/feathersClient'
import Loader from '../Loader'
import QuillFormsy from '../QuillFormsy'
import FormsyImageUploader from './../FormsyImageUploader'
import GoBackButton from '../GoBackButton'
import { isOwner } from '../../lib/helpers'
import { isAuthenticated } from '../../lib/middleware'
import getNetwork from "../../lib/blockchain/getNetwork";
import getWeb3 from "../../lib/blockchain/getWeb3";
import { getTruncatedText } from '../../lib/helpers'
import LoaderButton from "../../components/LoaderButton"
import currentUserModel from '../../models/currentUserModel'
import { displayTransactionError } from '../../lib/helpers'

/**
 * Create or edit a dac (DAC)
 *
 *  @props
 *    isNew (bool):
 *      If set, component will load an empty model.
 *      If not set, component expects an id param and will load a dac object from backend
 *
 *  @params
 *    id (string): an id of a dac object
 */

class EditDAC extends Component {
  constructor() {
    super()

    this.state = {
      isLoading: true,
      isSaving: false,
      formIsValid: false,

      // DAC model
      title: '',
      description: '',
      summary: '',
      image: '',
      videoUrl: '',
      communityUrl: '',
      tokenName: '',
      tokenSymbol: '',
      delegateId: 0,
      ownerAddress: null,
      uploadNewImage: false
    }

    this.submit = this.submit.bind(this)
    this.setImage = this.setImage.bind(this)
  }

  componentDidMount() {
    isAuthenticated(this.props.currentUser, this.props.history, this.props.wallet).then(()=> {
      if(!this.props.isNew) {
        feathersClient.service('dacs').find({query: {_id: this.props.match.params.id}})
          .then((resp) => {
            if(!isOwner(resp.data[0].owner.address, this.props.currentUser)) {
              this.props.history.goBack()
            } else {
              this.setState(Object.assign({}, resp.data[0], {
                id: this.props.match.params.id,
                isLoading: false
              }), this.focusFirstInput())
            }
          })
          .catch(()=>
            this.setState( {
              isLoading: false,
              hasError: true
            }))
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
      'description': inputs.description,
      'communityUrl': inputs.communityUrl,
      'tokenName': inputs.tokenName,
      'tokenSymbol': inputs.tokenSymbol,
    }
  }

  setImage(image) {
    this.setState({ image: image, uploadNewImage: true })
  }

  submit(model) {
    this.setState({ isSaving: true })

    const afterEmit = (isNew) => {
      this.setState({ isSaving: false })
      isNew ? React.toast.success("Your DAC was created!") : React.toast.success("Your DAC has been updated!")
      this.props.history.push('/dacs')
    }

    const updateDAC = (file) => {
      const constructedModel = {
        title: model.title,
        description: model.description,
        communityUrl: model.communityUrl,
        summary: getTruncatedText(this.state.summary, 100),
        delegateId: this.state.delegateId,
        image: file,
      };

      if(this.props.isNew){
        const createDAC = (txHash) => {
          feathersClient.service('dacs').create(Object.assign({}, constructedModel, {
              txHash,
              totalDonated: 0,
              donationCount: 0,
            }))
            .then(() => this.props.history.push('/my-dacs'));
        };

        let txHash;
        let etherScanUrl;
        Promise.all([ getNetwork(), getWeb3() ])
          .then(([ network, web3 ]) => {
            const { liquidPledging } = network;
            etherScanUrl = network.etherscan;

            LPPDac.new(web3, liquidPledging.$address, model.title, '', 0, model.tokenName, model.tokenSymbol)
              .once('transactionHash', hash => {
                txHash = hash;
                createDAC(txHash);
                React.toast.info(<p>Your DAC is pending....<br/><a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">View transaction</a></p>)
              })
              .then(() => {
                React.toast.success(<p>Your DAC has been created!<br/><a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">View transaction</a></p>)
                afterEmit(true);
              })
          })
          .catch(err => {
            console.log('New DAC transaction failed:', err);
            displayTransactionError(txHash, etherScanUrl)
          });
      } else {
        feathersClient.service('dacs').patch(this.state.id, constructedModel)
          .then(()=> afterEmit())
      }
    }

    if(this.state.uploadNewImage) {
      feathersClient.service('/uploads').create({uri: this.state.image}).then(file => updateDAC(file.url))
    } else {
      updateDAC()
    }
  }

  toggleFormValid(state) {
    this.setState({ formIsValid: state })
  }  

  goBack(){
    this.props.history.push('/dacs')
  }

  constructSummary(text){
    this.setState({ summary: text})
  }

  render(){
    const { isNew, history } = this.props
    let { isLoading, isSaving, title, description, image, communityUrl, tokenName, tokenSymbol, formIsValid } = this.state;

    return(
        <div id="edit-dac-view">
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
                        <h3>Start a Decentralized Altruistic Community (DAC)!</h3>
                      } 

                      { !isNew &&
                        <h1>Edit DAC</h1>
                      }

                      <p><i className="fa fa-question-circle"></i>A DAC aims to solve a cause by building a community, raising funds and delegating those funds to campaigns that solve its cause.</p>
                    </div>

                    <Form onSubmit={this.submit} mapping={this.mapInputs} onValid={()=>this.toggleFormValid(true)} onInvalid={()=>this.toggleFormValid(false)} layout='vertical'>
                      <Input
                        name="title"
                        id="title-input"
                        label="Community cause"
                        ref="title"
                        type="text"
                        value={title}
                        placeholder="e.g. Hurricane relief."
                        help="Describe your Decentralized Altruistic Community (DAC) in 1 sentence."
                        validations="minLength:3"
                        validationErrors={{
                            minLength: 'Please provide at least 3 characters.'
                        }}
                        required
                      />

                      <QuillFormsy
                        name="description"
                        label="Explain how you are going to solve this your cause"
                        helpText="Make it as extensive as necessary. Your goal is to build trust, so that people join your community and/or donate Ether."
                        value={description}
                        placeholder="Describe how you're going to solve your cause..."
                        onTextChanged={(content)=>this.constructSummary(content)}
                        validations="minLength:20"
                        help="Describe your dac."
                        validationErrors={{
                            minLength: 'Please provide at least 10 characters.'
                        }}
                        required
                      />

                      <FormsyImageUploader setImage={this.setImage} previewImage={image} isRequired={isNew}/>

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

                      <div className="form-group">
                        <Input
                          name="tokenName"
                          id="token-name-input"
                          label="Token Name"
                          ref="tokenName"
                          type="text"
                          value={tokenName}
                          placeholder={title}
                          help="The name of the token that givers will receive when they donate to this dac."
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
                          help="The symbol of the token that givers will receive when they donate to this dac."
                          validations="minLength:2"
                          validationErrors={{
                            minLength: 'Please provide at least 2 characters.'
                          }}
                          required
                          disabled={!isNew}
                        />
                      </div>

                      <LoaderButton
                        className="btn btn-success" 
                        formNoValidate={true} 
                        type="submit" 
                        disabled={isSaving || !formIsValid}
                        isLoading={isSaving}
                        loadingText="Saving...">
                        Create DAC
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

export default EditDAC

EditDAC.propTypes = {
  currentUser: currentUserModel,
  history: PropTypes.object.isRequired,
  isNew: PropTypes.bool
}
