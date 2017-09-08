import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { feathersClient } from '../../lib/feathersClient'
import { paramsForServer } from 'feathers-hooks-common'

import Loader from '../Loader'
import { Link } from 'react-router-dom'
import Milestone from '../Milestone'
import loadAndWatchFeatherJSResource from '../../lib/loadAndWatchFeatherJSResource'
import GoBackButton from '../GoBackButton'
import { isOwner } from '../../lib/helpers'
import BackgroundImageHeader from '../BackgroundImageHeader'
import Avatar from 'react-avatar'
import DonateButton from '../DonateButton'
import ShowTypeDonations from '../ShowTypeDonations'
import AuthenticatedLink from '../AuthenticatedLink'

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
          .then(resp => this.setState(resp.data[0], resolve()))
          .catch(() => this.setState({ hasError: true }, reject()))
      })
    ,
      new Promise((resolve, reject) => {
        new loadAndWatchFeatherJSResource('milestones', {campaignId: campaignId}, (resp, err) => {
          console.log(err, resp)
          if(resp){
            this.setState({ milestones: resp.data }, resolve())
          } else {
            reject()           
          }
        })         
      })
    ]).then(() => this.setState({ isLoading: false, hasError: false }))
      .catch((e) => {
        console.log('error loading', e)
        this.setState({ isLoading: false, hasError: true })        
      })  


    // lazy load donations             
    const query = paramsForServer({
      query: { type_id: campaignId },
      schema: 'includeDonorDetails'
    });

    // TODO rewrite feathers-reactive 'smart' strategy to re-fetch the updated object if $client params are present
    feathersClient.service('/donations').watch({ listStrategy: 'always' }).find(query)
      .subscribe(resp => {
        this.setState({
          donations: resp.data,
          isLoadingDonations: false,
          errorLoadingDonations: false
        },
        err => {
          if (err) {
            console.log('donations error ->', err);
            this.setState({ isLoadingDonations: false, errorLoadingDonations: true })
          }
        })
      })
  }

  removeMilestone(id){
    const milestones = feathersClient.service('/milestones');
    milestones.remove(id).then(milestone => console.log('Remove a milestone', milestone));
  }    

  render() {
    const { history, currentUser, wallet } = this.props
    let { isLoading, id, title, description, image, milestones, owner, donations, isLoadingDonations } = this.state

    return (
      <div id="view-campaign-view">
        { isLoading && 
          <Loader className="fixed"/>
        }
        
        { !isLoading &&
          <div>
            <BackgroundImageHeader image={image} height={300} >
              <Link to={`/profile/${ owner.address }`}>
                <Avatar size={50} src={owner.avatar} round={true}/>                  
                <p className="small">{owner.name}</p>
              </Link> 
              <h6>Campaign</h6>
              <h1>{title}</h1>

              <DonateButton type="campaign" model={{ title: title, _id: id }}/>
            </BackgroundImageHeader>

            <div className="row">
              <div className="col-md-8 m-auto">            

                <GoBackButton history={history}/>

                <div className="content">
                  <h2>About this DAC</h2>
                  <div dangerouslySetInnerHTML={{__html: description}}></div>
                </div>            

                <hr/>

                <h3>Milestones</h3>
                { isOwner(owner.address, currentUser) && 
                  <AuthenticatedLink className="btn btn-primary btn-sm pull-right" to={`/campaigns/${ id }/milestones/new`} wallet={wallet}>Add Milestone</AuthenticatedLink>
                }

                {milestones.length > 0 && milestones.map((m, i) => 
                  <Milestone 
                    model={m} 
                    currentUser={currentUser}
                    key={i} 
                    removeMilestone={()=>this.removeMilestone(m._id)}/>
                )}
              </div>
            </div>

            <div className="row">
              <div className="col-md-8 m-auto">    
                <h4>Donations</h4>        
                <ShowTypeDonations donations={donations} isLoading={isLoadingDonations} />  
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
  history: PropTypes.object.isRequired
}