import React, { Component } from 'react'
import { utils } from 'web3';
import PropTypes from 'prop-types'


class CardStats extends Component {
  render(){
    const { totalDonated, donationCount } = this.props

    return(
      <div className="row card-stats">
        <div className="col-6">
          {donationCount} people
        </div>
        <div className="col-6">
          &#926;{utils.fromWei(totalDonated)} donated
        </div>
      </div>        
    )
  }
}

export default CardStats

CardStats.PropTypes = {
  donationCount: PropTypes.number.isRequired,
  totalDonated: PropTypes.string.isRequired
}