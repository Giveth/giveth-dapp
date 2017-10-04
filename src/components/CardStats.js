import React, { Component } from 'react'
import { utils } from 'web3';
import PropTypes from 'prop-types'


class CardStats extends Component {
  render(){
    const { totalDonated, donationCount, campaignsCount } = this.props

    return(
      <div className="row card-stats">
        <div className="col-4 text-left">
          <span><i className="fa fa-male"></i>{donationCount}</span>
          <p>people</p>
        </div>

        <div className="col-4 text-center">
          <span>&#926; {totalDonated && utils.fromWei(totalDonated)}</span>
          <p>donated</p>
        </div>  

        <div className="col-4 text-right">
          <span><i className="fa fa-flag"></i>{campaignsCount}</span>
          <p>campaigns</p>
        </div>               
      </div>        
    )
  }
}

export default CardStats

CardStats.PropTypes = {
  donationCount: PropTypes.number.isRequired,
  totalDonated: PropTypes.string.isRequired,
  campaignsCount: PropTypes.number
}