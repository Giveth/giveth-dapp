import React, { Component } from 'react'
import SkyLight from 'react-skylight'
import { utils } from 'web3';
import LPPCampaign from 'lpp-campaign';
import LPPDac from 'lpp-dac';

import { feathersClient } from '../lib/feathersClient'
import { Form } from 'formsy-react-components';
import { takeActionAfterWalletUnlock, checkWalletBalance } from '../lib/middleware'
import { displayTransactionError } from '../lib/helpers'
import getNetwork from '../lib/blockchain/getNetwork';
import getWeb3 from '../lib/blockchain/getWeb3';


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
    takeActionAfterWalletUnlock(this.props.wallet, () => 
      checkWalletBalance(this.props.wallet, this.props.history)
        .then(() => this.refs.donateDialog.show()))
  }

  selectedObject = ({ target: { value: selectedObject } }) => {
    this.setState({ objectsToDelegateTo: selectedObject })
  }    


  submit() {
      const { toBN } = utils;
      const { model } = this.props;
      this.setState({ isSaving: true })
      
      // find the type of where we delegate to
      const admin = this.props.types.find((t) => { return t.id === this.state.objectsToDelegateTo[0]});

      // TODO find a more friendly way to do this.
      if (admin.type === 'milestone' && toBN(admin.maxAmount).lt(toBN(admin.totalDonated || 0).add(toBN(model.amount)))) {
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
            intendedProject: admin.projectId,
            intendedProjectId: admin._id,
            intendedProjectType: admin.type,
          })
        }

        feathersClient.service('/donations').patch(model._id, mutation)
          .then(donation => {
            this.resetSkylight()

            // For some reason (I suspect a rerender when donations are being fetched again)
            // the skylight dialog is sometimes gone and this throws error
            if (this.refs.donateDialog) this.refs.donateDialog.hide()

            let msg;
            if (admin.type === 'milestone' || 'campaign') {
              msg = React.swal.msg(<p>The donation has been delegated, <a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">view the transaction here.</a>
              The donator has <strong>3 days</strong> to reject your delegation before the money gets locked.</p>)
            } else {
              msg = React.swal.msg(<p>The donation has been delegated, <a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">view the transaction here.</a> The donator has been notified.</p>)
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
      
      Promise.all([ getNetwork(), getWeb3() ])
        .then(([ network, web3 ]) => {
          const { liquidPledging } = network;
          etherScanUrl = network.etherscan;

          const senderId = (model.delegate > 0) ? model.delegate : model.owner;
          const receiverId = (admin.type === 'dac') ? admin.delegateId : admin.projectId;
          let contract;

          if (model.ownerType === 'campaign') contract = new LPPCampaign(web3, model.ownerEntity.pluginAddress);
          else if (model.ownerType === 'giver' && model.delegate > 0) contract = new LPPDac(web3, model.delegateEntity.pluginAddress);
          else contract = liquidPledging;

          return contract.transfer(senderId, model.pledgeId, model.amount, receiverId, { $extraGas: 50000 })
            .once('transactionHash', hash => {
              txHash = hash;
              delegate(etherScanUrl, txHash);
            }).on('error', console.log);
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
                placeholder={milestoneOnly? "Select a milestone" : "Select a campaign or milestone"}
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
