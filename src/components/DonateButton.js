import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SkyLight from 'react-skylight'
import { utils } from 'web3';
import getNetwork from '../lib/blockchain/getNetwork';

import { feathersClient } from '../lib/feathersClient'
import { Form, Input } from 'formsy-react-components';
import { takeActionAfterWalletUnlock } from '../lib/middleware'
import currentUserModel from '../models/currentUserModel'
import { displayTransactionError } from '../lib/helpers'

class DonateButton extends Component {
  constructor() {
    super()

    this.state = {
      isSaving: false,
      formIsValid: false,
      amount: 10
    }

    this.submit = this.submit.bind(this)
  }

  componentDidMount() {
    //TODO currentUser should probably store the profile object instead of just the address
    //this is tmp until we work on the same branch to reduce conflicts when merging
    feathersClient.service('users').get(this.props.currentUser.address)
      .then(user => this.setState({user}));
  }

  openDialog(){
    takeActionAfterWalletUnlock(this.props.wallet, () => this.refs.donateDialog.show())
  }

  focusInput(){
    this.refs.amount.element.focus()
  }

  toggleFormValid(state) {
    this.setState({ formIsValid: state })
  }


  submit(model) {
    console.log(model, this.props.type.toLowerCase(), this.props.model.managerId);

    this.setState({ isSaving: true });

    const amount = utils.toWei(model.amount);
    const service = feathersClient.service('donations');

    const donate = (etherScanUrl, txHash) => {
      const donation = {
        amount,
        txHash,
        status: 'pending',
      };

      if (this.props.type.toLowerCase() === 'dac') {
        Object.assign(donation, {
          delegate: this.props.model.managerId,
          delegateId: this.props.model._id,
          owner: this.state.user.donorId || 0,
          ownerId: this.props.currentUser,
          ownerType: 'donor'
        });
      } else {
        Object.assign(donation, {
          owner: this.props.model.managerId,
          ownerId: this.props.model._id,
          ownerType: this.props.type.toLowerCase()
        })
      }

      return service.create(donation)
        .then(() =>{
          this.setState({
            isSaving: false,
            amount: 10
          });

        // For some reason (I suspect a rerender when donations are being fetched again)
        // the skylight dialog is sometimes gone and this throws error
        if(this.refs.donateDialog) this.refs.donateDialog.hide()
        
        let msg;
        if(this.props.type === "DAC") {
          msg = React.swal.msg(
            <p> 
              You're donation is pending, <a href=${etherScanUrl}tx/${txHash} target="_blank" rel="noopener noreferrer">view the transaction here.</a>
              You have full control of this donation and <strong>can take it back at any time</strong>. 
              You will also have a <strong>3 day window</strong> to veto the use of these funds upon delegation by the dac.
            </p>
            <p>Do make sure to <a href=${this.props.commmunityUrl} target="_blank" rel="noopener noreferrer">join the community</a> to follow the progress of this DAC.</p>)
        } else {
          msg = React.swal.msg(
            <p>You're donation is pending.</p>
            <p>Do make sure to <a href=${this.props.commmunityUrl} target="_blank" rel="noopener noreferrer">join the community</a> to follow the progress of this DAC.</p>)
        }

        React.swal({
          title: "You're awesome!", 
          content: msg,
          icon: 'success',
        })
      });
    }

    let txHash;
    let etherScanUrl;
    getNetwork()
      .then((network) => {
        const { liquidPledging } = network;
        etherScanUrl = network.etherscan;

        return liquidPledging.donate(this.state.user.donorId || 0, this.props.model.managerId, { value: amount })
          .once('transactionHash', hash => {
            txHash = hash;
            donate(etherScanUrl, txHash);
          });
      })
      .then(() => {
        React.toast.success(<p>Your donation has been confirmed!<br/><a href={`${etherScanUrl}tx/${txHash}`} target="_blank" rel="noopener noreferrer">View transaction</a></p>)
      }).catch((e) => {
        console.log(e);
        displayTransactionError(txHash, etherScanUrl)

        this.setState({ isSaving: false });
      })
  }


  render() {
    const { type, model, currentUser } = this.props
    let { isSaving, amount, formIsValid } = this.state;
    const style = {
      display: 'inline-block'     
    }

    return(
      <span style={style}>
        <a className={`btn btn-success ${!currentUser ? 'disabled' : ''}`} onClick={() => this.openDialog()}>
          Donate
        </a>

        <SkyLight hideOnOverlayClicked ref="donateDialog" title={`Support this ${type}!`}
                  afterOpen={() => this.focusInput()}>
          <strong>Give Ether to support <em>{model.title}</em></strong>

          {[ "DAC", "campaign" ].indexOf(type) > -1 &&
          <p>Note: as long as the {type} owner does not lock your money you can take it back any time.</p>
          }

          <Form onSubmit={this.submit} mapping={this.mapInputs} onValid={() => this.toggleFormValid(true)}
                onInvalid={() => this.toggleFormValid(false)} layout='vertical'>
            <div className="form-group">
              <Input
                name="amount"
                id="amount-input"
                label="Amount of Ether"
                ref="amount"
                type="number"
                value={amount}
                placeholder="10"
                validations="minLength:1"
                validationErrors={{
                  minLength: 'Please enter an amount.'
                }}
                required
              />
            </div>

            <button className="btn btn-success" formNoValidate={true} type="submit" disabled={isSaving || !formIsValid}>
              {isSaving ? "Saving..." : "Donate ETH"}
            </button>
          </Form>

        </SkyLight>
      </span>
    )
  }
}

export default DonateButton

DonateButton.propTypes = {
  type: PropTypes.string.isRequired,
  model: PropTypes.shape({
    managerId: PropTypes.string.isRequired,
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
  }).isRequired,
  currentUser: currentUserModel,
  communityUrl: PropTypes.string
};
