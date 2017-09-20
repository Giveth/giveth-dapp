import React, { Component } from 'react'
import SkyLight from 'react-skylight'

import { feathersClient } from '../lib/feathersClient'
import { Form, Input } from 'formsy-react-components';

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

    console.log('blah', this.state.campaignsToDelegateTo)
    

    const type = this.props.types.find((t) => { return t.id === this.state.campaignsToDelegateTo[0]}).type
    console.log(type)

    feathersClient.service('/donations').patch(this.props.model._id, {
      status: type === 'milestone' ? 'pending' : 'waiting',
      type_id: this.state.campaignsToDelegateTo[0],
      from_type_id: this.props.model._id
    }).then(donation => {
      this.setState({
        isSaving: false,
        campaignsToDelegateTo: []
      })

      // For some reason (I suspect a rerender when donations are being fetched again)
      // the skylight dialog is sometimes gone and this throws error
      if(this.refs.donateDialog) this.refs.donateDialog.hide()

      React.swal("You're awesome!", "The donation has been delegated. The donator has 3 days to reject your delegation.", 'success')

    }).catch((e) => {
      console.log(e)
      React.swal("Oh no!", "Something went wrong with the transaction. Please try again.", 'error')
      this.setState({ isSaving: false })
    })
  }


  render(){
    const { types, model } = this.props
    let { isSaving, campaignsToDelegateTo } = this.state
    const style = {
      display: 'inline-block'     
    }

    return(
      <span style={style}>
        <a className="btn btn-success" onClick={() => this.openDialog()}>
          Delegate
        </a>

        <SkyLight hideOnOverlayClicked ref="donateDialog" title="Delegate Donation">

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
              {isSaving ? "Saving..." : "Donate ETH"}
            </button>
          </Form>

        </SkyLight>
      </span>
    )
  }
}

export default DelegateButton
