import React, { Component } from 'react'
import SkyLight from 'react-skylight'
import { utils } from 'web3';
import getNetwork from '../lib/blockchain/getNetwork';

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
    const { toBN } = utils;
    this.setState({ isSaving: true })
    
    // find the type of where we delegate to
    const manager = this.props.types.find((t) => { return t.id === this.state.campaignsToDelegateTo[0]});

    // TODO find a more friendly way to do this.
    if (manager.type === 'milestone' && toBN(manager.maxAmount).lt(toBN(manager.totalDonated || 0).add(toBN(this.props.model.amount)))) {
      React.toast.error('That milestone has reached its funding goal. Please pick another');
      return;
    }

    const delegate = (etherScanUrl, txHash) => {
      const mutation = {
        txHash,
        status: 'pending'
      };

      if (manager.type.toLowerCase() === 'dac') {
        Object.assign(mutation, {
          delegate: manager.delegateId,
          delegateId: manager._id
        });
      } else {
        Object.assign(mutation, {
          proposedProject: manager.projectId,
          proposedProjectId: manager._id,
          proposedProjectType: manager.type,
        })
      }

      feathersClient.service('/donations').patch(this.props.model._id, mutation)
        .then(donation => {
          this.resetSkylight()

          // For some reason (I suspect a rerender when donations are being fetched again)
          // the skylight dialog is sometimes gone and this throws error
          if (this.refs.donateDialog) this.refs.donateDialog.hide()

          if (manager.type === 'milestone' || 'campaign') {
            React.swal("You're awesome!", `The donation has been delegated. The donator has 3 days to reject your delegation before the money gets locked. ${etherScanUrl}tx/${txHash}`, 'success')
          } else {
            React.swal("Delegated", `The donation has been delegated successfully. The donator has been notified. ${etherScanUrl}tx/${txHash}`, 'success')
          }

      }).catch((e) => {
        console.log(e)
        React.swal("Oh no!", "Something went wrong with the transaction. Please try again.", 'error')
        this.setState({ isSaving: false })
      })
    };

    let txHash;
    let etherScanUrl;
    getNetwork()
      .then((network) => {
        const { liquidPledging } = network;
        etherScanUrl = network.etherscan;

        const senderId = (this.props.model.delegate > 0) ? this.props.model.delegate : this.props.model.owner;
        const receiverId = (manager.type === 'dac') ? manager.delegateId : manager.projectId;

        return liquidPledging.transfer(senderId, this.props.model.noteId, this.props.model.amount, receiverId)
          .once('transactionHash', hash => {
            txHash = hash;
            delegate(etherScanUrl, txHash);
          });
      })
      .then(() => {
        React.toast.success(`Your donation has been confirmed! ${etherScanUrl}tx/${txHash}`);
      }).catch((e) => {
        console.error(e);

        let msg;
        if (txHash) {
          //TODO need to update feathers to reset the donation to previous state as this tx failed.
          msg = `Something went wrong with the transaction. ${etherScanUrl}tx/${txHash}`;
        } else {
          msg = "Something went wrong with the transaction. Is your wallet unlocked?";
        }

        React.swal("Oh no!", msg, 'error');
        this.setState({ isSaving: false });
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
