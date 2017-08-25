import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { socket, feathersClient } from '../../lib/feathersClient'
import Loader from '../Loader'
import { Link } from 'react-router-dom'
import Milestone from '../Milestone'
import loadAndWatchFeatherJSResource from '../../lib/loadAndWatchFeatherJSResource'
import GoBackButton from '../GoBackButton'
import { isOwner } from '../../lib/helpers'
import BackgroundImageHeader from '../BackgroundImageHeader'
import Avatar from 'react-avatar'
import DonateButton from '../DonateButton'

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
      hasError: false
    }
  }  

  componentDidMount() {
    this.setState({ id: this.props.match.params.id })

    Promise.all([
      new Promise((resolve, reject) => {
        socket.emit('campaigns::find', {_id: this.props.match.params.id}, (error, resp) => {      
          console.log(resp)
          if(resp) {
            this.setState(resp.data[0], resolve())   
          } else {
            this.setState({ hasError: true }, reject())
          }
        })
      })
    ,
      new Promise((resolve, reject) => {
        new loadAndWatchFeatherJSResource('milestones', {campaignId: this.props.match.params.id}, (resp, err) => {
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
  }

  removeMilestone(id){
    const milestones = feathersClient.service('/milestones');
    milestones.remove(id).then(milestone => console.log('Remove a milestone', milestone));
  }    

  render() {
    const { history, currentUser } = this.props
    let { isLoading, id, title, description, image, milestones, owner } = this.state

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

              <DonateButton type="campaign" model={{ title: title, id: id }}/>
            </BackgroundImageHeader>

            <div className="row">
              <div className="col-md-8 m-auto">            

                <GoBackButton history={history}/>

                <div className="content">
                  <h2>About this DAC</h2>
                  <div dangerouslySetInnerHTML={{__html: description}}></div>
                </div>            


                <hr/>

                <h3>Milestones
                  { isOwner(owner.address, currentUser) && 
                    <Link className="btn btn-primary btn-sm pull-right" to={`/campaigns/${ id }/milestones/new`}>Add milestone</Link>
                  }
                </h3>

                {milestones.length > 0 && milestones.map((m, i) => 
                  <Milestone 
                    model={m} 
                    currentUser={currentUser}
                    key={i} 
                    removeMilestone={()=>this.removeMilestone(m._id)}/>
                )}
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