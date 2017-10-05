import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { Form, Input } from 'formsy-react-components';
import { feathersClient } from '../../lib/feathersClient'
import Loader from '../Loader'
import QuillFormsy from '../QuillFormsy'
import FormsyImageUploader from './../FormsyImageUploader'
import GoBackButton from '../GoBackButton'
import { isOwner } from '../../lib/helpers'
import { isAuthenticated } from '../../lib/middleware'
import getNetwork from "../../lib/blockchain/getNetwork";
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
      'communityUrl': inputs.communityUrl
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
        summary: getTruncatedText(this.state.summary, 200),
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
        getNetwork()
          .then(network => {
            const { liquidPledging } = network;
            etherScanUrl = network.txHash;

            liquidPledging.addDelegate(model.title, '', 0, '0x0')
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
    let { isLoading, isSaving, title, description, image, communityUrl, formIsValid } = this.state

    return(
        <div id="edit-dac-view">
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
                      <h1>Start a Decentralized Altruistic Community!</h1>
                    }

                    { !isNew &&
                      <h1>Edit DAC</h1>
                    }


                    <Form onSubmit={this.submit} mapping={this.mapInputs} onValid={()=>this.toggleFormValid(true)} onInvalid={()=>this.toggleFormValid(false)} layout='vertical'>
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
                          label="What dac are you solving?"
                          value={description}
                          placeholder="Describe your dac..."
                          onTextChanged={(content)=>this.constructSummary(content)}
                          validations="minLength:10"
                          help="Describe your dac."
                          validationErrors={{
                              minLength: 'Please provide at least 10 characters.'
                          }}
                          required
                        />
                      </div>

                      <FormsyImageUploader setImage={this.setImage} previewImage={image} isRequired={isNew}/>

                      <div className="form-group">
                        <Input
                          name="communityUrl"
                          id="community-url"
                          ref="communityUrl"
                          label="Url to join your community"
                          type="text"
                          value={communityUrl}
                          placeholder="https://slack.giveth.com"
                          help="Enter the url of your community"
                          validations="isUrl"
                          validationErrors={{
                            isUrl: 'Please provide a url.'
                          }}
                        />
                      </div>

                      <LoaderButton
                        className="btn btn-success" 
                        formNoValidate={true} 
                        type="submit" 
                        disabled={isSaving || !formIsValid}
                        isLoading={isSaving}
                        loadingText="Saving...">
                        Save DAC
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
