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
    console.log(model)

    this.setState({ isSaving: true })

    feathersClient.service('/donations').create({
      amount: parseInt(model.amount),
      type: this.props.type.toLowerCase(),
      _id: this.props.model._id,
    }).then(user => {
      this.setState({ 
        isSaving: false,
        amount: 10
      })
      this.refs.donateDialog.hide()
    }).catch((e) => {
      this.setState({ isSaving: false })
    })
  }   


  render(){
    const { type, objectId, model } = this.props
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