import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { socket } from './../../lib/feathersClient'
import Loader from './../Loader'
import GoBackButton from '../GoBackButton'

/**
  Loads and shows a single milestone

  @route params:
    milestoneId (string): id of a milestone
**/

class ViewMilestone extends Component {
  constructor() {
    super()

    this.state = {
      isLoading: true,
      hasError: false
    }
  }  

  componentDidMount() {
    socket.emit('milestones::find', {_id: this.props.match.params.milestoneId}, (error, resp) => {   
      if(resp) {  
        this.setState(Object.assign({}, resp.data[0], {
          isLoading: false,
          hasError: false
        }))  
      } else {
        this.setState( { 
          isLoading: false,
          hasError: true
        })
      }
    }) 
  }

  render() {
    const { history } = this.props

    let { isLoading, 
          title, 
          description, 
          recipientAddress, 
          reviewerAddress, 
          ownerAddress,
          completionDeadline, 
          image,
          donationsReceived,
          donationsGiven
    } = this.state

    return (
      <div id="view-milestone-view">
        <div className="container-fluid page-layout">
          <div className="row">
            <div className="col-md-8 m-auto">
              { isLoading && 
                <Loader className="fixed"/>
              }
              
              { !isLoading &&
                <div>
                  <GoBackButton history={history}/>

                  <p>Milestone</p>
                                    
                  <h1 className="milestone-title">{title}</h1>
                  <img className="milestone-header-image" src={image} alt=""/>
                  <div dangerouslySetInnerHTML={{__html: description}}></div>

                  <hr/>

                  <p>Reviewer address: {reviewerAddress}</p>
                  <p>Owner address: {ownerAddress}</p>
                  <p>Recipient address: {recipientAddress}</p>
                  <p>Completion deadline: {completionDeadline}</p>
                  <p>Donations received: {donationsReceived}</p>
                  <p>Donations given: {donationsGiven}</p>

                </div>
              }
            </div>
          </div>
        </div>
      </div>
    )
  } 
}

export default ViewMilestone

ViewMilestone.propTypes = {
  history: PropTypes.object.isRequired
}