import React, { Component } from 'react'
import SkyLight from 'react-skylight'

import { feathersClient } from '../lib/feathersClient'
import { Form } from 'formsy-react-components';

import InputToken from "react-input-token";

class DelegateButton extends Component {
  constructor() {
    super()

    this.state = {
      isSaving: false,
      campaignsToDelegateTo: [],
    }

    this.submit = this.submit.bind(this)
  }

  openDialog(){
    this.refs.donateDialog.show()
  }

  selectedCampaign = ({ target: { value: selectedCampaign } }) => {
    this.setState({ campaignsToDelegateTo: selectedCampaign })
  }    


  submit(model) {
    this.setState({ isSaving: true })
    
    // find the type of where we delegate to
    const type = this.props.types.find((t) => { return t.id === this.state.campaignsToDelegateTo[0]}).type

    feathersClient.service('/donations').patch(this.props.model._id, {
      status: type === 'milestone' ? 'pending' : 'waiting', // if type is a milestone, the money will be pending before being locked
      type: type,
      type_id: this.state.campaignsToDelegateTo[0], // for now we don't support splitting, but we could in the future
      from_type_id: this.props.model._id,
      delegated_by: this.props.currentUser
    }).then(donation => {
      this.resetSkylight()

      // For some reason (I suspect a rerender when donations are being fetched again)
      // the skylight dialog is sometimes gone and this throws error
      if(this.refs.donateDialog) this.refs.donateDialog.hide()

      if(type === 'milestone') {
        React.swal("You're awesome!", "The donation has been delegated. The donator has 3 days to reject your delegation before the money gets locked.", 'success')
      } else {
        React.swal("Delegated", "The donation has been delegated successfully. The donator has been notified.", 'success')        
      }

    }).catch((e) => {
      console.log(e)
      React.swal("Oh no!", "Something went wrong with the transaction. Please try again.", 'error')
      this.setState({ isSaving: false })
    })
  }

  resetSkylight(){
    this.setState({ 
      isSaving: false,
      campaignsToDelegateTo: []
    })
  }


  render(){
    const { types } = this.props
    let { isSaving, campaignsToDelegateTo } = this.state
    const style = { display: 'inline-block' }

    return(
      <span style={style}>
        <a className="btn btn-success btn-sm" onClick={() => this.openDialog()}>
          Delegate
        </a>

        <SkyLight hideOnOverlayClicked ref="donateDialog" title="Delegate Donation" afterClose={() => this.resetSkylight()}>

          <p>Select a DAC, Campaign or Milestone to delegate this donation to</p>

          <Form onSubmit={this.submit} layout='vertical'>
            <div className="form-group">
              <InputToken
                name="campaigns"
                ref="campaignsInput"
                placeholder="Select a campaign to delegate the money to"
                value={campaignsToDelegateTo}
                options={types}
                onSelect={this.selectedCampaign}
                maxLength={1}/>
            </div>

            <button className="btn btn-success" formNoValidate={true} type="submit" disabled={isSaving || this.state.campaignsToDelegateTo.length === 0}>
              {isSaving ? "Delegating..." : "Delegate here"}
            </button>
          </Form>

        </SkyLight>
      </span>
    )
  }
}

export default DelegateButton
