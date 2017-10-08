import React, { Component } from 'react'
import { utils } from 'web3';
import PropTypes from 'prop-types'


class CardStats extends Component {
  render(){
    const { totalDonated, donationCount, maxAmount, campaignsCount, milestonesCount, type, status } = this.props

    return(
      <div className="row card-stats">
        <div className="col-4 text-left">
          <span><i className="fa fa-male"></i>{donationCount}</span>
          <p>people</p>
        </div>

        <div className="col-4 text-center">
          { maxAmount && 
            <span>&#926;{totalDonated && utils.fromWei(totalDonated)} of &#926; {utils.fromWei(maxAmount)}</span>
          }

          { !maxAmount &&
            <span>&#926; {totalDonated && utils.fromWei(totalDonated)}</span>
          }
          <p>donated</p>
        </div>  

        <div className="col-4 text-right">
          {type === 'dac' &&
            <div>
              <span><i className="fa fa-flag"></i>{campaignsCount}</span>
              <p>campaign(s)</p>
            </div>
          }

          {type === 'campaign' &&
            <div>
              <span><i className="fa fa-check-circle"></i>{milestonesCount}</span>
              <p>milestone(s)</p>
            </div>
          }

          {type === 'milestone' &&
            <div>
              <span><i className="fa fa-check-circle"></i>{status}</span>
              <p>status</p>
            </div>
          }                     
        </div>               
      </div>        
    )
  }
}

export default CardStats

CardStats.PropTypes = {
  type: PropTypes.string.isRequired,
  donationCount: PropTypes.number.isRequired,
  totalDonated: PropTypes.string.isRequired,
  campaignsCount: PropTypes.number,
  milestonesCount: PropTypes.number,
  status: PropTypes.string
}