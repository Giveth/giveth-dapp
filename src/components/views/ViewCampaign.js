import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { feathersClient } from '../../lib/feathersClient'
import { paramsForServer } from 'feathers-hooks-common'

import Loader from '../Loader'
import { Link } from 'react-router-dom'
import Milestone from '../Milestone'
import GoBackButton from '../GoBackButton'
import { isOwner, getUserName, getUserAvatar } from '../../lib/helpers'
import BackgroundImageHeader from '../BackgroundImageHeader'
import Avatar from 'react-avatar'
import DonateButton from '../DonateButton'
import ShowTypeDonations from '../ShowTypeDonations'
import AuthenticatedLink from '../AuthenticatedLink'

import currentUserModel from '../../models/currentUserModel'

/**
  Loads and shows a single campaign

  @route params:
    id (string): id of a campaign
**/

class ViewCampaign extends Component {
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
    const campaignId = this.props.match.params.id

    this.setState({ id: campaignId })

    Promise.all([
      new Promise((resolve, reject) => {
        feathersClient.service('campaigns').find({ query: {_id: campaignId }})
          .then(resp => {
            console.log(resp)
            this.setState(resp.data[0], resolve())
          })
          .catch((e) => {
            console.log(e)
            this.setState({ hasError: true }, reject())
          })
      })
    ,
      new Promise((resolve, reject) => {
        this.milestoneObserver = feathersClient.service('milestones').watch({ strategy: 'always' }).find({ query: {
          campaignId: campaignId,
          projectId: {
            $gt: '0' // 0 is a pending milestone
          }         
        }}).subscribe(
          resp => {
            console.log(resp.data)
            this.setState({ milestones: resp.data }, resolve())
          },
          err => reject()
        )    
      })
    ]).then(() => this.setState({ isLoading: false, hasError: false }))
      .catch((e) => {
        console.log('error loading', e)
        this.setState({ isLoading: false, hasError: true })        
      })  


    // lazy load donations             
    this.donationsObserver = feathersClient.service('donations/history').watch({ listStrategy: 'always' }).find({
      query: {
        ownerId: campaignId,
      },
    }).subscribe(
      resp => 
        this.setState({
          donations: resp.data,
          isLoadingDonations: false,
          errorLoadingDonations: false
        }),
      err =>
        this.setState({ isLoadingDonations: false, errorLoadingDonations: true })
    ) 
  }

  componentWillUnmount() {
    this.donationsObserver.unsubscribe()
    this.milestoneObserver.unsubscribe()
  } 

  removeMilestone(id){
    React.swal({
      title: "Delete Milestone?",
      text: "You will not be able to recover this milestone!",
      icon: "warning",
      dangerMode: true,
    }).then(() => {
      const milestones = feathersClient.service('/milestones');
      milestones.remove(id).then(milestone => console.log('Remove a milestone', milestone));
    })
  }    

  render() {
    const { history, currentUser, wallet } = this.props
    let { isLoading, id, projectId, title, description, image, milestones, owner, donations, isLoadingDonations } = this.state

    return (
      <div id="view-campaign-view">
        { isLoading && 
          <Loader className="fixed"/>
        }
        
        { !isLoading &&
          <div>
            <BackgroundImageHeader image={image} height={300} >
              <h6>Campaign</h6>
              <h1>{title}</h1>

              <DonateButton type="campaign" model={{ title: title, _id: id, adminId: projectId}} wallet={wallet} currentUser={currentUser}/>
            </BackgroundImageHeader>

            <div className="container-fluid">

              <div className="row">
                <div className="col-md-8 m-auto">            

                  <GoBackButton history={history}/>

                  <center>
                    <Link to={`/profile/${ owner.address }`}>
                      <Avatar size={50} src={getUserAvatar(owner)} round={true}/>                  
                      <p className="small">{getUserName(owner)}</p>
                    </Link>
                  </center>                

                  <div className="card content-card ">
                    <div className="card-body content">
                      <div dangerouslySetInnerHTML={{__html: description}}></div>
                    </div>
                  </div>                
        
                  <div className="milestone-header spacer-top-50 card-view">
                    <h3>Milestones</h3>
                    { isOwner(owner.address, currentUser) && 
                      <AuthenticatedLink className="btn btn-primary btn-sm pull-right" to={`/campaigns/${ id }/milestones/new`} wallet={wallet}>Add Milestone</AuthenticatedLink>
                    }

                    {milestones.length > 0 && milestones.map((m, i) => 
                      <Milestone 
                        model={m} 
                        currentUser={currentUser}
                        key={i}
                        history={history} 
                        wallet={wallet}
                        removeMilestone={()=>this.removeMilestone(m._id)}/>
                    )}
                  </div>
                </div>
              </div>

              <div className="row spacer-top-50 spacer-bottom-50">
                <div className="col-md-8 m-auto">    
                  <h4>Donations</h4>        
                  <ShowTypeDonations donations={donations} isLoading={isLoadingDonations} />  
                  <DonateButton type="campaign" model={{ title: title, _id: id, adminId: projectId }} wallet={wallet} currentUser={currentUser}/>
                </div>
              </div>  

            </div>            
          </div>
        }
      </div>
    )
  } 
}

export default ViewCampaign

ViewCampaign.propTypes = {
  history: PropTypes.object.isRequired,
  currentUser: currentUserModel
}