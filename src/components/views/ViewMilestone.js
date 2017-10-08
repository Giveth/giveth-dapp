import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { utils } from 'web3';

import { feathersClient } from './../../lib/feathersClient'
import { paramsForServer } from 'feathers-hooks-common'

import Loader from './../Loader'
import GoBackButton from '../GoBackButton'
import BackgroundImageHeader from '../BackgroundImageHeader'
import Avatar from 'react-avatar'
import DonateButton from '../DonateButton'
import ShowTypeDonations from '../ShowTypeDonations'
import currentUserModel from '../../models/currentUserModel'
import { getUserName, getUserAvatar } from '../../lib/helpers'


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
      hasError: false,
      isLoadingDonations: true,
      errorLoadingDonations: false,
      donations: []      
    }
  }  

  componentDidMount() {
    const milestoneId = this.props.match.params.milestoneId

    this.setState({ id: milestoneId })

    feathersClient.service('milestones').find({ query: {_id: milestoneId }})
      .then(resp =>
        this.setState(Object.assign({}, resp.data[0], {  
          isLoading: false,
          hasError: false
        })))
      .catch(() =>
        this.setState({ isLoading: false, hasError: true })
      )

    // lazy load donations
    //TODO fetch "non comitted" donations? add "intendedProjectId: milestoneId" to query to get all "pending aproval" donations for this milestone
    const query = paramsForServer({ 
      query: { ownerId: milestoneId },
      schema: 'includeGiverDetails'
    })  
    
    this.donationsObserver = feathersClient.service('donations').watch({ listStrategy: 'always' }).find(query).subscribe(
      resp =>
        this.setState({
          donations: resp.data,
          isLoadingDonations: false,
          errorLoadingDonations: false
        }),
      err => this.setState({ isLoadingDonations: false, errorLoadingDonations: true })
    )     
  }

  componentWillUnmount() {
    this.donationsObserver.unsubscribe()
  } 

  isActiveMilestone() {
    return this.state.status === 'InProgress' && this.state.totalDonated < this.state.maxAmount
  } 

  render() {
    const { history, wallet, currentUser } = this.props

    let { isLoading, 
          id,
          projectId,
          title, 
          description, 
          recipientAddress, 
          reviewerAddress, 
          completionDeadline, 
          image,
          donations,
          isLoadingDonations,
          ownerAddress,
          owner,
          maxAmount,
          totalDonated
    } = this.state

    return (
      <div id="view-milestone-view">
        { isLoading && 
          <Loader className="fixed"/>
        }
        
        { !isLoading &&
          <div>
            <BackgroundImageHeader image={image} height={300} >
              <h6>Milestone</h6>
              <h1>{title}</h1>
              
              { this.isActiveMilestone() && 
                <DonateButton type="milestone" model={{ title: title, _id: id, adminId: projectId }} wallet={wallet} currentUser={currentUser} history={history}/>
              }

              { !this.state.status === 'InProgress' &&
                <p>This milestone is not active anymore</p>
              }

              { this.state.totalDonated >= this.state.maxAmount &&
                <p>This milestone has reached its funding goal.</p>
              }              

            </BackgroundImageHeader>

            <div className="container-fluid">

              <div className="row">
                <div className="col-md-8 m-auto">
                  <div>
                    <GoBackButton history={history}/>

                    <center>
                      <Link to={`/profile/${ ownerAddress }`}>
                        <Avatar size={50} src={getUserAvatar(owner)} round={true}/>                  
                        <p className="small">{getUserName(owner)}</p>
                      </Link> 
                    </center>

                    <div className="card content-card">
                      <div className="card-body content">
                        <div dangerouslySetInnerHTML={{__html: description}}></div>
                      </div>
                    </div>              
                  </div>
                </div>
              </div>  

              <div className="row spacer-top-50">
                <div className="col-md-8 m-auto">  
                  <h4>Details</h4>
                  <p>Reviewer address: {reviewerAddress}</p>
                  <p>Recipient address: {recipientAddress}</p>
                  <p>Completion deadline: {completionDeadline}</p>   
                  <p>Max amount to raise: &#926;{utils.fromWei(maxAmount)}</p>  
                  <p>Amount donated: &#926;{totalDonated}</p>      

                </div>
              </div>                          

              <div className="row spacer-top-50 spacer-bottom-50">
                <div className="col-md-8 m-auto">    
                  <h4>Donations</h4>        
                  <ShowTypeDonations donations={donations} isLoading={isLoadingDonations} />  
                  { this.isActiveMilestone() && 
                    <DonateButton type="milestone" model={{ title: title, _id: id, adminId: projectId }} wallet={wallet} currentUser={currentUser} history={history}/>
                  }
                </div>
              </div> 

            </div>
          </div>                
        }
      </div>
    )
  } 
}

export default ViewMilestone

ViewMilestone.propTypes = {
  history: PropTypes.object.isRequired,
  currentUser: currentUserModel
}