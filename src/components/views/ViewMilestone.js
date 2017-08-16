import React, { Component } from 'react'
import { socket } from './../../lib/feathersClient'
import Loader from './../Loader'

/**
  Shows details of an individual milestone
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
    this.setState({ id: this.props.match.params.milestoneId })

    socket.emit('milestones::find', {_id: this.props.match.params.milestoneId}, (error, resp) => {   
      console.log(resp) 
      if(resp) {  
        const r = resp.data[0]

        this.setState({
          id: this.props.match.params.id,
          title: r.title,
          description: r.description,
          image: r.image,
          videoUrl: r.videoUrl,
          ownerAddress: r.ownerAddress,
          reviewerAddress: r.reviewerAddress,
          recipientAddress: r.recipientAddress,
          donationsReceived: r.donationsReceived,
          donationsGiven: r.donationsGiven,
          completionDeadline: r.completionDeadline,
          completionStatus: r.completionStatus,
          isLoading: false,
          hasError: false
        })  
      } else {
        this.setState( { 
          isLoading: false,
          hasError: true
        })
      }
    }) 
  }

  render() {
    let { id, isLoading, title, description, recipientAddress, reviewerAddress, completionDeadline, image } = this.state

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
                  <p>Milestone</p>
                                    
                  <h1 className="milestone-title">{title}</h1>
                  <img className="milestone-header-image" src={image} alt=""/>
                  <div dangerouslySetInnerHTML={{__html: description}}></div>

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