import React, { Component } from 'react'
import { socket } from '../../lib/feathersClient'
import Loader from '../Loader'

/**
  Shows details of an individual cause
**/

class ViewCause extends Component {
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
      ownerAddress: null
    }
  }  

  componentDidMount() {
    socket.emit('causes::find', {_id: this.props.match.params.id}, (error, resp) => {      
      this.setState({
        title: resp.data[0].title,
        description: resp.data[0].description,
        image: resp.data[0].image,
        videoUrl: resp.data[0].videoUrl,
        donationsReceived: resp.data[0].donationsReceived,
        donationsGiven: resp.data[0].donationsGiven,
        balance: resp.data[0].balance,
        ownerAddress: resp.data[0].ownerAddress,     
        isLoading: false
      })      
    })
  }

  render() {
    let { isLoading, title, description, image } = this.state

    return (
      <div id="view-cause-view">
        <div className="container-fluid page-layout">
          <div className="row">
            <div className="col-md-8 offset-md-2">
              { isLoading && 
                <Loader className="fixed"/>
              }
              
              { !isLoading &&
                <div>
                  <p>Democratic Autonomous Charity</p>
                  <h1 className="cause-title">{title}</h1>
                  <img className="cause-header-image" src={image} alt=""/>
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

export default ViewCause