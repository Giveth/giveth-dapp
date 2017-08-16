import React, { Component } from 'react'
import { socket, feathersClient } from '../../lib/feathersClient'
import Loader from '../Loader'
import { Link } from 'react-router-dom'
import Milestone from '../Milestone'
import loadAndWatchFeatherJSResource from '../../lib/loadAndWatchFeatherJSResource'

/**
  Shows details of an individual campaign
**/

class ViewCampaign extends Component {
  constructor() {
    super()

    this.state = {
      isLoading: true,
      title: '',
      description: '',
      image: '',
      videoUrl: '',  
      donationsReceived: 0,
      donationsGiven: 0,
      balance: 0,
      ownerAddress: null,
      milestones: []
    }
  }  

  componentDidMount() {
    this.setState({ id: this.props.match.params.id })

    Promise.all([
      new Promise((resolve, reject) => {
        socket.emit('campaigns::find', {_id: this.props.match.params.id}, (error, resp) => {      
          console.log(error, resp)
          if(resp) {
            this.setState({
              title: resp.data[0].title,
              description: resp.data[0].description,
              image: resp.data[0].image,
              videoUrl: resp.data[0].videoUrl,
              donationsReceived: resp.data[0].donationsReceived,
              donationsGiven: resp.data[0].donationsGiven,
              balance: resp.data[0].balance,
              ownerAddress: resp.data[0].ownerAddress,     
            }, resolve())   
          } else {
            this.setState({ hasError: true }, reject())
          }
        })
      })
    ,
      new Promise((resolve, reject) => {
        new loadAndWatchFeatherJSResource('milestones', {campaignId: this.props.match.params.id}, (resp, err) => {
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
    let { isLoading, id, title, description, image, milestones } = this.state

    return (
      <div id="view-campaign-view">
        <div className="container-fluid page-layout">
          <div className="row">
            <div className="col-md-8 m-auto">
              { isLoading && 
                <Loader className="fixed"/>
              }
              
              { !isLoading &&
                <div>
                  <p>Campaign</p>
                                    
                  <h1 className="campaign-title">{title}</h1>
                  <img className="campaign-header-image" src={image} alt=""/>
                  <div dangerouslySetInnerHTML={{__html: description}}></div>

                  <hr/>

                  <h3>Milestones
                  <Link className="btn btn-primary btn-sm pull-right" to={`/campaigns/${ id }/milestones/new`}>Add milestone</Link>
                  </h3>
                  
                  {milestones.length > 0 && milestones.map((m, i) => 
                    <Milestone model={m} key={i} removeMilestone={()=>this.removeMilestone(m._id)}/>
                  )}
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    )
  } 
}

export default ViewCampaign