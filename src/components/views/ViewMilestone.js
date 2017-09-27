import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import { feathersClient } from './../../lib/feathersClient'
import { paramsForServer } from 'feathers-hooks-common'

import Loader from './../Loader'
import GoBackButton from '../GoBackButton'
import BackgroundImageHeader from '../BackgroundImageHeader'
import Avatar from 'react-avatar'
import DonateButton from '../DonateButton'
import ShowTypeDonations from '../ShowTypeDonations'


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
    //TODO fetch "non comitted" donations? add "proposedProjectId: milestoneId" to query to get all "pending aproval" donations for this milestone
    const query = paramsForServer({ 
      query: { ownerId: milestoneId },
      schema: 'includeDonorDetails'
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
          owner
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
              
              <DonateButton type="milestone" model={{ title: title, _id: id, managerId: projectId }} wallet={wallet} currentUser={currentUser}/>
            </BackgroundImageHeader>

            <div className="container-fluid">

              <div className="row">
                <div className="col-md-8 m-auto">
                  <div>
                    <GoBackButton history={history}/>

                    <center>
                      <Link to={`/profile/${ owner.address }`}>
                        <Avatar size={50} src={owner.avatar} round={true}/>                  
                        <p className="small">{owner.name}</p>
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
                </div>
              </div>                          

              <div className="row spacer-top-50 spacer-bottom-50">
                <div className="col-md-8 m-auto">    
                  <h4>Donations</h4>        
                  <ShowTypeDonations donations={donations} isLoading={isLoadingDonations} />  
                  <DonateButton type="milestone" model={{ title: title, _id: id, managerId: projectId }} wallet={wallet} currentUser={currentUser}/>
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
  currentUser: PropTypes.string.required
}