import React, { Component } from 'react'
import SkyLight from 'react-skylight'
import { utils } from 'web3';
import getNetwork from '../lib/blockchain/getNetwork';

import { feathersClient } from '../lib/feathersClient'
import { Form } from 'formsy-react-components';
import { takeActionAfterWalletUnlock } from '../lib/middleware'
import { displayTransactionError } from '../lib/helpers'


import InputToken from "react-input-token";

class DelegateButton extends Component {
  constructor() {
    super()

    this.state = {
      isSaving: false,
      objectsToDelegateTo: [],
    }

    this.submit = this.submit.bind(this)
  }

  openDialog(){
    takeActionAfterWalletUnlock(this.props.wallet, () => this.refs.donateDialog.show())    
  }

  selectedObject = ({ target: { value: selectedObject } }) => {
    this.setState({ objectsToDelegateTo: selectedObject })
  }    


  submit(model) {
    const { toBN } = utils;
    this.setState({ isSaving: true })
    
    // find the type of where we delegate to
    const admin = this.props.types.find((t) => { return t.id === this.state.objectsToDelegateTo[0]});

    // TODO find a more friendly way to do this.
    if (admin.type === 'milestone' && toBN(admin.maxAmount).lt(toBN(admin.totalDonated || 0).add(toBN(this.props.model.amount)))) {
      React.toast.error('That milestone has reached its funding goal. Please pick another');
      return;
    }

    const delegate = (etherScanUrl, txHash) => {
      const mutation = {
        txHash,
        status: 'pending'
      };

      if (admin.type.toLowerCase() === 'dac') {
        Object.assign(mutation, {
          delegate: admin.delegateId,
          delegateId: admin._id
        });
      } else {
        Object.assign(mutation, {
          proposedProject: admin.projectId,
          proposedProjectId: admin._id,
          proposedProjectType: admin.type,
        })
      }

      feathersClient.service('/donations').patch(this.props.model._id, mutation)
        .then(donation => {
          this.resetSkylight()

          // For some reason (I suspect a rerender when donations are being fetched again)
          // the skylight dialog is sometimes gone and this throws error
          if (this.refs.donateDialog) this.refs.donateDialog.hide()

          let msg;
          if (admin.type === 'milestone' || 'campaign') {
            msg = React.swal.msg(`The donation has been delegated, <a href=${etherScanUrl}tx/${txHash} target="_blank" rel="noopener noreferrer">view the transaction here.</a>
            The donator has <strong>3 days</strong> to reject your delegation before the money gets locked.`)
          } else {
            msg = React.swal.msg(`The donation has been delegated, <a href=${etherScanUrl}tx/${txHash} target="_blank" rel="noopener noreferrer">view the transaction here.</a> The donator has been notified.`)
          }

          React.swal({
            title: "Delegated!", 
            content: msg,
            icon: 'success',
          })          
      }).catch((e) => {
        console.log(e)
        displayTransactionError(txHash, etherScanUrl)
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
        const receiverId = (admin.type === 'dac') ? admin.delegateId : admin.projectId;

        return liquidPledging.transfer(senderId, this.props.model.pledgeId, this.props.model.amount, receiverId)
          .once('transactionHash', hash => {
            txHash = hash;
            delegate(etherScanUrl, txHash);
          });
      })
      .then(() => {
        React.toast.success(<p>Your donation has been confirmed!<br/><a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">View transaction</a></p>)
      }).catch((e) => {
        console.error(e);
        displayTransactionError(txHash, etherScanUrl)
        this.setState({ isSaving: false });
    })
  }

  resetSkylight(){
    this.setState({ 
      isSaving: false,
      objectsToDelegateTo: []
    })
  }


  render(){
    const { types, milestoneOnly } = this.props
    let { isSaving, objectsToDelegateTo } = this.state
    const style = { display: 'inline-block' }

    return(
      <span style={style}>
        <a className="btn btn-success btn-sm" onClick={() => this.openDialog()}>
          Delegate
        </a>

        <SkyLight hideOnOverlayClicked ref="donateDialog" title="Delegate Donation" afterClose={() => this.resetSkylight()}>

          { milestoneOnly &&
            <p>Select a Milestone to delegate this donation to</p>
          }

          { !milestoneOnly &&
            <p>Select a DAC, Campaign or Milestone to delegate this donation to</p>
          }

          <Form onSubmit={this.submit} layout='vertical'>
            <div className="form-group">
              <InputToken
                name="campaigns"
                ref="campaignsInput"
                placeholder={milestoneOnly? "Select a milestone" : "Select a dac or campaign"}
                value={objectsToDelegateTo}
                options={types}
                onSelect={this.selectedObject}
                maxLength={1}/>
            </div>

            <button className="btn btn-success" formNoValidate={true} type="submit" disabled={isSaving || this.state.objectsToDelegateTo.length === 0}>
              {isSaving ? "Delegating..." : "Delegate here"}
            </button>
          </Form>

        </SkyLight>
      </span>
    )
  }
}

export default DelegateButton
