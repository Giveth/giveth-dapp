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
    }
  }  

  componentDidMount() {
    socket.emit('causes::find', {_id: this.props.match.params.id}, (error, resp) => {      
      this.setState({
        title: resp.data[0].title,
        description: resp.data[0].description,
        image: resp.data[0].image,
        videoUrl: resp.data[0].videoUrl,
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
                  <h1 className="cause-title">{title}</h1>
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