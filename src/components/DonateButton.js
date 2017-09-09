import React, { Component } from 'react'
import SkyLight from 'react-skylight'

import { feathersClient } from '../lib/feathersClient'
import { Form, Input } from 'formsy-react-components';

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


  openDialog(){
    this.refs.donateDialog.show()
  }

  focusInput(){
    this.refs.amount.element.focus()    
  }

  toggleFormValid(state) {
    this.setState({ formIsValid: state })
  }  


  submit(model) {    
    console.log(model, this.props.type.toLowerCase(), this.props.model._id)

    this.setState({ isSaving: true })

    feathersClient.service('/donations').create({
      amount: parseFloat(model.amount, 10),
      type: this.props.type.toLowerCase(),
      type_id: this.props.model._id,
    }).then(user => {
      this.setState({ 
        isSaving: false,
        amount: 10
      })

      // For some reason (I suspect a rerender when donations are being fetched again) 
      // the skylight dialog is sometimes gone and this throws error
      if(this.refs.donateDialog) this.refs.donateDialog.hide()

      if(this.props.type === "DAC") {
        React.swal("You're awesome!", "You're donation has been received. As long as the organizer doesn't lock your money you can take it back any time. Please make sure you join the community to follow progress of this DAC.", 'success')
      } else {
        React.swal("You're awesome!", "You're donation has been received. Please make sure to join the community to follow progess of this project.", 'success')
      }
    }).catch((e) => {
      console.log(e)
      React.swal("Oh no!", "Something went wrong with the transaction. Please try again.", 'error')
      this.setState({ isSaving: false })
    })
  }   


  render(){
    const { type, model } = this.props
    let { isSaving, amount, formIsValid } = this.state

    return(
      <span>
        <a className="btn btn-success" onClick={() => this.openDialog()}>
          GivETH
        </a>  

        <SkyLight hideOnOverlayClicked ref="donateDialog" title={`Support this ${type}!`} afterOpen={()=>this.focusInput()}>
          <h4>Give Ether to support {model.title}</h4>

          {["DAC", "campaign"].indexOf(type) > -1 &&
            <p>Note: as long as the {type} owner does not lock your money you can take it back any time.</p>
          }

          <Form onSubmit={this.submit} mapping={this.mapInputs} onValid={()=>this.toggleFormValid(true)} onInvalid={()=>this.toggleFormValid(false)} layout='vertical'>
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